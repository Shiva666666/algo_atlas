import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { GraphTraversalWorkbench, FrontierLedger } from '../../components/TraversalPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import type { CourseData } from './types';
export function CourseCanvas({ data }: { data: CourseData }) {
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Processing', symbol: '→', color: '#37d9ff' },
          { label: 'Ready in FIFO', symbol: 'Q', color: '#9b8cff' },
          { label: 'Recorded', symbol: '✓', color: '#4fd1a1' },
          { label: 'Blocked, not necessarily cyclic', symbol: '!', color: '#87909c' },
        ]}
      />
      <div className="study-layout">
        <section>
          <h3>Prerequisite → course</h3>
          <GraphTraversalWorkbench
            label="Course prerequisites with stable course positions"
            nodes={Array.from({ length: data.numCourses }, (_, i) => ({
              id: i,
              label: String(i),
              detail: `in ${data.indegree[i]}`,
              x:
                data.numCourses === 1
                  ? 320
                  : 320 + Math.cos(Math.PI + (2 * Math.PI * i) / data.numCourses) * 240,
              y:
                data.numCourses === 1
                  ? 175
                  : 175 + Math.sin(Math.PI + (2 * Math.PI * i) / data.numCourses) * 125,
              state:
                i === data.active
                  ? 'active'
                  : data.order.includes(i)
                    ? 'success'
                    : data.queue.includes(i)
                      ? 'frontier'
                      : data.blocked.includes(i)
                        ? 'blocked'
                        : 'idle',
            }))}
            edges={data.edges.map(([from, to]) => ({
              from,
              to,
              directed: true,
              state: data.inspected?.[0] === from && data.inspected[1] === to ? 'active' : 'idle',
            }))}
          />
          <h3>Indegree by course ID</h3>
          <SequenceStrip
            label="Course indegrees"
            cells={data.indegree.map((value, i) => ({
              value,
              note: data.order.includes(i)
                ? 'processed'
                : data.queue.includes(i)
                  ? 'queued'
                  : data.blocked.includes(i)
                    ? 'blocked'
                    : 'waiting',
              state: i === data.active ? 'active' : data.order.includes(i) ? 'stored' : 'idle',
            }))}
            pointer={data.active !== null ? { index: data.active, label: 'course' } : null}
          />
          <h3>Recorded order · separate from returned result</h3>
          <SequenceStrip
            label="Recorded course order"
            cells={data.order.map((value) => ({ value, state: 'stored' }))}
          />
          <p>
            {data.order.length
              ? 'Courses are appended only after being removed from the queue.'
              : 'Nothing has been processed yet.'}
          </p>
        </section>
        <aside>
          <FrontierLedger
            label="Ready courses · oldest first"
            kind="queue"
            items={data.queue.map((i, index) => ({
              id: String(i),
              primary: `Course ${i}`,
              secondary: index === 0 ? 'next to dequeue' : 'ready',
              state: 'frontier',
            }))}
          />
          <OperationLedger
            equation={data.equation}
            metrics={[
              { label: 'Processed', value: `${data.order.length} / ${data.numCourses}` },
              {
                label: 'Returned order',
                value: data.result === null ? 'Pending' : `[${data.result.join(', ')}]`,
              },
              {
                label: 'Blocked courses',
                value: data.blocked.length ? data.blocked.join(', ') : 'None identified',
              },
            ]}
          >
            <p>
              Blocked courses may be in a cycle or depend on one. A partial output is not a
              successful schedule.
            </p>
          </OperationLedger>
        </aside>
      </div>
    </div>
  );
}
