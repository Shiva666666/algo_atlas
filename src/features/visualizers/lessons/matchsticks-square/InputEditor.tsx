import { useMemo, useState } from 'react';
import { SmoothTabs } from '../../../../shared/ui/LessonPrimitives';
import type { MatchsticksInput } from './adapter';

function readValue(raw: string): MatchsticksInput | null {
  try {
    const value = JSON.parse(raw) as unknown;
    const list = Array.isArray(value)
      ? value
      : value && typeof value === 'object'
        ? (value as { matchsticks?: unknown }).matchsticks
        : undefined;
    if (!Array.isArray(list) || !list.every((item) => typeof item === 'number')) return null;
    return { matchsticks: list as number[] };
  } catch {
    return null;
  }
}

export function MatchsticksInputEditor({
  raw,
  onChange,
}: {
  raw: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState('sticks');
  const parsed = useMemo(() => readValue(raw), [raw]);
  return (
    <div className="matchsticks-input-editor">
      <div className="matchsticks-editor-heading">
        <span>INPUT BUILDER</span>
        <small>
          {parsed
            ? `${parsed.matchsticks.length} sticks · edits pause playback`
            : 'JSON shape required for the builder'}
        </small>
      </div>
      <SmoothTabs
        id="matchsticks-input"
        value={mode}
        onChange={setMode}
        label="Matchsticks input editor"
        items={[
          { id: 'sticks', label: 'Sticks' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      {mode === 'sticks' && parsed ? (
        <div className="matchsticks-builder">
          <label>
            <span>STICKS · one value per cell</span>
            <input
              aria-label="Matchstick values"
              value={parsed.matchsticks.join(', ')}
              onChange={(event) =>
                onChange(
                  JSON.stringify({
                    matchsticks: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((item) => Number(item)),
                  }),
                )
              }
              spellCheck={false}
            />
            <small>
              Use positive integers. Duplicate lengths remain separate sticks in the trace.
            </small>
          </label>
          <div className="matchsticks-chip-row" aria-label="Current matchsticks">
            {parsed.matchsticks.map((value, index) => (
              <span key={`${index}-${value}`}>
                <small>#{index + 1}</small>
                <b>{value}</b>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <label className="matchsticks-json-editor">
          <span>ADVANCED JSON INPUT</span>
          <textarea
            rows={4}
            value={raw}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
          />
          <small>
            Canonical shape: <code>{'{"matchsticks":[1,1,2,2,2]}'}</code>. A bare numeric array is
            also accepted.
          </small>
        </label>
      )}
      {mode === 'sticks' && parsed && (
        <button type="button" className="matchsticks-json-hint" onClick={() => setMode('json')}>
          Paste or resize the array in JSON mode
        </button>
      )}
    </div>
  );
}
