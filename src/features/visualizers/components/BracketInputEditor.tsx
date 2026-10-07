import { useId, useState } from 'react';
import { SmoothTabs } from '../../../shared/ui/LessonPrimitives';
import type { InputEditorProps } from '../core/lesson';
export function BracketInputEditor({ raw, onChange, help }: InputEditorProps & { help: string }) {
  const id = useId();
  const [tab, setTab] = useState('string');
  let value: { s?: unknown } | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed;
  } catch {
    value = null;
  }
  return (
    <div className="structured-traversal-input">
      <SmoothTabs
        id={id}
        value={tab}
        onChange={setTab}
        label="Bracket input mode"
        items={[
          { id: 'string', label: 'String' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id={id + '-string-panel'}
        aria-labelledby={id + '-string'}
        hidden={tab !== 'string'}
      >
        {value ? (
          <label>
            <span>Input string · s</span>
            <input
              type="text"
              value={typeof value.s === 'string' ? value.s : ''}
              onChange={(e) => onChange(JSON.stringify({ ...value, s: e.target.value }))}
              spellCheck={false}
            />
            <small>{help}</small>
          </label>
        ) : (
          <p>Repair the JSON to return to String mode.</p>
        )}
      </div>
      <div
        role="tabpanel"
        id={id + '-json-panel'}
        aria-labelledby={id + '-json'}
        hidden={tab !== 'json'}
      >
        <label>
          <span>Bracket input JSON</span>
          <textarea
            rows={4}
            value={raw}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
          <small>{help}</small>
        </label>
      </div>
    </div>
  );
}
