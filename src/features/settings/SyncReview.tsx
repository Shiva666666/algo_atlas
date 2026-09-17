import { ArchiveRestore, CheckCircle2, CloudDownload, RefreshCw } from 'lucide-react';

import type { SyncStatus } from '../../shared/contracts/index';

function syncHeadline(sync: SyncStatus | undefined, isPending: boolean) {
  if (isPending) return 'Checking pulled algorithms…';
  if (!sync) return 'Sync status unavailable';
  if (sync.state === 'invalid') return 'Pulled export needs attention';
  if (sync.conflicts.length)
    return `${sync.conflicts.length} change${sync.conflicts.length === 1 ? '' : 's'} need your review`;
  if (sync.creates || sync.updates)
    return `${sync.creates + sync.updates} safe update${sync.creates + sync.updates === 1 ? '' : 's'} ready`;
  return 'This device is synchronized';
}

import type { useSettings } from './useSettings';

type Model = ReturnType<typeof useSettings>;
export function SyncReview({ model }: { model: Model }) {
  const {
    syncQuery,
    result,
    decisions,
    setDecisions,
    publish,
    restore,
    sync,
    allConflictsChosen,
    applyReview,
    busy,
  } = model;
  return (
    <article
      className={`panel settings-card sync-review-card ${sync?.conflicts.length ? 'has-conflicts' : ''}`}
    >
      <div className="panel-title">
        <span>
          <CloudDownload size={15} /> PULLED ALGORITHM UPDATES
        </span>
        <small>
          {sync?.state === 'clean'
            ? 'CURRENT'
            : sync?.state === 'invalid'
              ? 'INVALID EXPORT'
              : sync?.conflicts.length
                ? 'REVIEW REQUIRED'
                : 'CHECKING'}
        </small>
      </div>
      <div className="sync-summary">
        <div>
          <b>{syncHeadline(sync, syncQuery.isPending)}</b>
          <p>
            {sync?.state === 'invalid'
              ? sync.validation_error
              : sync?.state === 'no_export'
                ? 'No tracked export exists yet. Publish from the device that contains your algorithms.'
                : sync?.conflicts.length
                  ? 'Choose which version to keep for every item. Nothing is overwritten until you apply the review.'
                  : sync?.creates || sync?.updates
                    ? `${sync.creates} new and ${sync.updates} updated algorithms can be imported without replacing local edits.`
                    : `${sync?.local_changes ?? 0} local change${sync?.local_changes === 1 ? '' : 's'} will be included the next time you publish.`}
          </p>
        </div>
        <button
          className="secondary-btn"
          onClick={() => syncQuery.refetch()}
          disabled={syncQuery.isFetching || busy}
        >
          <RefreshCw size={14} /> {syncQuery.isFetching ? 'Checking…' : 'Check again'}
        </button>
      </div>
      {sync?.last_result && (
        <p className="sync-last-result">
          <CheckCircle2 size={14} />
          {sync.last_result.message}
        </p>
      )}
      {Boolean(sync?.creates || sync?.updates) && !sync?.conflicts.length && (
        <div className="sync-safe-action">
          <span>
            Safe incoming changes are applied when the app starts. You can also apply them now.
          </span>
          <button onClick={() => restore.mutate({ dry_run: false })} disabled={busy}>
            <ArchiveRestore size={14} /> Apply safe updates
          </button>
        </div>
      )}
      {Boolean(sync?.conflicts.length) && (
        <div className="conflict-list">
          {sync!.conflicts.map((conflict) => (
            <fieldset className="conflict-item" key={conflict.id}>
              <legend>
                {conflict.local?.title ?? conflict.incoming?.title ?? 'Problem update'}
              </legend>
              <p>{conflict.summary}</p>
              <small>Changed: {conflict.changed_fields.join(', ')}</small>
              <details className="conflict-comparison">
                <summary>Compare versions</summary>
                <div>
                  {conflict.field_comparisons.map((comparison) => (
                    <section key={comparison.field}>
                      <h4>{comparison.label}</h4>
                      <div>
                        <span>
                          <b>This device</b>
                          <pre>{comparison.local}</pre>
                        </span>
                        <span>
                          <b>Pulled version</b>
                          <pre>{comparison.incoming}</pre>
                        </span>
                      </div>
                    </section>
                  ))}
                </div>
              </details>
              <div className="conflict-choices">
                <label>
                  <input
                    type="radio"
                    name={`decision-${conflict.id}`}
                    checked={decisions[conflict.id] === 'keep_local'}
                    onChange={() =>
                      setDecisions((current) => ({ ...current, [conflict.id]: 'keep_local' }))
                    }
                  />
                  <span>
                    <b>Keep this device</b>
                    <small>
                      {conflict.local
                        ? 'Preserve the local version for the next publish.'
                        : 'Keep the local deletion.'}
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name={`decision-${conflict.id}`}
                    checked={decisions[conflict.id] === 'use_incoming'}
                    onChange={() =>
                      setDecisions((current) => ({ ...current, [conflict.id]: 'use_incoming' }))
                    }
                  />
                  <span>
                    <b>Use pulled version</b>
                    <small>
                      {conflict.incoming
                        ? 'Replace with the version from GitHub.'
                        : 'Accept the deletion from GitHub.'}
                    </small>
                  </span>
                </label>
              </div>
            </fieldset>
          ))}
          <div className="conflict-footer">
            <span>
              {Object.keys(decisions).length} of {sync!.conflicts.length} decisions selected
            </span>
            <button
              className="publish-button"
              onClick={applyReview}
              disabled={!allConflictsChosen || busy}
            >
              {restore.isPending ? 'Applying…' : 'Apply reviewed changes'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
