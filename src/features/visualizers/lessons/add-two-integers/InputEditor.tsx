import { useEffect, useRef, useState } from 'react';
import { FieldsJsonInput } from '../../components/FieldsJsonInput';
import type { InputEditorProps } from '../../core/lesson';
function fields(raw: string): [string, string] {
  try {
    const p = JSON.parse(raw);
    return [
      typeof p?.num1 === 'number' ? String(p.num1) : '',
      typeof p?.num2 === 'number' ? String(p.num2) : '',
    ];
  } catch {
    return ['', ''];
  }
}
export function InputEditor({ raw, onChange }: InputEditorProps) {
  const [draft, setDraft] = useState(() => fields(raw));
  const emitted = useRef<string | null>(null);
  useEffect(() => {
    if (emitted.current !== raw) setDraft(fields(raw));
  }, [raw]);
  const change = (index: number, value: string) => {
    const next: [string, string] = [...draft];
    next[index] = value;
    setDraft(next);
    const numeric = (text: string) => (/^-?\d+$/.test(text) ? Number(text) : text);
    const json = JSON.stringify({ num1: numeric(next[0]), num2: numeric(next[1]) });
    emitted.current = json;
    onChange(json);
  };
  return (
    <FieldsJsonInput raw={raw} onChange={onChange} id="addition-input">
      <div className="addition-fields">
        {draft.map((value, i) => (
          <label key={i}>
            num{i + 1}
            <input
              value={value}
              inputMode="text"
              spellCheck={false}
              onChange={(e) => change(i, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p>
        Two integers from −100 through 100, matching the screenshot’s domain. Build steps applies
        edits.
      </p>
    </FieldsJsonInput>
  );
}
