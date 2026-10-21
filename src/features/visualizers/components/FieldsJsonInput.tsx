import { useState, type ReactNode } from 'react';
import { SmoothTabs } from '../../../shared/ui/LessonPrimitives';
import type { InputEditorProps } from '../core/lesson';
import './styles/counting-studios.css';
export function FieldsJsonInput({
  raw,
  onChange,
  id,
  children,
}: InputEditorProps & { id: string; children: ReactNode }) {
  const [mode, setMode] = useState('fields');
  return (
    <div className="number-array-editor">
      <SmoothTabs
        id={id}
        label="Input mode"
        value={mode}
        onChange={setMode}
        items={[
          { id: 'fields', label: 'Fields' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id={id + '-fields-panel'}
        aria-labelledby={id + '-fields'}
        hidden={mode !== 'fields'}
      >
        {children}
      </div>
      <div
        role="tabpanel"
        id={id + '-json-panel'}
        aria-labelledby={id + '-json'}
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
    </div>
  );
}
