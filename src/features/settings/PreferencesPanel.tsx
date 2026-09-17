import { ShieldCheck } from 'lucide-react';

import type { useSettings } from './useSettings';

type Model = ReturnType<typeof useSettings>;
export function PreferencesPanel({ model }: { model: Model }) {
  const { reduced, toggleMotion } = model;
  return (
    <article className="panel settings-card preference-card">
      <div className="panel-title">
        <span>VISUAL PREFERENCES</span>
        <small>DEVICE-LOCAL</small>
      </div>
      <button className="toggle-row" onClick={toggleMotion}>
        <span>
          <b>Reduced motion</b>
          <small>Use the 2D atlas and disable ambient animation.</small>
        </span>
        <i className={reduced ? 'on' : ''}>
          <em />
        </i>
      </button>
      <div className="security-note">
        <ShieldCheck size={18} />
        <span>
          <b>No account. No cloud database.</b>
          <small>Write APIs require a trusted local origin and application marker.</small>
        </span>
      </div>
    </article>
  );
}
