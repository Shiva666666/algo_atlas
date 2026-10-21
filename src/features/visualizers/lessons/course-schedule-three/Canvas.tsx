import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import { FrontierLedger } from '../../components/TraversalPrimitives';
import type { CourseData } from './types';
import '../../components/styles/counting-studios.css';
import '../../components/styles/recovery-studios.css';
export function Canvas({ data: d }: { data: CourseData }) {
  const current = d.index === null ? null : d.courses[d.index];
  let end = 0;
  const witness = d.selected.map((id) => {
    const course = d.original[id],
      start = end;
    end += course.duration;
    return { ...course, start, end };
  });
  return (
    <div className="study-workbench counting-studio recovery-studio">
      <StateLegend
        items={[
          { label: 'Current / pending mutation', symbol: '□', color: '#37d9ff' },
          { label: 'Heap / deadline order', symbol: '◇', color: '#9b8cff' },
          { label: 'Skipped / replaced', symbol: '−', color: '#f06cae' },
          { label: 'Committed course', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="recovery-layout">
        <section className="recovery-course-order" aria-label="Deadline order and duration heap">
          <h3>Courses in deadline order</h3>
          <p>
            Each course keeps its original ID, even when two courses have identical durations and
            deadlines.
          </p>
          <SequenceStrip
            label="Deadline-ordered courses"
            cells={d.courses.map((c) => ({
              value: `C${c.id + 1}`,
              note: `${c.duration} days · by ${c.deadline} · ${d.decisions[c.id]}`,
              state:
                d.result === null && current?.id === c.id
                  ? 'active'
                  : d.decisions[c.id] === 'kept'
                    ? 'result'
                    : d.decisions[c.id] === 'skipped' || d.decisions[c.id] === 'removed'
                      ? 'pending'
                      : 'idle',
            }))}
            pointer={
              d.result === null && d.index !== null ? { index: d.index, label: 'Consider' } : null
            }
          />
          <FrontierLedger
            label="Negative-duration heap"
            kind="min-heap"
            items={(d.heap ?? []).map((value, i) => ({
              id: String(i),
              primary: `${value}`,
              secondary: `${i === 0 ? 'Root · longest' : 'Stored'} duration ${-value}`,
              state: i === 0 ? 'active' : 'idle',
            }))}
          />
          <p>
            {d.heap === null
              ? 'heap is not initialized.'
              : 'One valid simulated heap layout; heapq internals are not traced. Negative keys expose the longest duration at the min-heap root. This is not a sorted list.'}
          </p>
        </section>
        <aside className="studio-ledger" aria-label="Course decision ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              {
                label: d.result === null ? 'Considering course' : 'Last considered course',
                value: current ? `C${current.id + 1}` : 'Not assigned',
              },
              {
                label: 'Duration / deadline',
                value: current ? `${current.duration} / ${current.deadline}` : 'Not assigned',
              },
              { label: 'Source total', value: d.total ?? 'Not assigned' },
              { label: 'Heap count', value: d.heap?.length ?? 'Not initialized' },
              { label: 'Tested finish day', value: d.proposal ?? 'Not evaluated' },
              {
                label: 'Fits on or before deadline',
                value: d.fit === null ? 'Not evaluated' : String(d.fit),
              },
              {
                label: 'Longest > incoming duration',
                value: d.shorter === null ? 'Not evaluated' : String(d.shorter),
              },
            ]}
          />
          {d.pending && (
            <p className="studio-transfer">
              {d.pending === 'accept'
                ? 'Acceptance in progress: total updated; heap push pending.'
                : 'Replacement in progress: removal/addition may be unfinished.'}{' '}
              The witness below retains the last committed schedule.
            </p>
          )}
          <code className="recovery-rule">
            lastday ≥ total + dur
            <br />
            otherwise: -heap[0] &gt; dur
          </code>
          <p>
            Replace a longer course to free time while retaining the same count. Equal duration
            never passes the strict comparison.
          </p>
          {d.result !== null && (
            <output className="studio-result" aria-label="Returned maximum course count">
              Returned maximum course count: {d.result}
            </output>
          )}
        </aside>
        <section
          className="studio-section recovery-secondary"
          aria-label="Derived feasible course schedule"
        >
          <h3>Committed feasible schedule · derived witness</h3>
          <p>
            Course IDs are teaching annotations. The source heap stores only durations; equivalent
            equal-duration IDs are not uniquely determined. Day ranges use elapsed time: start 0
            means the beginning of day 1.
          </p>
          <div className="recovery-witness-bar" aria-hidden="true">
            {witness.map((c) => (
              <span key={c.id} style={{ width: `${(c.duration / (end || 1)) * 100}%` }} />
            ))}
          </div>
          <p>
            Committed total: {end} days · {witness.length} courses
            {d.pending ? ' · previous completed state' : ''}.
          </p>
          {witness.length ? (
            <div
              className="study-scroll"
              role="region"
              tabIndex={0}
              aria-label="Scrollable feasible schedule"
            >
              <table className="studio-table">
                <caption>Every committed finish is on or before its own deadline.</caption>
                <thead>
                  <tr>
                    <th scope="col">Course</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Start → finish</th>
                    <th scope="col">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {witness.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">C{c.id + 1}</th>
                      <td>{c.duration}</td>
                      <td>
                        {c.start} → {c.end}
                      </td>
                      <td>{c.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No courses committed yet.</p>
          )}
          <h3>Decision history</h3>
          {d.events.length ? (
            <ol>
              {d.events.map((e, i) => (
                <li key={i}>
                  C{e.id + 1}: {e.outcome}
                  {e.removedId !== null ? ` · witness C${e.removedId + 1} removed` : ''} · total{' '}
                  {e.total}
                </li>
              ))}
            </ol>
          ) : (
            <p>No completed course decisions yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
