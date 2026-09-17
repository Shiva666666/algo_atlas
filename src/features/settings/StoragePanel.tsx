import { CheckCircle2, HardDrive } from 'lucide-react';

import type { useSettings } from './useSettings';

type Model = ReturnType<typeof useSettings>;
export function StoragePanel({ model }: { model: Model }) {
  const {} = model;
  return (
    <article className="panel settings-card storage-card">
      <div className="panel-title">
        <span>
          <HardDrive size={15} /> LOCAL STORAGE
        </span>
        <small>SQLITE + FTS5</small>
      </div>
      <div className="storage-visual">
        <i />
        <i />
        <i />
        <span>
          <b>algo_atlas.db</b>
          <small>Source of truth · ignored by Git</small>
        </span>
      </div>
      <ul>
        <li>
          <CheckCircle2 size={13} /> Pulled changes use three-way content comparison
        </li>
        <li>
          <CheckCircle2 size={13} /> Backups are created before imports and exports
        </li>
        <li>
          <CheckCircle2 size={13} /> Deletions and conflicts always require review
        </li>
        <li>
          <CheckCircle2 size={13} /> Export hashes are validated before database writes
        </li>
      </ul>
    </article>
  );
}
