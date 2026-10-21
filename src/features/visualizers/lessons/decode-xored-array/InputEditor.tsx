import { useEffect, useRef, useState } from 'react';
import { FieldsJsonInput } from '../../components/FieldsJsonInput';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor({ raw, onChange }: InputEditorProps) {
  const [encoded, setEncoded] = useState(''),
    [first, setFirst] = useState('');
  const emitted = useRef<string | null>(null);
  useEffect(() => {
    if (emitted.current === raw) return;
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p?.encoded)) setEncoded(p.encoded.join(', '));
      if (typeof p?.first === 'number') setFirst(String(p.first));
    } catch {
      /* Keep repairable field drafts. */
    }
  }, [raw]);
  const change = (enc: string, seed: string) => {
    const value = `{"encoded":[${enc}],"first":${seed || 'null'}}`;
    emitted.current = value;
    onChange(value);
  };
  return (
    <FieldsJsonInput raw={raw} onChange={onChange} id="decode-xor-input">
      <div className="recovery-fields">
        <label>
          Encoded values, separated by commas
          <input
            value={encoded}
            spellCheck={false}
            onChange={(e) => {
              setEncoded(e.target.value);
              change(e.target.value, first);
            }}
          />
        </label>
        <label>
          First decoded value
          <input
            value={first}
            inputMode="numeric"
            spellCheck={false}
            onChange={(e) => {
              setFirst(e.target.value);
              change(encoded, e.target.value);
            }}
          />
        </label>
        <p>
          1–16 encoded values; first and each value are integers in 0–100,000. Zero and repeated
          values are allowed. Build steps applies edits.
        </p>
      </div>
    </FieldsJsonInput>
  );
}
