import { BracketLegend, BracketRibbon, IndexedStackRail } from '../../components/IndexedStackRail';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { MinimumAddData } from './types';
export function Canvas({ data: d }: { data: MinimumAddData }) {
  return (
    <div className="study-workbench">
      <BracketLegend />
      <BracketRibbon s={d.s} index={d.index} />
      <div className="study-layout">
        <section>
          <IndexedStackRail
            label="Unmatched opening stack"
            tokens={d.stack}
            focus={d.stack.at(-1)?.index}
          />
          <h3>Two kinds of missing parentheses</h3>
          <p>
            During the scan, an unmatched closer needs an opening before it. At the end, each
            opening still stored needs a closing after it.
          </p>
          <div className="repair-equation" aria-label="Insertion equation">
            <span>{d.missingOpen} missing (</span>
            <b>+</b>
            <span>{d.missingClose ?? '…'} missing )</span>
            <b>=</b>
            <span>{d.result ?? 'Pending'}</span>
          </div>
          <p>These are required insertion counts. The saved code does not rewrite the string.</p>
        </section>
        <OperationLedger
          equation={d.equation}
          metrics={[
            { label: 'count · scan / final', value: d.count },
            { label: 'Missing openings recorded', value: d.missingOpen },
            { label: 'Openings still on stack', value: d.stack.length },
            { label: 'Returned insertions', value: d.result ?? 'Pending' },
          ]}
        />
      </div>
    </div>
  );
}
