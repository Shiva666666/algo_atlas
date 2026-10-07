import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { GridTraversalBoard, FrontierLedger } from '../../components/TraversalPrimitives';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { FillData } from './types';
import './styles.css';
export function Canvas({ data: d }: { data: FillData }) {
  const seen = new Set(d.seen.map(([r, c]) => r + ',' + c));
  const waiting = new Set(d.queue.map((q) => q.row + ',' + q.col));
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Current pixel', symbol: '□', color: '#37d9ff' },
          { label: 'Queued', symbol: 'Q', color: '#9b8cff' },
          { label: 'Processed', symbol: '✓', color: '#4fd1a1' },
          { label: 'Rejected neighbor', symbol: '×', color: '#f06cae' },
        ]}
      />
      <div className="study-layout">
        <section>
          <GridTraversalBoard
            label="Working image · original values shown below"
            cells={d.image.map((row, r) =>
              row.map((value, c) => ({
                value,
                note: 'Was ' + d.original[r][c] + (r === d.sr && c === d.sc ? ' · start' : ''),
                state:
                  d.candidate?.[0] === r && d.candidate[1] === c
                    ? d.action === 'compare' && d.checks.some((check) => check.value === false)
                      ? 'rejected'
                      : 'candidate'
                    : d.active?.row === r && d.active.col === c
                      ? 'active'
                      : seen.has(r + ',' + c)
                        ? 'seen'
                        : waiting.has(r + ',' + c)
                          ? 'frontier'
                          : 'idle',
              })),
            )}
          />
          <p>
            Four directions only: right → down → up → left. Seen is updated after recoloring, so
            queue entries may duplicate a coordinate.
          </p>
          <FrontierLedger
            label="FIFO pixel queue · front first"
            kind="queue"
            items={d.queue.map((q, i) => ({
              id: String(q.id),
              primary: '(' + q.row + ', ' + q.col + ')',
              secondary: 'Entry #' + q.id + (i === 0 ? ' · next dequeue' : ''),
              state: 'frontier',
            }))}
          />
        </section>
        <div>
          <OperationLedger
            equation={d.equation}
            metrics={[
              { label: 'Original source color · change', value: d.change },
              { label: 'Target color', value: d.color },
              { label: 'Processed unique pixels', value: d.processed },
              { label: 'Actually changed pixels', value: d.changed },
              { label: 'Returned image', value: d.result ? 'Ready' : 'Pending' },
            ]}
          />
          <h3>Neighbor check</h3>
          <p>{d.candidate ? 'Candidate (' + d.candidate.join(', ') + ')' : 'No active neighbor'}</p>
          <ol className="fill-checks">
            {d.checks.map((check) => (
              <li key={check.term}>
                <span>{check.term}</span>
                <b className={check.value === false ? 'check-rejected' : ''}>
                  {check.value === null ? 'Not evaluated' : check.value ? 'True' : 'False'}
                </b>
              </li>
            ))}
          </ol>
          <p>
            Already-seen dequeues use continue. Equal target/source colors still traverse safely;
            processed does not necessarily mean changed.
          </p>
        </div>
      </div>
    </div>
  );
}
