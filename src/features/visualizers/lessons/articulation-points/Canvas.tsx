import type { LessonValue } from './types';
export function ArticulationLesson({ v }: { v: LessonValue }) {
  return (
    <div className="three-lesson articulation-lesson">
      <section className="state-plane">
        <header>
          <span>DFS LOW-LINK TABLE</span>
          <small>source trace state</small>
        </header>
        <div className="generic-array">
          {(v.disc ?? []).map((d: number, i: number) => (
            <div className={(v.active ?? []).includes(i) ? 'active' : ''} key={i}>
              <small>vertex {i}</small>
              <b>
                disc {d} / low {(v.low ?? [])[i] ?? '-'}
              </b>
            </div>
          ))}
        </div>
        <p className="lesson-inline-note">
          {v.stack?.length
            ? `DFS stack: ${v.stack.join(' -> ')}`
            : 'Step through the trace to build the DFS forest.'}
        </p>
      </section>
      <p className="why-line">
        The comparison low[child] is at least discovery[curr] is evaluated after a child returns;
        the root uses its DFS child count instead.
      </p>
    </div>
  );
}
