import { useEffect, useRef, type ReactNode } from 'react';

export interface SequenceCell {
  value: string | number;
  note?: string;
  state?: 'idle' | 'active' | 'dependency' | 'stored' | 'pending' | 'result';
}

/** Presentation only: indexes and ranges come from the lesson's immutable frame. */
export function SequenceStrip({
  cells,
  label,
  pointer,
  ranges = [],
}: {
  cells: SequenceCell[];
  label: string;
  pointer?: { index: number; label: string } | null;
  ranges?: Array<{ start: number; end: number; label: string }>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pointerIndex = pointer?.index;
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || pointerIndex === undefined) return;
    const item = scroll.querySelectorAll('li')[pointerIndex];
    if (!item) return;
    const bounds = scroll.getBoundingClientRect(),
      cell = item.getBoundingClientRect();
    if (cell.right > bounds.right) scroll.scrollLeft += cell.right - bounds.right + 8;
    else if (cell.left < bounds.left) scroll.scrollLeft -= bounds.left - cell.left + 8;
  }, [pointerIndex]);
  return (
    <section className="study-sequence" aria-label={label}>
      <div
        ref={scrollRef}
        className="study-scroll"
        role="region"
        tabIndex={0}
        aria-label={`Scrollable ${label}`}
      >
        <ol className="study-strip">
          {cells.map((cell, index) => (
            <li key={index} className={`study-${cell.state ?? 'idle'}`}>
              <span className="study-index">{index}</span>
              <b>{cell.value}</b>
              <span>{cell.note ?? '\u00a0'}</span>
              {pointer?.index === index && (
                <strong className="study-pointer">{pointer.label}</strong>
              )}
            </li>
          ))}
        </ol>
      </div>
      {ranges.length > 0 && (
        <ul className="study-ranges" aria-label="Derived ranges">
          {ranges.map((range) => (
            <li key={`${range.start}-${range.end}`}>
              {range.label} [{range.start}, {range.end}]
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export interface DependencyCell {
  input: number;
  cost: number | null;
  state: 'idle' | 'active' | 'dependency' | 'stored' | 'result';
}

/** A ragged triangular dependency board. null cost is initialized infinity. */
export function DependencyGrid({
  rows,
  active,
  parents,
  label,
}: {
  rows: DependencyCell[][];
  active: [number, number] | null;
  parents: Array<[number, number]>;
  label: string;
}) {
  const width = Math.max(360, rows.length * 94 + 20);
  const point = (r: number, c: number) => ({ x: width / 2 + (c - r / 2) * 94, y: 48 + r * 90 });
  return (
    <div className="study-scroll" role="region" tabIndex={0} aria-label={`Scrollable ${label}`}>
      <svg
        className="study-triangle"
        width={width}
        height={rows.length * 90 + 12}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <desc>
          Each cell shows its input value and current minimum cost. Highlighted links are valid
          parents for the current comparison.
        </desc>
        {rows.slice(1).flatMap((row, offset) =>
          row.flatMap((_, c) => {
            const r = offset + 1,
              to = point(r, c);
            return [c, c - 1]
              .filter((p) => p >= 0 && p < rows[r - 1].length)
              .map((p) => {
                const from = point(r - 1, p);
                const focused =
                  active?.[0] === r &&
                  active[1] === c &&
                  parents.some(([pr, pc]) => pr === r - 1 && pc === p);
                return (
                  <line
                    key={`${r}-${c}-${p}`}
                    className={focused ? 'dependency-link focused' : 'dependency-link'}
                    x1={from.x}
                    y1={from.y + 32}
                    x2={to.x}
                    y2={to.y - 32}
                  />
                );
              });
          }),
        )}
        {rows.flatMap((row, r) =>
          row.map((cell, c) => {
            const { x, y } = point(r, c);
            return (
              <g
                key={`${r}-${c}`}
                className={`study-${cell.state}`}
                transform={`translate(${x} ${y})`}
              >
                <rect x={-39} y={-32} width={78} height={64} rx={6} />
                <text className="triangle-input" y={-11}>
                  {cell.input}
                </text>
                <text className="triangle-cost" y={11}>
                  {cell.cost === null ? '∞' : cell.cost}
                </text>
                <text className="triangle-index" y={27}>
                  {r},{c}
                </text>
                <title>{`Row ${r}, column ${c}: input ${cell.input}, cost ${cell.cost ?? 'infinity'}, ${cell.state}`}</title>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

export function OperationLedger({
  equation,
  metrics,
  children,
}: {
  equation: string;
  metrics: Array<{ label: string; value: string | number }>;
  children?: ReactNode;
}) {
  return (
    <section className="study-operation" aria-label="Operation and state">
      <p className="study-equation">{equation}</p>
      <dl>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}
