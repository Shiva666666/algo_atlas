import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { MemoizedRecursionWorkbench } from '../../components/MemoizedRecursionWorkbench';
import { SequenceStrip } from '../../components/StudyPrimitives';
import type { SquaresData } from './types';
export function SquaresCanvas({ data }: { data: SquaresData }) {
  const active = data.calls.at(-1);
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Active call', symbol: '→', color: '#37d9ff' },
          { label: 'Pending answer', symbol: '?', color: '#f1b85b' },
          { label: 'Stored memo', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <MemoizedRecursionWorkbench
        calls={data.calls}
        memo={data.memo}
        equation={data.equation}
        result={data.result}
        argumentLabel="Remainder"
      >
        <div className="memo-choice">
          <h3>Generated square choices</h3>
          <SequenceStrip
            label="Square choices"
            cells={data.squares.map((square) => ({
              value: square,
              state: square === active?.choice ? 'active' : 'idle',
            }))}
          />
          <p>The square guard stops the loop when the next choice exceeds the remainder.</p>
        </div>
      </MemoizedRecursionWorkbench>
      <p>
        Seeded square values return immediately. The zero-return base case exists in the code but is
        unreachable for this valid-input trace.
      </p>
    </div>
  );
}
