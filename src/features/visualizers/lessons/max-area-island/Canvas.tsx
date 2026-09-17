import { useEffect, useRef } from 'react';

import { motion } from 'motion/react';

import { StateLegend, useLessonReducedMotion } from '../../../../shared/ui/LessonPrimitives';

import { islandDirections } from './adapter';

import type { IslandData } from './adapter';

import '../../components/styles/sequence-and-grid.css';

const colors = { current: '#37d9ff', structure: '#9b8cff', reject: '#f06cae', success: '#4fd1a1' };

const cellKey = (cell: readonly number[]) => cell.join(',');

const term = (value: boolean | null) => (value === null ? 'not evaluated' : value ? 'yes' : 'no');

export function IslandCanvas({ data: d }: { data: IslandData }) {
  const reduced = useLessonReducedMotion();
  const stackRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = stackRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [d.stack.length]);
  const activeKey = d.active ? cellKey(d.active) : null;
  const seen = new Set(d.seen);
  const bestCells = new Set(d.islands.filter((i) => i.area === d.maxArea).flatMap((i) => i.cells));
  const top = d.stack.at(-1);
  const neighbor = d.neighbor;
  return (
    <div className="two-lesson island-studio" data-action={d.action}>
      <header className="two-heading">
        <div>
          <h2>Follow the call. Return the area.</h2>
          <p>Only right, down, left, and up connect an island.</p>
        </div>
        <span className="two-measure">
          {d.grid.length} × {d.grid[0].length} grid
        </span>
      </header>
      <StateLegend
        items={[
          { symbol: '0', label: 'Water', color: '#a9b4c2' },
          { symbol: '1', label: 'Unvisited land', color: colors.structure },
          { symbol: '→', label: 'Active call', color: colors.current },
          { symbol: '✓', label: 'Visited land', color: colors.success },
        ]}
      />
      <div className="island-workspace">
        <section className="two-plane island-map" aria-label="Island coordinate grid">
          <div className="two-heading">
            <h3>Land &amp; water</h3>
            <span className="two-measure">{d.seen.length} land cells in seen</span>
          </div>
          <div
            className="two-scroll"
            tabIndex={0}
            role="region"
            aria-label="Island map, scroll horizontally"
          >
            <table className="island-grid" data-small={d.grid[0].length <= 5}>
              <caption>grid[row][column] · grid values never change</caption>
              <thead>
                <tr>
                  <th scope="col">r / c</th>
                  {d.grid[0].map((_, c) => (
                    <th scope="col" key={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.grid.map((row, r) => (
                  <tr key={r}>
                    <th scope="row">{r}</th>
                    {row.map((value, c) => {
                      const key = r + ',' + c;
                      const active = key === activeKey;
                      const visited = seen.has(key);
                      const isNeighbor = neighbor && cellKey(neighbor.cell) === key;
                      const scan = d.scan && cellKey(d.scan) === key;
                      return (
                        <td
                          key={c}
                          className={
                            (value ? 'land' : 'water') +
                            (visited ? ' visited' : '') +
                            (active ? ' active' : '') +
                            (isNeighbor ? ' neighbor' : '') +
                            (scan ? ' scanned' : '') +
                            (d.result !== null && bestCells.has(key) ? ' best' : '')
                          }
                          aria-label={
                            'Row ' +
                            r +
                            ', column ' +
                            c +
                            ', ' +
                            (value ? 'land' : 'water') +
                            (visited ? ', visited' : '') +
                            (active ? ', active call' : '') +
                            (isNeighbor ? ', candidate neighbor' : '')
                          }
                        >
                          <b>{value}</b>
                          <span>
                            {active ? '→' : visited ? '✓' : scan ? 'scan' : isNeighbor ? 'try' : ''}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="island-directions" aria-label="Neighbor direction order">
            {islandDirections.map((dir, i) => (
              <li key={i} className={top?.direction === i ? 'current' : ''}>
                <b>
                  {i + 1}. {dir[2]}
                </b>
                <small>
                  ({dir[0]}, {dir[1]})
                </small>
              </li>
            ))}
          </ol>
          <p className="two-help">
            Water calls return 0 without entering seen. Visited land never starts a second DFS.
          </p>
          <section className="island-completed" aria-label="Completed island areas">
            <h3>Completed islands</h3>
            {d.islands.length ? (
              <ol>
                {d.islands.map((i) => (
                  <li key={i.id} className={i.area === d.maxArea ? 'success' : ''}>
                    <span>
                      Island {i.id} · root ({i.root.join(', ')})
                    </span>
                    <b>
                      {i.area} cells {i.area === d.maxArea ? '· largest' : ''}
                    </b>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No starting DFS has returned yet.</p>
            )}
          </section>
        </section>
        <aside className="island-detail">
          <section className="two-plane" aria-label="Neighbor check ledger">
            <h3>Next neighbor</h3>
            <p className="two-measure">
              {neighbor
                ? '(' + neighbor.cell.join(', ') + ') · ' + islandDirections[neighbor.direction][2]
                : d.active
                  ? 'Working at (' + d.active.join(', ') + ')'
                  : d.result !== null
                    ? 'All starting cells scanned'
                    : 'Outer scan'}
            </p>
            <dl className="island-checks">
              <div>
                <dt>Row in bounds?</dt>
                <dd>{neighbor ? term(neighbor.rowInBounds) : '—'}</dd>
              </div>
              <div>
                <dt>Column in bounds?</dt>
                <dd>{neighbor ? term(neighbor.columnInBounds) : '—'}</dd>
              </div>
              <div>
                <dt>Absent from seen?</dt>
                <dd>{neighbor ? term(neighbor.unseen) : '—'}</dd>
              </div>
            </dl>
          </section>
          <section className="two-plane" aria-label="DFS call stack">
            <h3>
              Call stack <span className="two-measure">depth {d.stack.length}</span>
            </h3>
            <p className="two-help">Each call owns its subtotal. The bottom call is active.</p>
            <ol
              className="island-stack"
              ref={stackRef}
              tabIndex={0}
              aria-label="Active DFS ancestry"
            >
              {d.stack.map((call, index) => (
                <li key={call.id} className={index === d.stack.length - 1 ? 'current' : ''}>
                  <span>
                    #{call.id} · dfs({call.cell.join(', ')})
                    <small>
                      {call.parentId === null ? 'island root' : 'caller #' + call.parentId}
                    </small>
                  </span>
                  <b>
                    {call.localArea === null ? 'not set' : call.localArea}
                    <small>local_area</small>
                  </b>
                </li>
              ))}
            </ol>
            {!d.stack.length && <p>No active DFS call.</p>}
          </section>
          <section className="two-plane" aria-label="Return and subtotal ledger">
            <h3>Return to the caller</h3>
            <motion.div
              initial={false}
              animate={{ y: d.addition ? 0 : 2 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
              className="island-return"
            >
              {d.addition ? (
                <>
                  <span>Caller #{d.addition.parentId} resumes</span>
                  <strong>
                    {d.addition.old} + <em>{d.addition.child}</em> = {d.addition.total}
                  </strong>
                  <p>Parent subtotal + child return</p>
                </>
              ) : d.returned ? (
                <>
                  <span>
                    Call #{d.returned.callId} returns to{' '}
                    {d.returned.parentId === null
                      ? 'the outer loop'
                      : 'caller #' + d.returned.parentId}
                  </span>
                  <strong>{d.returned.value}</strong>
                  <p>
                    {d.returned.value === 0
                      ? 'Water contributes no area.'
                      : 'Pass this completed subtotal back.'}
                  </p>
                </>
              ) : (
                <p>
                  {d.result !== null
                    ? 'Traversal complete. No calls are waiting to return.'
                    : 'Waiting for a child return. This is not the total visited-cell count.'}
                </p>
              )}
            </motion.div>
          </section>
        </aside>
      </div>
      <footer
        className={'two-result ' + (d.result !== null ? 'success' : '')}
        aria-label="Maximum island area"
      >
        <span>{d.result === null ? 'Largest completed island' : 'Final maximum area'}</span>
        <output>{d.maxArea}</output>
        <p>
          {d.result !== null
            ? 'All starting cells have been scanned.'
            : 'Updated only after an island’s root DFS returns.'}
        </p>
      </footer>
    </div>
  );
}
