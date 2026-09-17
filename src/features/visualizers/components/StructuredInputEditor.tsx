import { useState } from 'react';
import { SmoothTabs, LessonButton } from '../../../shared/ui/LessonPrimitives';

export function StructuredInputEditor({
  kind,
  raw,
  onChange,
  parseGrid,
}: {
  kind: 'prefix-string' | 'island-grid';
  parseGrid?: (raw: string) => { grid: number[][] };
  raw: string;
  onChange: (raw: string) => void;
}) {
  const [mode, setMode] = useState('fields');
  const island = kind === 'island-grid';
  const id = island ? 'island-input' : 'prefix-input';
  let s: string | null = null;
  let grid: number[][] | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.s === 'string') s = parsed.s;
    if (island) grid = parseGrid!(raw).grid;
  } catch {
    /* Invalid edits remain repairable in JSON mode. */
  }
  const resize = (rows: number, columns: number) => {
    if (grid)
      onChange(
        JSON.stringify({
          grid: Array.from({ length: rows }, (_, r) =>
            Array.from({ length: columns }, (_, c) => grid?.[r]?.[c] ?? 0),
          ),
        }),
      );
  };
  return (
    <div className="two-input">
      <SmoothTabs
        id={id}
        value={mode}
        onChange={setMode}
        label={island ? 'Island input mode' : 'String input mode'}
        items={[
          { id: 'fields', label: island ? 'Grid' : 'String' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id={id + '-fields-panel'}
        aria-labelledby={id + '-fields'}
        hidden={mode !== 'fields'}
      >
        {island ? (
          grid ? (
            <>
              <div className="island-dimensions">
                <label>
                  Rows
                  <select
                    aria-label="Grid rows"
                    value={grid.length}
                    onChange={(e) => resize(Number(e.target.value), grid![0].length)}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Columns
                  <select
                    aria-label="Grid columns"
                    value={grid[0].length}
                    onChange={(e) => resize(grid!.length, Number(e.target.value))}
                  >
                    {Array.from({ length: 13 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <p>Toggle a cell: 0 = water, 1 = land. Resizing retains cells that still fit.</p>
              </div>
              <div className="two-scroll" tabIndex={0} role="region" aria-label="Editable grid">
                <table className="island-grid island-edit">
                  <caption>Input grid · edits apply only after Build steps</caption>
                  <thead>
                    <tr>
                      <th scope="col">r / c</th>
                      {grid[0].map((_, c) => (
                        <th scope="col" key={c}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((row, r) => (
                      <tr key={r}>
                        <th scope="row">{r}</th>
                        {row.map((cell, c) => (
                          <td key={c}>
                            <LessonButton
                              aria-label={
                                'Toggle row ' +
                                r +
                                ', column ' +
                                c +
                                ', currently ' +
                                (cell ? 'land' : 'water')
                              }
                              aria-pressed={cell === 1}
                              className={cell ? 'land' : 'water'}
                              onClick={() =>
                                onChange(
                                  JSON.stringify({
                                    grid: grid!.map((line, ri) =>
                                      line.map((v, ci) => (ri === r && ci === c ? 1 - v : v)),
                                    ),
                                  }),
                                )
                              }
                            >
                              {cell}
                            </LessonButton>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Repair the rectangular binary grid in JSON mode to use the grid editor.</p>
          )
        ) : s !== null ? (
          <label className="two-string-field">
            String to test
            <input
              aria-label="String to test"
              value={s}
              onChange={(e) => onChange(JSON.stringify({ s: e.target.value }))}
              spellCheck={false}
              autoCapitalize="none"
            />
            <span>1–32 lowercase letters. No spaces.</span>
          </label>
        ) : (
          <p>Repair the s string in JSON mode to use the field.</p>
        )}
      </div>
      <div
        role="tabpanel"
        id={id + '-json-panel'}
        aria-labelledby={id + '-json'}
        hidden={mode !== 'json'}
      >
        <label className="two-json">
          Paste input JSON
          <textarea
            aria-label={island ? 'Island input JSON' : 'Repeated substring JSON'}
            rows={island ? 4 : 2}
            value={raw}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
