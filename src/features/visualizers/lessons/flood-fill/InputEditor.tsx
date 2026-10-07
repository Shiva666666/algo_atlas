import { useId, useState } from 'react';
import { SmoothTabs } from '../../../../shared/ui/LessonPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor({ raw, onChange }: InputEditorProps) {
  const id = useId();
  const [tab, setTab] = useState('grid');
  let value: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed;
  } catch {
    value = null;
  }
  const grid =
    Array.isArray(value?.image) &&
    value.image.length &&
    value.image.every((row) => Array.isArray(row))
      ? (value.image as number[][])
      : null;
  const update = (next: Record<string, unknown>) => onChange(JSON.stringify({ ...value, ...next }));
  const resize = (rows: number, cols: number) => {
    if (
      !grid ||
      !Number.isInteger(rows) ||
      !Number.isInteger(cols) ||
      rows < 1 ||
      rows > 8 ||
      cols < 1 ||
      cols > 10
    )
      return;
    update({
      image: Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => grid[r]?.[c] ?? 0),
      ),
      sr: Math.min(Number(value?.sr) || 0, rows - 1),
      sc: Math.min(Number(value?.sc) || 0, cols - 1),
    });
  };
  return (
    <div className="structured-traversal-input">
      <SmoothTabs
        id={id}
        value={tab}
        onChange={setTab}
        label="Flood fill input mode"
        items={[
          { id: 'grid', label: 'Grid' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id={id + '-grid-panel'}
        aria-labelledby={id + '-grid'}
        hidden={tab !== 'grid'}
      >
        {grid ? (
          <>
            <div className="fill-editor-controls">
              <label>
                <span>Rows · 1–8</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={grid.length}
                  onChange={(e) => resize(Number(e.target.value), grid[0].length)}
                />
              </label>
              <label>
                <span>Columns · 1–10</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={grid[0].length}
                  onChange={(e) => resize(grid.length, Number(e.target.value))}
                />
              </label>
              {['sr', 'sc', 'color'].map((key) => (
                <label key={key}>
                  <span>
                    {key === 'sr'
                      ? 'Start row · sr'
                      : key === 'sc'
                        ? 'Start column · sc'
                        : 'Target color'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={key === 'sr' ? grid.length - 1 : key === 'sc' ? grid[0].length - 1 : 9}
                    value={Number(value?.[key]) || 0}
                    onChange={(e) => update({ [key]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            <div className="study-scroll" role="region" tabIndex={0} aria-label="Editable image">
              <table className="fill-editor-grid">
                <caption>Image colors · 0–9 · zero-based coordinates</caption>
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>
                          <input
                            type="number"
                            min={0}
                            max={9}
                            aria-label={'Pixel row ' + r + ', column ' + c}
                            value={cell}
                            onChange={(e) =>
                              update({
                                image: grid.map((values, rr) =>
                                  values.map((v, cc) =>
                                    rr === r && cc === c ? Number(e.target.value) : v,
                                  ),
                                ),
                              })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>Use JSON mode to supply a rectangular image.</p>
        )}
      </div>
      <div
        role="tabpanel"
        id={id + '-json-panel'}
        aria-labelledby={id + '-json'}
        hidden={tab !== 'json'}
      >
        <label>
          <span>Flood fill JSON</span>
          <textarea
            rows={6}
            value={raw}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
