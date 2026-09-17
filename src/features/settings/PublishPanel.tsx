import { Database, GitBranch, HardDrive, RefreshCw, Rocket, TriangleAlert } from 'lucide-react';

import type { useSettings } from './useSettings';

type Model = ReturnType<typeof useSettings>;
export function PublishPanel({ model }: { model: Model }) {
  const { result, exportNow, preview, publish, sync, busy } = model;
  return (
    <article className="panel settings-card publish-card">
      <div className="panel-title">
        <span>
          <Rocket size={15} /> PUBLISH ALGORITHMS
        </span>
        <small>REVIEWED EXPORT FLOW</small>
      </div>
      <div className="publish-flow">
        <span>
          <Database size={17} />
          <b>SQLite</b>
        </span>
        <i>→</i>
        <span>
          <HardDrive size={17} />
          <b>Readable export</b>
        </span>
        <i>→</i>
        <span>
          <GitBranch size={17} />
          <b>Private GitHub</b>
        </span>
      </div>
      <p className="publish-scope-note">
        <TriangleAlert size={14} />
        <span>
          <b>Algorithm data only.</b> Commit & Push stages <code>exports/</code>. UI or
          application-source changes still need a normal Git commit.
        </span>
      </p>
      <div className="publish-actions">
        <button onClick={() => exportNow.mutate()} disabled={busy}>
          <HardDrive size={15} /> {exportNow.isPending ? 'Exporting…' : 'Export + backup'}
        </button>
        <button onClick={() => preview.mutate()} disabled={busy}>
          <RefreshCw size={15} /> {preview.isPending ? 'Checking…' : 'Preview changes'}
        </button>
        <button
          className="publish-button"
          onClick={() => publish.mutate()}
          disabled={busy || Boolean(sync?.conflicts.length) || sync?.state === 'invalid'}
        >
          <Rocket size={15} /> {publish.isPending ? 'Publishing…' : 'Commit & Push'}
        </button>
      </div>
      {result?.data?.changes && (
        <div className="diff-preview">
          <header>
            <span>{result.data.proposed_commit}</span>
            <small>
              +{result.data.additions} ~{result.data.updates} −{result.data.deletions}
            </small>
          </header>
          {result.data.warnings?.map((warning) => (
            <p className="warning" key={warning}>
              <TriangleAlert size={12} />
              {warning}
            </p>
          ))}
          {result.data.changes.slice(0, 8).map((change) => (
            <p key={change.path}>
              <i className={change.kind} />
              <span>{change.path}</span>
              <small>{change.kind}</small>
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
