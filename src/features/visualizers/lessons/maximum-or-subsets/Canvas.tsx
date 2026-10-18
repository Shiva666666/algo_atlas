import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { StateLegend, useLessonReducedMotion } from '../../../../shared/ui/LessonPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import { FrontierLedger } from '../../components/TraversalPrimitives';
import type { OrData } from './types';
import '../../components/styles/counting-studios.css';
import './styles.css';

export function Canvas({ data: d }: { data: OrData }) {
  const current = d.calls.at(-1);
  const stack = useRef<HTMLDivElement>(null);
  const memo = useRef<HTMLDivElement>(null);
  const reduced = useLessonReducedMotion();
  useEffect(() => {
    const region = stack.current;
    const active = region?.querySelector('li:last-child');
    if (!region || !active) return;
    const a = active.getBoundingClientRect(),
      b = region.getBoundingClientRect();
    if (a.bottom > b.bottom - 12) region.scrollTop += a.bottom - b.bottom + 12;
    else if (a.top < b.top) region.scrollTop -= b.top - a.top;
  }, [current?.id]);
  useEffect(() => {
    const region = memo.current,
      row = region?.querySelector('.memo-current');
    if (!region || !row) return;
    const a = row.getBoundingClientRect(),
      b = region.getBoundingClientRect();
    if (a.bottom > b.bottom - 8) region.scrollTop += a.bottom - b.bottom + 8;
    else if (a.top < b.top + 35) region.scrollTop -= b.top + 35 - a.top;
  }, [d.memoKey?.[0], d.memoKey?.[1], d.memo.length]);
  const width = Math.max(...d.nums).toString(2).length;
  const activeIndex = d.scan ?? (current && current.pos < d.nums.length ? current.pos : null);
  const chosen = new Set(current?.chosen ?? []);
  const old = d.bit?.old ?? current?.or ?? (d.targetReady ? null : 0);
  const value =
    d.bit?.value ?? (current && current.pos < d.nums.length ? d.nums[current.pos] : null);
  const next = value === null || old === null ? null : old | value;
  const rows = [
    { label: d.targetReady ? 'Current OR' : 'Target so far', value: old },
    { label: 'Incoming number', value },
    { label: d.bit ? 'Evaluated OR' : 'Take preview', value: next },
    { label: d.targetReady ? 'Fixed target' : 'Building target', value: d.maxOr },
  ];
  const binary = (n: number) => n.toString(2).padStart(width, '0');
  const branching = current && current.pos < d.nums.length && !d.cacheHit;
  return (
    <div className="study-workbench counting-studio or-studio">
      <StateLegend
        items={[
          { label: 'Current choice', symbol: '□', color: '#37d9ff' },
          { label: 'Target / stored memo', symbol: '◇', color: '#9b8cff' },
          { label: 'Pending child', symbol: '?', color: '#f06cae' },
          { label: 'Returned count', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <SequenceStrip
        label="Indexed subset choices"
        cells={d.nums.map((number, i) => ({
          value: number,
          note:
            d.result !== null
              ? 'input index'
              : chosen.has(i)
                ? 'taken index'
                : current && i < current.pos
                  ? 'skipped index'
                  : 'undecided',
          state: i === activeIndex ? 'active' : chosen.has(i) ? 'stored' : 'idle',
        }))}
        pointer={
          activeIndex === null
            ? null
            : { index: activeIndex, label: d.targetReady ? 'cur_pos' : 'target scan' }
        }
      />
      <div className="study-layout">
        <section>
          <h3>Bit union · set bits never disappear</h3>
          <p className="studio-note">
            {d.bit
              ? 'This OR operation is evaluated by the source.'
              : d.result !== null
                ? 'No active call remains. The fixed target and stored counts remain available for review.'
                : 'Derived take preview only · no OR operation is evaluated in this step.'}
          </p>
          <div
            className="study-scroll"
            role="region"
            tabIndex={0}
            aria-label="Scrollable OR bit operation"
          >
            <table className="studio-table or-bits">
              <caption>High bit → low bit</caption>
              <thead>
                <tr>
                  <th scope="col">Register</th>
                  <th scope="col">Decimal</th>
                  {Array.from({ length: width }, (_, i) => (
                    <th scope="col" key={i}>
                      {width - i - 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.label} className={ri === 3 ? 'or-target' : ''}>
                    <th scope="row">{row.label}</th>
                    <td>{row.value ?? '—'}</td>
                    {Array.from({ length: width }, (_, i) => {
                      const bit = row.value === null ? '—' : binary(row.value)[i];
                      const added =
                        ri === 2 && bit === '1' && old !== null && binary(old)[i] === '0';
                      return (
                        <td key={i} className={added ? 'bit-added' : bit === '1' ? 'bit-set' : ''}>
                          {bit}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {branching ? (
            <section className="studio-section" aria-label="Take and skip continuation counts">
              <h3>Two index choices, two continuation counts</h3>
              <div className="or-choices">
                <div className={d.action.startsWith('take') ? 'choice-current' : ''}>
                  <h4>Take index {current.pos}</h4>
                  <code>
                    ({current.pos + 1}, {current.or | d.nums[current.pos]})
                  </code>
                  <p>OR gains this value’s bits.</p>
                  <strong className={current.take === null ? 'branch-pending' : 'branch-returned'}>
                    {current.take === null ? 'Pending' : `${current.take} continuations`}
                  </strong>
                </div>
                <span className="or-plus" aria-hidden="true">
                  +
                </span>
                <div className={d.action.startsWith('skip') ? 'choice-current' : ''}>
                  <h4>Skip index {current.pos}</h4>
                  <code>
                    ({current.pos + 1}, {current.or})
                  </code>
                  <p>Advance with the same OR.</p>
                  <strong className={current.skip === null ? 'branch-pending' : 'branch-returned'}>
                    {current.skip === null ? 'Pending' : `${current.skip} continuations`}
                  </strong>
                </div>
              </div>
            </section>
          ) : (
            <p className="studio-note">
              {d.cacheHit
                ? 'Memo hit: return the stored count without exploring these children again.'
                : current
                  ? 'Terminal call: return 1 only when the collected OR equals the target.'
                  : d.result !== null
                    ? 'All calls returned. The root count is the answer.'
                    : 'Finish building the target before exploring subsets.'}
            </p>
          )}
          <section className="studio-section" aria-label="Tuple memoization table">
            <h3>memo[(cur_pos, cur_or)] · continuation counts</h3>
            <p>
              A cached count can be reused by different earlier choices. It is not a set of unique
              paths.
            </p>
            {d.memoKey && (
              <p className="or-lookup">
                Current key ({d.memoKey.join(', ')}) ·{' '}
                {d.cacheHit === true
                  ? 'cache hit'
                  : d.memo.some((m) => m.pos === d.memoKey![0] && m.or === d.memoKey![1])
                    ? 'stored'
                    : 'not cached'}
              </p>
            )}
            <div
              ref={memo}
              className="study-scroll or-memo-scroll"
              role="region"
              tabIndex={0}
              aria-label="Scrollable sparse memo"
            >
              <table className="studio-table">
                <caption>Only completed nonterminal calls are stored. A stored 0 is valid.</caption>
                <thead>
                  <tr>
                    <th scope="col">Position</th>
                    <th scope="col">OR</th>
                    <th scope="col">Binary</th>
                    <th scope="col">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {d.memo.map((entry) => (
                    <tr
                      key={`${entry.pos}:${entry.or}`}
                      className={
                        d.memoKey?.[0] === entry.pos && d.memoKey?.[1] === entry.or
                          ? 'memo-current'
                          : ''
                      }
                    >
                      <th scope="row">{entry.pos}</th>
                      <td>{entry.or}</td>
                      <td>{binary(entry.or)}</td>
                      <td>{entry.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!d.memo.length && <p>Not cached yet · terminal returns do not create entries.</p>}
            </div>
          </section>
        </section>
        <aside className="studio-ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              { label: d.targetReady ? 'Fixed target' : 'Target so far', value: d.maxOr },
              {
                label: 'Current (position, OR)',
                value: current ? `(${current.pos}, ${current.or})` : 'No active call',
              },
              {
                label: 'Take / skip',
                value: current
                  ? `${current.take ?? 'Pending'} / ${current.skip ?? 'Pending'}`
                  : '—',
              },
              { label: 'Child / call returned', value: d.returned ?? 'Pending' },
            ]}
          />
          {d.action === 'memo-hit' && (
            <motion.div
              className="studio-memo-hit"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
            >
              <h3>Reuse {d.returned} continuations</h3>
              <p>Same remaining suffix and OR, regardless of which earlier indexes led here.</p>
            </motion.div>
          )}
          <div
            ref={stack}
            className="study-scroll or-ancestry"
            role="region"
            tabIndex={0}
            aria-label="Scrollable OR call ancestry"
          >
            <FrontierLedger
              label="Active call ancestry"
              kind="stack"
              items={d.calls.map((call, i) => ({
                id: String(call.id),
                primary: `#${call.id} · backtrack(${call.pos}, ${call.or})`,
                secondary: `${i === d.calls.length - 1 ? 'Current' : 'Waiting'} · via ${call.via} · return ${call.returned ?? 'pending'}`,
                state: i === d.calls.length - 1 ? 'active' : 'frontier',
              }))}
            />
          </div>
          <p>
            Equal values at different indexes are different subset choices. Positive inputs ensure
            the empty selection cannot match the target.
          </p>
        </aside>
      </div>
      {d.result !== null && (
        <output className="studio-result" aria-label="Returned maximum OR subset count">
          Returned subset count: {d.result}
        </output>
      )}
    </div>
  );
}
