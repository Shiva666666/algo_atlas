import { useEffect, useRef, useState } from 'react';
import { SmoothTabs } from '../../../shared/ui/LessonPrimitives';
import type { InputEditorProps } from '../core/lesson';

export function NumberArrayInputEditor({
  raw,
  onChange,
  maximum,
  maximumValue = 100000,
  distinct = false,
}: InputEditorProps & { maximum: number; maximumValue?: number; distinct?: boolean }) {
  const [mode, setMode] = useState('array');
  const [draft, setDraft] = useState('');
  const emitted = useRef<string | null>(null);
  useEffect(() => {
    if (emitted.current === raw) return;
    try {
      const value = JSON.parse(raw);
      const nums = Array.isArray(value) ? value : value?.nums;
      if (Array.isArray(nums)) setDraft(nums.join(', '));
    } catch {
      /* JSON mode retains incomplete drafts for repair. */
    }
  }, [raw]);
  return (
    <div className="number-array-editor">
      <SmoothTabs
        id="number-array-input"
        label="Array input mode"
        value={mode}
        onChange={setMode}
        items={[
          { id: 'array', label: 'Array' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id="number-array-input-array-panel"
        aria-labelledby="number-array-input-array"
        hidden={mode !== 'array'}
      >
        <label>
          Numbers, separated by commas
          <input
            value={draft}
            spellCheck={false}
            onChange={(event) => {
              setDraft(event.target.value);
              const value = `{"nums":[${event.target.value}]}`;
              emitted.current = value;
              onChange(value);
            }}
          />
        </label>
      </div>
      <div
        role="tabpanel"
        id="number-array-input-json-panel"
        aria-labelledby="number-array-input-json"
        hidden={mode !== 'json'}
      >
        <label>
          JSON input
          <textarea
            rows={4}
            value={raw}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
      <p>
        1–{maximum} {distinct ? 'distinct ' : ''}positive integers, at most{' '}
        {maximumValue.toLocaleString('en-US')} each. Changes apply only after Build steps.
      </p>
    </div>
  );
}
