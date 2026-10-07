import { BracketLegend, BracketRibbon } from '../../components/IndexedStackRail';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { ScoreData } from './types';
import './styles.css';
export function Canvas({ data: d }: { data: ScoreData }) {
  let balance = 0;
  const depths = [...d.s].map((c) => (balance += c === '(' ? 1 : -1));
  const height = Math.max(...depths, 1) * 20 + 50;
  return (
    <div className="study-workbench score-studio">
      <BracketLegend />
      <BracketRibbon s={d.s} index={d.index} />
      <div className="study-layout">
        <section>
          <h3>Enclosing depth</h3>
          <div
            className="study-scroll"
            tabIndex={0}
            role="region"
            aria-label="Scrollable derived depth diagram"
          >
            <svg
              width={Math.max(320, d.s.length * 36)}
              height={height}
              role="img"
              aria-label="Depth after each character · derived diagram"
            >
              <title>Depth after each character · derived diagram</title>
              {depths.map((value, i) => (
                <g key={i}>
                  <rect
                    x={i * 36 + 5}
                    y={height - 30 - value * 20}
                    width={26}
                    height={Math.max(value * 20, 2)}
                    className={i === d.index ? 'depth-active' : 'depth-column'}
                  />
                  <text x={i * 36 + 18} y={height - 12}>
                    {i}
                  </text>
                  <title>{'Index ' + i + ': depth ' + value}</title>
                </g>
              ))}
            </svg>
          </div>
          <p>
            The diagram derives nesting from the input. The counters at right are the actual trace
            state; a closer decrements depth before adding its leaf score.
          </p>
          <h3>Primitive-leaf contributions</h3>
          <ol className="score-contributions" aria-label="Primitive leaf contributions">
            {d.contributions.map((c) => (
              <li key={c.index}>
                <span>() closes at {c.index}</span>
                <code>
                  2 ** {c.depth} = {c.value}
                </code>
              </li>
            ))}
          </ol>
          {!d.contributions.length && <p>No leaf scored yet.</p>}
        </section>
        <OperationLedger
          equation={d.equation}
          metrics={[
            { label: 'Pointer · i', value: d.index },
            { label: 'Current depth', value: d.depth },
            { label: 'Score · global_track', value: d.total },
            { label: 'Returned score', value: d.result ?? 'Pending' },
          ]}
        />
      </div>
    </div>
  );
}
