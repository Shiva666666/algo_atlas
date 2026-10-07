import { BracketLegend, BracketRibbon, IndexedStackRail } from '../../components/IndexedStackRail';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { WildcardData } from './types';
export function Canvas({ data: d }: { data: WildcardData }) {
  return (
    <div className="study-workbench">
      <BracketLegend />
      <BracketRibbon s={d.s} index={d.index} />
      <div className="study-layout">
        <section>
          <IndexedStackRail
            label="Opening indexes · queue"
            tokens={d.openings.map((index) => ({ index, value: '(' }))}
            focus={d.pair?.open ?? d.openings.at(-1)}
          />
          <IndexedStackRail
            label="Wildcard indexes · stars"
            tokens={d.stars.map((index) => ({ index, value: '*' }))}
            focus={d.pair?.star ?? d.stars.at(-1)}
          />
          <h3>Committed wildcard roles</h3>
          <ul className="resource-roles" aria-label="Star roles">
            {d.roles.map((r) => (
              <li key={r.index}>
                Index {r.index} ·{' '}
                {r.role === 'opening'
                  ? 'acts as ('
                  : r.role === 'closing'
                    ? 'acts as )'
                    : r.role === 'empty'
                      ? 'empty string'
                      : 'role pending'}
              </li>
            ))}
          </ul>
          <p>
            Both deques use append / pop: they are LIFO resources here. Consumption order is not a
            diagram of final nested bracket pairs.
          </p>
        </section>
        <OperationLedger
          equation={d.equation}
          metrics={[
            { label: 'Scan pointer', value: d.index < d.s.length ? d.index : 'Complete' },
            { label: 'Remaining openings', value: d.openings.length },
            { label: 'Remaining stars', value: d.stars.length },
            {
              label: 'Index order for a closing star',
              value: d.pair ? d.pair.open + ' < ' + d.pair.star : 'Not testing',
            },
            { label: 'Returned validity', value: d.result === null ? 'Pending' : String(d.result) },
          ]}
        >
          <p>
            A star before an opening cannot close it. Unused stars can be empty only after every
            opening has a resource.
          </p>
        </OperationLedger>
      </div>
    </div>
  );
}
