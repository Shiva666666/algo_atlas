import { GitBranch, Save } from 'lucide-react';

import type { useSettings } from './useSettings';

type Model = ReturnType<typeof useSettings>;
export function GitConnection({ model }: { model: Model }) {
  const { git, form, setForm, saveGit } = model;
  return (
    <article className="panel settings-card git-card">
      <div className="panel-title">
        <span>
          <GitBranch size={15} /> PRIVATE GITHUB CONNECTION
        </span>
        <small>{git?.remote ? 'CONNECTED' : 'SETUP REQUIRED'}</small>
      </div>
      <div className="connection-line">
        <i className={git?.remote ? 'connected' : ''} />
        <div>
          <b>{git?.remote ? 'Origin connected' : 'No remote connected'}</b>
          <small>
            {git?.remote || 'Create an empty private GitHub repository, then paste its URL below.'}
          </small>
        </div>
      </div>
      <div className="form-grid">
        <label className="full">
          <span>GITHUB REMOTE URL</span>
          <input
            value={form.remote_url}
            onChange={(event) => setForm({ ...form, remote_url: event.target.value })}
            placeholder="https://github.com/you/algo-atlas.git"
          />
        </label>
        <label>
          <span>BRANCH</span>
          <input
            value={form.branch}
            onChange={(event) => setForm({ ...form, branch: event.target.value })}
          />
        </label>
        <label>
          <span>GIT NAME</span>
          <input
            value={form.user_name}
            onChange={(event) => setForm({ ...form, user_name: event.target.value })}
            placeholder="Your name"
          />
        </label>
        <label className="full">
          <span>GIT EMAIL</span>
          <input
            value={form.user_email}
            onChange={(event) => setForm({ ...form, user_email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <button
        className="secondary-btn"
        onClick={() => saveGit.mutate()}
        disabled={saveGit.isPending}
      >
        <Save size={14} /> {saveGit.isPending ? 'Saving…' : 'Save local Git settings'}
      </button>
    </article>
  );
}
