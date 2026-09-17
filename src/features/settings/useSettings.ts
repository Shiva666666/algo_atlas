import { queryKeys } from '../../shared/api/keys';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, writeApi } from '../../shared/api/client';
import type { GitState, SyncDecision, SyncStatus } from '../../shared/contracts/index';

type ResultState = { message?: string; error?: string; data?: GitState };

export function useSettings() {
  const queryClient = useQueryClient();
  const { data: git } = useQuery({
    queryKey: queryKeys.git(),
    queryFn: () => api<GitState>('/api/git'),
  });
  const syncQuery = useQuery({
    queryKey: queryKeys.sync(),
    queryFn: () => api<SyncStatus>('/api/sync/status'),
  });
  const [form, setForm] = useState({
    remote_url: '',
    branch: 'main',
    user_name: '',
    user_email: '',
  });
  const [reduced, setReduced] = useState(
    () => localStorage.getItem('algo-atlas-reduced-motion') === 'true',
  );
  const [result, setResult] = useState<ResultState | null>(null);
  const [decisions, setDecisions] = useState<Record<string, SyncDecision>>({});

  useEffect(() => {
    if (git)
      setForm({
        remote_url: git.remote ?? '',
        branch: git.branch ?? 'main',
        user_name: git.user_name ?? '',
        user_email: git.user_email ?? '',
      });
  }, [git]);
  useEffect(() => {
    setDecisions({});
  }, [syncQuery.data?.review_version]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.sync() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.git() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.problems() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.atlas() }),
    ]);
  };

  const saveGit = useMutation({
    mutationFn: () => writeApi<GitState>('/api/git', 'PATCH', form),
    onSuccess: async (data) => {
      setResult({ message: 'Git settings saved on this device.', data });
      await refreshAll();
    },
    onError: (error: Error) => setResult({ error: error.message }),
  });
  const exportNow = useMutation({
    mutationFn: () =>
      writeApi<{ catalog: { record_count: number }; git: GitState }>(
        '/api/export/preview',
        'POST',
        {},
      ),
    onSuccess: async (data) => {
      setResult({
        message: `Prepared ${data.catalog.record_count} algorithms and created a local backup.`,
        data: data.git,
      });
      await refreshAll();
    },
    onError: (error: Error) => setResult({ error: error.message }),
  });
  const preview = useMutation({
    mutationFn: () => writeApi<GitState>('/api/git/preview', 'POST', {}),
    onSuccess: async (data) => {
      setResult({
        message: data.changes?.length
          ? `${data.changes.length} export files are ready for review.`
          : 'Your algorithm export is already synchronized.',
        data,
      });
      await refreshAll();
    },
    onError: (error: Error) => setResult({ error: error.message }),
  });
  const publish = useMutation({
    mutationFn: () => writeApi<GitState>('/api/git/publish', 'POST', {}),
    onSuccess: async (data) => {
      setResult({
        message:
          data.status === 'no_changes'
            ? 'Nothing new to publish.'
            : 'Algorithm exports published to GitHub.',
        data,
      });
      await refreshAll();
    },
    onError: (error: Error) => setResult({ error: error.message }),
  });
  const restore = useMutation({
    mutationFn: (payload: {
      dry_run: boolean;
      review_version?: string | null;
      decisions?: Record<string, SyncDecision>;
    }) => writeApi<SyncStatus>('/api/export/restore', 'POST', payload),
    onSuccess: async (data) => {
      setDecisions({});
      setResult({
        message: data.applied
          ? `Applied ${data.applied} pulled algorithm change${data.applied === 1 ? '' : 's'} safely.`
          : 'Sync review saved; local work was preserved.',
      });
      await refreshAll();
    },
    onError: (error: Error) => setResult({ error: error.message }),
  });

  const sync = syncQuery.data;
  const allConflictsChosen =
    Boolean(sync?.conflicts.length) && sync!.conflicts.every((conflict) => decisions[conflict.id]);
  const removesLocalData = useMemo(
    () =>
      sync?.conflicts.some((conflict) => {
        const choice = decisions[conflict.id];
        return (
          choice === 'use_incoming' &&
          (conflict.kind === 'incoming_deleted' || conflict.kind === 'identity_conflict')
        );
      }) ?? false,
    [sync?.conflicts, decisions],
  );
  const applyReview = () => {
    if (!sync?.review_version || !allConflictsChosen) return;
    if (
      removesLocalData &&
      !window.confirm(
        'One or more choices remove a local problem. A backup will be created first. Apply these choices?',
      )
    )
      return;
    restore.mutate({ dry_run: false, review_version: sync.review_version, decisions });
  };
  const toggleMotion = () => {
    const next = !reduced;
    setReduced(next);
    localStorage.setItem('algo-atlas-reduced-motion', String(next));
  };
  const busy = exportNow.isPending || preview.isPending || publish.isPending || restore.isPending;
  return {
    queryClient,
    git,
    syncQuery,
    form,
    setForm,
    reduced,
    setReduced,
    result,
    setResult,
    decisions,
    setDecisions,
    refreshAll,
    saveGit,
    exportNow,
    preview,
    publish,
    restore,
    sync,
    allConflictsChosen,
    removesLocalData,
    applyReview,
    toggleMotion,
    busy,
  };
}
