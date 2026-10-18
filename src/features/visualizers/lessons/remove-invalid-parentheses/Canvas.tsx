import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { LessonMotion, StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { IndexedStackRail } from '../../components/IndexedStackRail';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import type { RemovalData } from './types';
import './styles.css';
export function Canvas({ data: d }: { data: RemovalData }) {
  const current = d.calls.at(-1);
  const ancestryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const region = ancestryRef.current;
    const active = region?.querySelector<HTMLElement>('.active-call');
    if (!region || !active) return;
    const viewport = region.getBoundingClientRect();
    const card = active.getBoundingClientRect();
    // Keep the active call readable without moving the surrounding page.
    if (card.bottom > viewport.bottom - 14) region.scrollTop += card.bottom - viewport.bottom + 14;
    else if (card.top < viewport.top + 4) region.scrollTop += card.top - viewport.top - 4;
  }, [current?.id, d.calls.length]);
  const retained = new Set(d.tokens.map((t) => t.index));
  const activeId =
    d.phase === 'budget'
      ? d.readIndex
      : d.phase === 'validation'
        ? d.tokens[d.checkIndex]?.index
        : d.tokens[d.activeIndex ?? -1]?.index;
  const checking = d.validation !== 'not-run';
  return (
    <div className="study-workbench removal-lab">
      <StateLegend
        items={[
          { label: 'Current character', symbol: '□', color: '#37d9ff' },
          { label: 'Stored opening / ancestry', symbol: '(', color: '#9b8cff' },
          { label: 'Deleted / rejected', symbol: '×', color: '#f06cae' },
          { label: 'Unique answer', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="removal-phases" aria-label="Algorithm phases">
        <span className={d.phase === 'budget' ? 'current' : ''}>Count minimum removals</span>
        <span className={d.phase === 'search' ? 'current' : ''}>Search candidates</span>
        <span className={d.phase === 'validation' ? 'current' : ''}>Validate each leaf</span>
        <span className={d.phase === 'complete' ? 'complete' : ''}>Return unique answers</span>
      </div>
      <section aria-label="Original character identities">
        <h3>Original string · stable character IDs</h3>
        <div
          className="study-scroll"
          role="region"
          tabIndex={0}
          aria-label="Scrollable original string"
        >
          <ol className="study-strip removal-origin">
            {[...d.s].map((char, i) => {
              const chosen = d.action === 'delete' && d.deletion?.originalIndex === i;
              const deleted = !retained.has(i);
              return (
                <li
                  key={i}
                  className={deleted || chosen ? 'deleted' : i === activeId ? 'study-active' : ''}
                >
                  <span className="study-index">ID {i}</span>
                  <b>{char}</b>
                  <span>
                    {deleted
                      ? 'Deleted'
                      : chosen
                        ? 'Chosen'
                        : i === activeId
                          ? 'Current'
                          : d.phase === 'complete'
                            ? 'Input'
                            : 'Kept'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      <div className="study-layout">
        <section className="removal-candidates" aria-label="Candidate search workspace">
          {d.phase === 'budget' ? (
            <>
              <IndexedStackRail label="Unmatched openings · stack" tokens={d.countStack} />
              <p>
                Missing openings plus remaining unmatched openings give the minimum deletions.
                Letters stay intact.
              </p>
            </>
          ) : d.phase === 'complete' ? (
            <>
              <h3>Search complete</h3>
              <p>
                Every call has returned. The original input stays unchanged; the accepted answers
                are listed below.
              </p>
            </>
          ) : (
            <>
              <h3>Current candidate · positions shift after deletion</h3>
              {d.tokens.length ? (
                <SequenceStrip
                  label="Current candidate characters"
                  cells={d.tokens.map((token, i) => ({
                    value: token.value,
                    note: 'ID ' + token.index,
                    state:
                      i === (d.phase === 'validation' ? d.checkIndex : d.activeIndex)
                        ? 'active'
                        : 'idle',
                  }))}
                />
              ) : (
                <p className="removal-empty">Empty string · ""</p>
              )}
              {d.action === 'delete' && d.deletion && (
                <LessonMotion>
                  <motion.div layout className="removal-transfer" aria-label="Deletion transition">
                    <strong>
                      Delete ID {d.deletion.originalIndex} at current index{' '}
                      {d.deletion.currentIndex}
                    </strong>
                    <code>
                      Child: {JSON.stringify(d.deletion.nextString)} · ind ={' '}
                      {d.deletion.currentIndex}
                    </code>
                    <p>The next character shifts into the removed position.</p>
                  </motion.div>
                </LessonMotion>
              )}
              {d.action === 'resume' && (
                <div className="removal-transfer" aria-label="Parent resumption">
                  <strong>Resume parent state</strong>
                  <p>
                    The caller's string is unchanged. Continue the loop with the next index;
                    returning does not cancel its remaining choices.
                  </p>
                </div>
              )}
              <h3>Active call ancestry</h3>
              <div
                ref={ancestryRef}
                className="study-scroll removal-ancestry"
                role="region"
                tabIndex={0}
                aria-label="Scrollable call ancestry"
              >
                <ol>
                  {d.calls.map((call, i) => (
                    <li key={call.id} className={i === d.calls.length - 1 ? 'active-call' : ''}>
                      <span>
                        Call {call.id} ·{' '}
                        {i === d.calls.length - 1 ? 'Current' : 'Waiting for child'}
                      </span>
                      <code>{JSON.stringify(call.tokens.map((t) => t.value).join(''))}</code>
                      <span>
                        {call.removes}/{d.minimum} removals · ind {call.ind}
                        {call.nextIndex === null ? '' : ' · i ' + call.nextIndex}
                      </span>
                    </li>
                  ))}
                </ol>
                {!d.calls.length && <p>Search has not entered its first call yet.</p>}
              </div>
              <p>
                backtrack returns control, not a boolean. Only check(s_loc) decides whether a leaf
                is valid.
              </p>
            </>
          )}
        </section>
        <div className="removal-ledgers">
          <OperationLedger
            equation={d.equation}
            metrics={[
              {
                label: d.sealed ? 'Minimum removals' : 'Unmatched closers so far',
                value: d.minimum,
              },
              { label: 'Removed in current call', value: current?.removes ?? 0 },
              {
                label: 'Remaining deletion budget',
                value: d.sealed
                  ? d.phase === 'complete'
                    ? 0
                    : d.minimum - (current?.removes ?? 0)
                  : 'Counting',
              },
              { label: 'Unique accepted answers', value: d.results.length },
            ]}
          />
          <section
            className={'removal-validation ' + d.validation}
            aria-label="Candidate validator"
          >
            <h3>Leaf validator</h3>
            <p>
              {checking
                ? d.validationReason
                : 'At the exact budget: reject duplicates, compare counts, then check prefix order.'}
            </p>
            {d.openCount !== null && (
              <dl>
                <div>
                  <dt>Opening count</dt>
                  <dd>{d.openCount}</dd>
                </div>
                <div>
                  <dt>Closing count</dt>
                  <dd>{d.closeCount}</dd>
                </div>
              </dl>
            )}
            {d.validation === 'scanning' ||
            d.validation === 'valid' ||
            (d.validation === 'invalid' && d.openCount === d.closeCount) ? (
              <IndexedStackRail label="Validator openings · loc_stack" tokens={d.checkStack} />
            ) : null}
            {checking && (
              <strong>
                {d.validation === 'duplicate'
                  ? 'Duplicate · check skipped'
                  : d.validation === 'valid'
                    ? 'Valid candidate'
                    : d.validation === 'invalid'
                      ? 'Rejected candidate'
                      : 'Check in progress'}
              </strong>
            )}
          </section>
        </div>
      </div>
      <section className="removal-answers" aria-label="Unique minimal answers">
        <h3>
          {d.result
            ? 'Returned answers'
            : d.phase === 'budget'
              ? 'Answer collector · after stack.clear()'
              : 'Unique answers · stack now stores strings'}
        </h3>
        <LessonMotion>
          <motion.ul layout>
            {d.results.map((text) => (
              <motion.li layout key={text}>
                <code>{JSON.stringify(text)}</code>
                <span>Valid · {d.minimum} removals</span>
              </motion.li>
            ))}
          </motion.ul>
        </LessonMotion>
        {!d.results.length && <p>No accepted answer yet.</p>}
        <p>
          seen stores accepted strings only. Repeated deletion paths still run, but an accepted
          duplicate skips validation.
        </p>
      </section>
    </div>
  );
}
