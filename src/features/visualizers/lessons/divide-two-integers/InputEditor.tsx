import { useEffect, useRef, useState } from 'react';
import { FieldsJsonInput } from '../../components/FieldsJsonInput';
import type { InputEditorProps } from '../../core/lesson';
function fields(raw: string): [string, string] {
  try {
    const p = JSON.parse(raw);
    return [
      typeof p?.dividend === 'number' ? String(p.dividend) : '',
      typeof p?.divisor === 'number' ? String(p.divisor) : '',
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
    const numeric = (s: string) => (/^-?\d+$/.test(s) ? Number(s) : s);
    const json = JSON.stringify({ dividend: numeric(next[0]), divisor: numeric(next[1]) });
    emitted.current = json;
    onChange(json);
  };
  return (
    <FieldsJsonInput raw={raw} onChange={onChange} id="division-input">
      <div className="division-fields">
        {draft.map((value, i) => (
          <label key={i}>
            {i === 0 ? 'dividend' : 'divisor'}
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
        Signed 32-bit integers: −2147483648 through 2147483647. The divisor must not be zero. Build
        steps applies edits.
      </p>
    </FieldsJsonInput>
  );
}
