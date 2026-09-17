import { useState } from 'react';
import { SmoothTabs } from '../../../../shared/ui/LessonPrimitives';

export function RemoveKDigitsInputEditor({
  raw,
  onChange,
}: {
  raw: string;
  onChange: (raw: string) => void;
}) {
  const [mode, setMode] = useState('fields');
  let value: { num: string; k: number | string } | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.num === 'string' &&
      (typeof parsed.k === 'number' || typeof parsed.k === 'string')
    )
      value = parsed;
  } catch {
    /* Keep malformed JSON available for repair. */
  }
  const update = (changes: Partial<{ num: string; k: number | string }>) => {
    if (value) onChange(JSON.stringify({ ...value, ...changes }));
  };
  return (
    <div className="digits-input-editor">
      <SmoothTabs
        id="digits-input"
        value={mode}
        onChange={setMode}
        label="Remove K Digits input mode"
        items={[
          { id: 'fields', label: 'Fields' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        id="digits-input-fields-panel"
        role="tabpanel"
        aria-labelledby="digits-input-fields"
        hidden={mode !== 'fields'}
      >
        {value ? (
          <div className="digits-fields">
            <label>
              Number <span>Keep it as a digit string</span>
              <input
                disabled={mode !== 'fields'}
                aria-label="Number digit string"
                inputMode="numeric"
                value={value.num}
                onChange={(event) => update({ num: event.target.value })}
                spellCheck={false}
              />
            </label>
            <label>
              Digits to remove <span>k · from 1 to the input length</span>
              <input
                disabled={mode !== 'fields'}
                aria-label="Digits to remove k"
                type="number"
                min={1}
                max={value.num.length}
                step={1}
                value={value.k}
                onChange={(event) =>
                  update({ k: event.target.value === '' ? '' : Number(event.target.value) })
                }
              />
            </label>
          </div>
        ) : (
          <p>Repair the num string and k value in JSON mode to use the fields.</p>
        )}
      </div>
      <div
        id="digits-input-json-panel"
        role="tabpanel"
        aria-labelledby="digits-input-json"
        hidden={mode !== 'json'}
      >
        <label className="digits-json">
          Paste input JSON
          <textarea
            aria-label="Remove K Digits JSON"
            value={raw}
            onChange={(event) => onChange(event.target.value)}
            rows={3}
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
