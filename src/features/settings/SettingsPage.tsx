import { SyncReview } from './SyncReview';
import { GitConnection } from './GitConnection';
import { PublishPanel } from './PublishPanel';
import { StoragePanel } from './StoragePanel';
import { PreferencesPanel } from './PreferencesPanel';

import { CheckCircle2, ShieldCheck, TriangleAlert } from 'lucide-react';

import { useSettings } from './useSettings';
export function SettingsPage() {
  const model = useSettings();
  const { result, setResult, sync } = model;
  return (
    <section className="page-scroll">
      <div className="page-heading">
        <div>
          <h2>Settings & sync</h2>
          <p>
            Pull code with Git, then reopen the app. Algo Atlas rebuilds changed UI and safely
            reconciles algorithm exports.
          </p>
        </div>
        <span className="local-shield">
          <ShieldCheck size={15} /> 127.0.0.1 ONLY
        </span>
      </div>
      {result && (
        <div
          className={`result-banner ${result.error ? 'error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {result.error ? <TriangleAlert size={16} /> : <CheckCircle2 size={16} />}
          <span>{result.error ?? result.message}</span>
          <button onClick={() => setResult(null)}>Dismiss</button>
        </div>
      )}
      <div className="settings-grid">
        <SyncReview model={model} />

        <GitConnection model={model} />

        <PublishPanel model={model} />

        <StoragePanel model={model} />

        <PreferencesPanel model={model} />
      </div>
    </section>
  );
}
