import { useProblemQuery } from '../index';
import { useTaxonomyQuery } from '../../taxonomy/index';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { problemApi, writeApi } from '../../../shared/api/client';
import type {
  Difficulty,
  Problem,
  ProblemPayload,
  ProblemStatus,
} from '../../../shared/contracts/index';

const starterCode = `class Solution:\n    def solve(self, nums: list[int]) -> int:\n        # Record the corrected approach here.\n        pass\n`;
type FormState = {
  title: string;
  url: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  primary_subtag_id: string;
  taxonomy_ids: string[];
  failure_reason_ids: string[];
  python_code: string;
  time_complexity: string;
  space_complexity: string;
  notes: Record<string, string[]>;
  observation: string;
};
const blank: FormState = {
  title: '',
  url: '',
  difficulty: 'Medium',
  status: 'Open',
  primary_subtag_id: '',
  taxonomy_ids: [],
  failure_reason_ids: [],
  python_code: starterCode,
  time_complexity: '',
  space_complexity: '',
  notes: {},
  observation: '',
};

export function useProblemEditor() {
  const { problemId } = useParams();
  const editing = !!problemId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(blank);
  const [message, setMessage] = useState('');
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [repeatReasons, setRepeatReasons] = useState<string[]>([]);
  const [repeatObservation, setRepeatObservation] = useState('');
  const { data: taxonomy } = useTaxonomyQuery();
  const { data: problem } = useProblemQuery(problemId);
  useEffect(() => {
    if (problem) {
      setForm({
        title: problem.title,
        url: problem.url ?? '',
        difficulty: problem.difficulty,
        status: problem.status,
        primary_subtag_id: problem.primary_subtag.id,
        taxonomy_ids: problem.taxonomy.map((t) => t.id),
        failure_reason_ids: problem.mistake_events?.[0]?.reasons.map((r) => r.id) ?? [],
        python_code: problem.python_code ?? '',
        time_complexity: problem.time_complexity,
        space_complexity: problem.space_complexity,
        notes: problem.notes ?? {},
        observation: '',
      });
    } else if (!editing && taxonomy?.sub.length && !form.primary_subtag_id) {
      setForm((current) => ({ ...current, primary_subtag_id: taxonomy.sub[0].id }));
    }
  }, [problem, taxonomy, editing, form.primary_subtag_id]);
  const subgroups = useMemo(
    () =>
      taxonomy?.main.map((main) => ({
        main,
        children: taxonomy.sub.filter((sub) => sub.parent_id === main.id),
      })) ?? [],
    [taxonomy],
  );
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: 'taxonomy_ids' | 'failure_reason_ids', id: string) =>
    update(
      key,
      form[key].includes(id) ? form[key].filter((value) => value !== id) : [...form[key], id],
    );
  const save = useMutation({
    mutationFn: async () => {
      const payload: ProblemPayload = {
        title: form.title,
        url: form.url || null,
        difficulty: form.difficulty,
        status: form.status,
        primary_subtag_id: form.primary_subtag_id,
        taxonomy_ids: form.taxonomy_ids,
        failure_reason_ids: form.failure_reason_ids,
        python_code: form.python_code,
        time_complexity: form.time_complexity,
        space_complexity: form.space_complexity,
        notes: form.notes,
        observation: form.observation,
      };
      return editing
        ? problemApi.update(problemId!, payload)
        : (problemApi.create(payload) as Promise<Problem>);
    },
    onSuccess: (saved: any) => {
      queryClient.invalidateQueries();
      setMessage('Signal saved to your local atlas.');
      if (!editing) navigate(`/problems/${saved.id}`, { replace: true });
    },
    onError: (error) => setMessage(error.message),
  });
  const assist = useMutation({
    mutationFn: () => writeApi<any>('/api/import/leetcode', 'POST', { url: form.url }),
    onSuccess: (data) => {
      update('title', data.title);
      update('difficulty', data.difficulty);
      if (data.source_key)
        setForm((current) => ({
          ...current,
          title: data.title,
          difficulty: data.difficulty,
          taxonomy_ids: [
            ...new Set([
              ...current.taxonomy_ids,
              ...data.suggestions.filter((s: any) => s.kind === 'pattern').map((s: any) => s.id),
            ]),
          ],
        }));
      setMessage(data.warning ?? 'LeetCode metadata mapped to your taxonomy.');
    },
    onError: (error) => setMessage(error.message),
  });
  const remove = async () => {
    if (problemId && window.confirm('Delete this problem and its mistake history?')) {
      await problemApi.remove(problemId);
      queryClient.invalidateQueries();
      navigate('/library');
    }
  };
  const addRepeat = async () => {
    if (!problemId) return;
    await writeApi(`/api/problems/${problemId}/mistakes`, 'POST', {
      reason_ids: repeatReasons,
      observation: repeatObservation,
    });
    setRepeatOpen(false);
    setRepeatReasons([]);
    setRepeatObservation('');
    queryClient.invalidateQueries();
    setMessage('Repeat mistake added to the signal history.');
  };
  const noteValue = (key: string) => (form.notes[key] ?? []).join('\n');
  const updateNotes = (key: string, value: string) =>
    update('notes', {
      ...form.notes,
      [key]: value
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
    });
  const openVisualizer = () => {
    if (!problemId) return;
    const tab = window.open(`/problems/${problemId}/visualize`, '_blank', 'noopener,noreferrer');
    if (tab) tab.opener = null;
  };
  return {
    problemId,
    editing,
    navigate,
    queryClient,
    form,
    setForm,
    message,
    setMessage,
    repeatOpen,
    setRepeatOpen,
    repeatReasons,
    setRepeatReasons,
    repeatObservation,
    setRepeatObservation,
    taxonomy,
    problem,
    subgroups,
    update,
    toggle,
    save,
    assist,
    remove,
    addRepeat,
    noteValue,
    updateNotes,
    openVisualizer,
  };
}
