import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowRight, Scissors } from 'lucide-react';
import { digitPhases, type RemoveKDigitsData } from './adapter';
import { StateLegend, useLessonReducedMotion } from '../../../../shared/ui/LessonPrimitives';

const truth = (value: boolean | null) =>
  value === null ? 'not evaluated' : value ? 'true' : 'false';
export function RemoveKDigitsCanvas({ data: d }: { data: RemoveKDigitsData }) {
  const reduced = useLessonReducedMotion();
  const phaseIndex = digitPhases.findIndex((phase) => phase.id === d.phase);
  const removed = new Set(d.removed.map((item) => item.index));
  const top = d.topIndex === null ? null : d.num[d.topIndex];
  const isResult = d.result !== null;
  return (
    <div className="digits-studio" data-phase={d.phase} data-action={d.action}>
      <ol className="digits-phases" aria-label="Algorithm phases">
        {digitPhases.map((phase, index) => (
          <li
            key={phase.id}
            className={
              d.earlyReturn
                ? 'skipped'
                : index === phaseIndex
                  ? 'current'
                  : index < phaseIndex
                    ? 'finished'
                    : ''
            }
            aria-current={!d.earlyReturn && index === phaseIndex ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            <div>
              {phase.label}
              <small>
                {d.earlyReturn
                  ? 'Skipped · early return'
                  : index < phaseIndex
                    ? 'Complete'
                    : index === phaseIndex
                      ? 'Current phase'
                      : 'Upcoming'}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <div className="digits-studio-key">
        <StateLegend
          items={[
            { label: 'Current', symbol: '●', color: '#37d9ff' },
            { label: 'Retained', symbol: '◇', color: '#9b8cff' },
            { label: 'Removed', symbol: '×', color: '#f06cae' },
            { label: 'Answer', symbol: '✓', color: '#4fd1a1' },
          ]}
        />
        <span>Stack entries are original indexes</span>
      </div>
      <section className="digits-source" aria-label="Indexed input ribbon">
        <div className="digits-section-heading">
          <h3>Original digits</h3>
          <span>
            {d.scanIndex === null ? 'Input order is preserved' : `Reading index ${d.scanIndex}`}
          </span>
        </div>
        <div className="digits-strip" tabIndex={0} aria-label="Original digits and their indexes">
          {[...d.num].map((digit, index) => {
            const state = removed.has(index)
              ? 'removed'
              : d.scanIndex === index
                ? 'current'
                : d.stack.includes(index)
                  ? 'retained'
                  : 'unread';
            return (
              <div
                className={`digits-token ${state}`}
                key={index}
                aria-label={`Index ${index}, digit ${digit}, ${state}`}
              >
                <small>{index}</small>
                <b>{digit}</b>
                <span>
                  {state === 'removed'
                    ? 'cut'
                    : state === 'current'
                      ? 'read'
                      : state === 'retained'
                        ? 'keep'
                        : 'unread'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <div className="digits-workspace">
        <section className="digits-stack-section" aria-label="Index stack">
          <div className="digits-section-heading">
            <h3>Index stack</h3>
            <span>
              Bottom <ArrowRight size={14} /> top
            </span>
          </div>
          <p className="digits-stack-hint">
            An index points back to its digit. Pop from the right.
          </p>
          <div className="digits-stack" tabIndex={0} aria-label="Retained stack indexes">
            <AnimatePresence initial={false}>
              {d.stack.map((index) => (
                <motion.div
                  layout={!reduced}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  transition={{ duration: reduced ? 0 : 0.18 }}
                  key={index}
                  className={`digits-stack-item ${index === d.topIndex ? 'top' : ''} ${index === d.outputIndex ? 'reading' : ''}`}
                >
                  <small>index {index}</small>
                  <b>{d.num[index]}</b>
                  <span>{index === d.topIndex ? 'TOP' : `num[${index}]`}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!d.stack.length && (
              <p>
                {d.earlyReturn
                  ? 'No stack created: the early guard returned zero.'
                  : 'Empty stack — the next digit can be appended.'}
              </p>
            )}
          </div>
          <div className="digits-stack-code">
            <code>stack = [{d.stack.join(', ')}]</code>
            <span>{d.stack.length} retained</span>
          </div>
          <p className="digits-greedy-rule">
            Removing a larger digit at the earliest differing position makes the remaining number
            smaller.
          </p>
        </section>
        <aside className="digits-decision" aria-label="Comparison and removal budget">
          <div className="digits-section-heading">
            <h3>Removal budget</h3>
            <Scissors size={18} />
          </div>
          <dl className="digits-budget">
            <div>
              <dt>Original k</dt>
              <dd>{d.originalK}</dd>
            </div>
            <div>
              <dt>Accounted for</dt>
              <dd>{d.originalK - d.remainingK}</dd>
            </div>
            <div className="remaining">
              <dt>Remaining k</dt>
              <dd>{d.remainingK}</dd>
            </div>
          </dl>
          <p className="digits-budget-note" role="status">
            {d.earlyReturn
              ? 'Guard returned “0”; no loop budget updates run.'
              : d.pendingSpend
                ? 'Digit popped. The next line decrements k.'
                : d.phase === 'trim'
                  ? 'Formatting zeros never spends k.'
                  : d.remainingK === 0
                    ? 'Budget exhausted. Remaining digits are kept.'
                    : 'A pop uses one removal.'}
          </p>
          <div className="digits-comparison">
            <span>{d.phase === 'scan' ? 'Stack top > incoming digit' : 'Current operation'}</span>
            <strong>
              {d.phase === 'scan'
                ? `${top ?? '—'} > ${d.currentDigit ?? '—'}`
                : d.phase === 'tail'
                  ? 'Remove from the tail'
                  : d.phase === 'build'
                    ? 'index → num[index]'
                    : 'Trim leading zeros'}
            </strong>
          </div>
          {d.condition && (
            <dl className="digits-conditions">
              {(d.phase === 'scan'
                ? [
                    ['Stack nonempty', d.condition.stackPresent],
                    ['Top > current', d.condition.greater],
                    ['k remains', d.condition.budgetAvailable],
                  ]
                : [
                    ['k remains', d.condition.budgetAvailable],
                    ['Stack nonempty', d.condition.stackPresent],
                  ]
              ).map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{label}</dt>
                  <dd>{truth(value as boolean | null)}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="digits-decision-footnote">
            Equal digits do not satisfy <code>&gt;</code>. After k reaches zero, the stack can
            descend.
          </p>
        </aside>
      </div>
      <section className="digits-removals" aria-label="Removed-digit tray">
        <div className="digits-section-heading">
          <h3>Removed digits</h3>
          <span>{d.removed.length} pop operations</span>
        </div>
        <div className="digits-removed-items">
          {d.removed.map((item) => (
            <div key={item.index}>
              <b>{d.num[item.index]}</b>
              <span>
                index {item.index}
                <small>{item.reason}</small>
              </span>
            </div>
          ))}
          {!d.removed.length && (
            <p>
              {d.earlyReturn
                ? 'All digits are removed by the early-return rule; no pop operations occur.'
                : 'No digits have been popped yet.'}
            </p>
          )}
        </div>
      </section>
      <section
        className={`digits-answer ${isResult ? 'complete' : ''}`}
        aria-label="Answer construction and zero formatting"
      >
        <div className="digits-section-heading">
          <h3>Build and format the answer</h3>
          <span>Formatting does not change the removal budget</span>
        </div>
        <div className="digits-answer-flow">
          <div>
            <span>Raw res</span>
            <div className="digits-raw" tabIndex={0}>
              {[...d.rawOutput].map((digit, index) => (
                <span
                  key={index}
                  className={
                    d.trimIndex !== null && index < d.trimIndex
                      ? 'trimmed'
                      : index === d.trimIndex
                        ? 'pointer'
                        : ''
                  }
                >
                  <b>{digit}</b>
                  <small>{index}</small>
                </span>
              ))}
              {!d.rawOutput && <em>{d.earlyReturn ? 'not constructed' : 'not built yet'}</em>}
            </div>
            <small>
              {d.trimIndex === null
                ? 'Read the retained indexes in order'
                : `i = ${d.trimIndex} in res · ${d.trimIndex} leading zeros skipped`}
            </small>
          </div>
          <ArrowRight className="digits-answer-arrow" aria-hidden="true" />
          <div className="digits-final">
            <span>Returned string</span>
            <output aria-label="Final answer">{d.result ?? '—'}</output>
            <small>
              {d.result === null
                ? 'Waiting for the return statement'
                : d.earlyReturn
                  ? 'len(num) == k'
                  : d.result === '0'
                    ? 'Zero is represented as “0”'
                    : 'Leading zeros removed'}
            </small>
          </div>
        </div>
      </section>
      <p className="digits-footer">
        <ArrowDown size={16} /> Open Code &amp; steps to follow the exact Python line for this
        operation.
      </p>
    </div>
  );
}
