import type { LessonValue } from './types';
import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

import type { CSSProperties } from 'react';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  green = '#4fd1a1',
  pink = '#f06cae',
  muted = '#a9b4c2';

function Polygon({
  values,
  interval,
  candidate,
}: {
  values: number[];
  interval?: number[];
  candidate?: number;
}) {
  const n = values.length;
  const points = values.map((_, i) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    return { x: 230 + Math.cos(a) * 145, y: 165 + Math.sin(a) * 125 };
  });
  return (
    <svg
      className="polygon-stage"
      viewBox="0 0 460 330"
      role="img"
      aria-label="Convex polygon interval diagram"
    >
      <polygon points={points.map((p) => `${p.x},${p.y}`).join(' ')} />
      {interval && (
        <line
          className="interval"
          x1={points[interval[0]].x}
          y1={points[interval[0]].y}
          x2={points[interval[1]].x}
          y2={points[interval[1]].y}
        />
      )}{' '}
      {candidate !== undefined && interval && (
        <>
          <line
            className="candidate"
            x1={points[interval[0]].x}
            y1={points[interval[0]].y}
            x2={points[candidate].x}
            y2={points[candidate].y}
          />
          <line
            className="candidate"
            x1={points[candidate].x}
            y1={points[candidate].y}
            x2={points[interval[1]].x}
            y2={points[interval[1]].y}
          />
        </>
      )}{' '}
      {points.map((p, i) => (
        <g
          className={`${interval?.includes(i) ? 'interval-node' : ''} ${candidate === i ? 'candidate-node' : ''}`}
          key={i}
          transform={`translate(${p.x} ${p.y})`}
        >
          <circle r="22" />
          <text y="-31">{i}</text>
          <text y="5">{values[i]}</text>
        </g>
      ))}
    </svg>
  );
}

export function TriangulationLesson({ v }: { v: LessonValue }) {
  const values = v.values ?? [];
  return (
    <div className="three-lesson triangulation-lesson">
      <StateLegend
        items={[
          { label: 'Active interval', symbol: '━', color: cyan },
          { label: 'Candidate split k', symbol: '┄', color: violet },
          { label: 'Memo value', symbol: '●', color: green },
          { label: 'Best so far', symbol: '◐', color: '#f1b85b' },
        ]}
      />
      <section className="triangulation-stage">
        <div className="polygon-pane">
          <header>
            <span>POLYGON SPLIT</span>
            <small>
              {v.interval ? `solve(${v.interval[0]}, ${v.interval[1]})` : 'root result'}
            </small>
          </header>
          <Polygon values={values} interval={v.interval} candidate={v.candidate} />
          {v.interval && v.candidate !== undefined && (
            <div className="tri-equation">
              <code>
                {values[v.interval[0]]} × {values[v.candidate]} × {values[v.interval[1]]}
              </code>
              <span>
                triangle + solve({v.interval[0]}, {v.candidate}) + solve({v.candidate},{' '}
                {v.interval[1]})
              </span>
            </div>
          )}
        </div>
        <div className="memo-pane">
          <header>
            <span>MEMO[i, j]</span>
            <small>{v.state === 'best' ? 'best so far' : 'recorded values'}</small>
          </header>
          <div
            className="memo-grid"
            style={{ '--memo-size': Math.max(values.length, 3) } as CSSProperties}
          >
            {Array.from({ length: values.length }, (_, i) =>
              Array.from({ length: values.length }, (_, j) => {
                const key = `${i},${j}`,
                  value = v.memo?.[key];
                const current = v.interval?.[0] === i && v.interval?.[1] === j;
                return (
                  <span
                    className={`${value === undefined ? 'empty' : 'stored'} ${current ? 'current' : ''}`}
                    key={key}
                  >
                    <small>
                      {i},{j}
                    </small>
                    <b>{value === undefined ? '—' : value}</b>
                  </span>
                );
              }),
            )}
          </div>
          <p>
            Empty means “not stored”; 0 is a real base value; a highlighted value can still be a
            best-so-far entry.
          </p>
        </div>
      </section>
      <p className="why-line">
        Why: the source writes base intervals before its memo lookup, then updates a non-base cell
        after every candidate k.
      </p>
    </div>
  );
}
