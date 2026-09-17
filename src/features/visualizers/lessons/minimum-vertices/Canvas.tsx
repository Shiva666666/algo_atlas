import type { LessonValue } from './types';
import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  green = '#4fd1a1',
  pink = '#f06cae',
  muted = '#a9b4c2';

function nodePoint(index: number, count: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(count, 1);
  return { x: 300 + Math.cos(angle) * 210, y: 160 + Math.sin(angle) * 105 };
}

export function VerticesLesson({ v }: { v: LessonValue }) {
  const nodes = Array.from({ length: v.n ?? 0 }, (_, i) => nodePoint(i, v.n));
  const active = Array.isArray(v.active) ? v.active : null;
  return (
    <div className="three-lesson vertices-lesson">
      <StateLegend
        items={[
          { label: 'Current edge', symbol: '→', color: cyan },
          { label: 'Zero indegree', symbol: '●', color: green },
          { label: 'Has incoming edge', symbol: '·', color: muted },
        ]}
      />
      <section className="vertices-stage">
        <div className="directed-graph-wrap">
          <svg
            viewBox="0 0 600 320"
            role="img"
            aria-label="Directed graph and incoming-degree scan"
          >
            <defs>
              <marker
                id="lesson-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {(v.edges ?? []).map(([from, to]: number[], i: number) => {
              const a = nodes[from],
                b = nodes[to];
              if (!a || !b) return null;
              const isActive = active?.[0] === from && active?.[1] === to;
              return (
                <line
                  key={`${from}-${to}-${i}`}
                  className={isActive ? 'active' : ''}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  markerEnd="url(#lesson-arrow)"
                />
              );
            })}
            {nodes.map((point, index) => {
              const zero = (v.idx ?? [])[index] === 0;
              return (
                <g
                  className={`${zero ? 'source' : ''} ${v.active === index ? 'active' : ''}`}
                  key={index}
                  transform={`translate(${point.x} ${point.y})`}
                >
                  <circle r="23" />
                  <text y="5">{index}</text>
                </g>
              );
            })}
          </svg>
          <p>
            Arrows point into the vertex whose <code>idx[to]</code> is incremented.
          </p>
        </div>
        <div className="indegree-ledger">
          <header>
            <span>INDEGREE LEDGER</span>
            <small>
              {v.phase === 'edge-scan'
                ? 'provisional until all edges are scanned'
                : 'ascending vertex scan'}
            </small>
          </header>
          <ol>
            {Array.from({ length: v.n ?? 0 }, (_, i) => (
              <li
                className={`${(v.idx ?? [])[i] === 0 ? 'zero' : ''} ${v.active === i ? 'active' : ''}`}
                key={i}
              >
                <span>vertex {i}</span>
                <b>{(v.idx ?? [])[i] ?? 0}</b>
                <em>{(v.idx ?? [])[i] === 0 ? 'source' : 'incoming edge'}</em>
              </li>
            ))}
          </ol>
          <footer>
            Returned set <strong>[{(v.result ?? []).join(', ')}]</strong>
          </footer>
        </div>
      </section>
      <p className="why-line">
        Why: this reference code only counts indegrees, then collects zeros. It does not run Kahn’s
        algorithm or BFS.
      </p>
    </div>
  );
}
