import { Link2 } from 'lucide-react';

import type { Difficulty, ProblemStatus } from '../../../shared/contracts/index';

import type { useProblemEditor } from './useProblemEditor';

type Model = ReturnType<typeof useProblemEditor>;
export function ProblemClassification({ model }: { model: Model }) {
  const { editing, form, taxonomy, subgroups, update, toggle, assist } = model;
  return (
    <article className="panel form-panel">
      <div className="panel-title">
        <span>01 / SOURCE & CLASSIFICATION</span>
      </div>
      <div className="form-grid">
        <label className="full">
          <span>LEETCODE URL</span>
          <div className="input-action">
            <Link2 size={15} />
            <input
              value={form.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://leetcode.com/problems/..."
            />
            <button onClick={() => assist.mutate()} disabled={!form.url || assist.isPending}>
              {assist.isPending ? 'SCANNING' : 'PREFILL'}
            </button>
          </div>
        </label>
        <label className="full">
          <span>PROBLEM TITLE</span>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Longest Substring Without Repeating Characters"
          />
        </label>
        <label>
          <span>PRIMARY DOMAIN / SUB-TAG</span>
          <select
            value={form.primary_subtag_id}
            onChange={(e) => update('primary_subtag_id', e.target.value)}
          >
            {subgroups.map((group) => (
              <optgroup label={group.main.name} key={group.main.id}>
                {group.children.map((child) => (
                  <option value={child.id} key={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span>DIFFICULTY</span>
          <select
            value={form.difficulty}
            onChange={(e) => update('difficulty', e.target.value as Difficulty)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
        <label>
          <span>STATUS</span>
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value as ProblemStatus)}
          >
            <option>Open</option>
            <option>Understood</option>
            <option>Resolved</option>
          </select>
        </label>
        <label>
          <span>TIME COMPLEXITY</span>
          <input
            value={form.time_complexity}
            onChange={(e) => update('time_complexity', e.target.value)}
            placeholder="O(n log n)"
          />
        </label>
        <label>
          <span>SPACE COMPLEXITY</span>
          <input
            value={form.space_complexity}
            onChange={(e) => update('space_complexity', e.target.value)}
            placeholder="O(n)"
          />
        </label>
      </div>
      <div className="chip-field">
        <span>PATTERNS & TECHNIQUES</span>
        <div>
          {taxonomy?.patterns.map((node) => (
            <button
              type="button"
              className={form.taxonomy_ids.includes(node.id) ? 'selected' : ''}
              key={node.id}
              onClick={() => toggle('taxonomy_ids', node.id)}
            >
              {node.name}
            </button>
          ))}
        </div>
      </div>
      {!editing && (
        <div className="chip-field failure-field">
          <span>WHY IT FAILED</span>
          <div>
            {taxonomy?.failure_reasons.map((node) => (
              <button
                type="button"
                className={form.failure_reason_ids.includes(node.id) ? 'selected' : ''}
                key={node.id}
                onClick={() => toggle('failure_reason_ids', node.id)}
              >
                {node.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
