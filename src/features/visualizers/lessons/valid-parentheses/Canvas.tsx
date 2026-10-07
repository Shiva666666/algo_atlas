import { BracketLegend, BracketRibbon, IndexedStackRail } from '../../components/IndexedStackRail';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { ParenthesesData } from './types';
export function Canvas({ data: d }: { data: ParenthesesData }) {
  return (
    <div className="study-workbench">
      <BracketLegend />
      <BracketRibbon s={d.s} index={d.index} />
      <div className="study-layout">
        <section>
          <IndexedStackRail label="Opening stack" tokens={d.stack} focus={d.comparison?.top} />
          {d.comparison && (
            <div className="bracket-comparison" aria-label="Stack-top bracket comparison">
              <span>
                Top requires<code>{d.comparison.expected ?? 'No opener'}</code>
              </span>
              <span>
                Current closer<code>{d.comparison.closer}</code>
              </span>
            </div>
          )}
          <h3>Matched pairs</h3>
          <ul className="resource-roles">
            {d.matches.map((p) => (
              <li key={p.close}>
                Opening {p.open} → closing {p.close} · {d.s[p.open]}
                {d.s[p.close]}
              </li>
            ))}
          </ul>
          {!d.matches.length && <p>No completed pairs yet.</p>}
          <p>A closer must match the top. It cannot bypass an unmatched opening.</p>
        </section>
        <OperationLedger
          equation={d.equation}
          metrics={[
            { label: 'Current closer', value: d.comparison?.closer ?? '—' },
            { label: 'Top needs', value: d.comparison?.expected ?? '—' },
            { label: 'Unmatched openings', value: d.stack.length },
            { label: 'Returned value', value: d.result === null ? 'Pending' : String(d.result) },
          ]}
        />
      </div>
      {d.result !== null && (
        <div className={'bracket-outcome ' + (!d.result ? 'rejected' : '')}>
          <strong>{d.result ? 'Valid bracket sequence' : 'Invalid bracket sequence'}</strong>
          <p>
            {d.result
              ? 'Every opener was closed in the right order.'
              : d.stack.length
                ? 'A mismatch or unclosed opening prevents validity.'
                : 'A closer has no matching opening.'}
          </p>
        </div>
      )}
    </div>
  );
}
