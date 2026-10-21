import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import {
  StateLegend,
  LessonButton,
  useLessonReducedMotion,
} from '../../../../shared/ui/LessonPrimitives';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { DivisionData } from './types';
import '../../components/styles/counting-studios.css';
import './styles.css';
export function Canvas({ data: d, onInteract }: { data: DivisionData; onInteract?: () => void }) {
  const reduced = useLessonReducedMotion();
  const [inspected, setInspected] = useState<number | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const c = d.current,
    selected = inspected ?? c?.bit ?? (d.i !== null && d.i >= 0 ? d.i : 0);
  const check = d.checks.find((x) => x.bit === selected);
  const chunks = d.checks.filter((x) => x.fits);
  const loopEntry = d.action === 'loop',
    checksDone = d.action === 'loop-end' || d.result !== null;
  const show = (v: number | string | null) => v ?? 'Not initialized';
  useEffect(() => {
    const region = scroll.current,
      cell = region?.querySelector<HTMLElement>(`[data-bit="${selected}"]`);
    if (region && cell)
      region.scrollLeft = Math.max(
        0,
        cell.offsetLeft - region.clientWidth / 2 + cell.offsetWidth / 2,
      );
  }, [selected]);
  const candidate = c ? Number(c.candidate) : 0,
    remaining = Math.max(0, c?.before ?? d.dividend),
    scale = Math.max(candidate, remaining, 1);
  return (
    <div className="study-workbench counting-studio division-studio">
      <StateLegend
        items={[
          { label: 'Current comparison', symbol: '□', color: '#37d9ff' },
          { label: 'Quotient structure / inspected', symbol: '◇', color: '#9b8cff' },
          { label: 'Too large / not taken', symbol: '×', color: '#f06cae' },
          { label: 'Committed quotient bit', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="division-layout">
        <section aria-label="Shift comparison workspace">
          <h3>
            {d.overflow
              ? 'Overflow guard'
              : c
                ? `Try divisor shifted by ${c.bit}`
                : checksDone
                  ? 'All shifts complete'
                  : loopEntry
                    ? `Prepare shift ${d.i}`
                    : 'Prepare the magnitudes'}
          </h3>
          <p>
            Take the largest power-of-two chunk that fits. Each accepted chunk writes one quotient
            bit. Unless the overflow guard returns first, the saved loop checks every shift from 31
            through 0.
          </p>
          <dl className="division-signs">
            <div>
              <dt>Original dividend</dt>
              <dd>{d.originalDividend}</dd>
            </div>
            <div>
              <dt>Original divisor</dt>
              <dd>{d.originalDivisor}</dd>
            </div>
            <div>
              <dt>Remembered is_neg</dt>
              <dd>{d.isNeg === null ? 'Not set' : String(d.isNeg)}</dd>
            </div>
          </dl>
          {d.overflow ? (
            <div className="division-guard">
              <strong>−2147483648 ÷ −1 would be 2147483648</strong>
              <p>
                That exceeds INT_MAX. The first return clamps to 2147483647. Initialization,
                normalization, and all shift checks are skipped.
              </p>
            </div>
          ) : (
            <>
              <div
                className="division-comparison"
                aria-label="Candidate versus remaining magnitude"
              >
                <div>
                  <span>
                    {c
                      ? 'Remaining before this check'
                      : d.dividend < 0
                        ? 'Source dividend · normalization pending'
                        : 'Source dividend · current magnitude'}
                  </span>
                  <strong>{c?.before ?? d.dividend}</strong>
                  <div className="division-meter" aria-hidden="true">
                    <div style={{ width: `${(remaining / scale) * 100}%` }} />
                  </div>
                </div>
                <div className={c && !c.fits ? 'division-rejected' : ''}>
                  <span>Candidate · divisor &lt;&lt; shift</span>
                  <strong>
                    {c?.candidate ?? (checksDone ? 'Checks complete' : 'Not evaluated')}
                  </strong>
                  <div className="division-meter" aria-hidden="true">
                    <div style={{ width: `${(candidate / scale) * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="division-scale">
                {c
                  ? 'Bars share a relative scale for this check. Decimal labels are exact, including candidates larger than 2³¹.'
                  : checksDone
                    ? 'All candidate comparisons are complete. The source dividend now holds the unused magnitude.'
                    : loopEntry
                      ? 'The loop condition passed. The next shifted candidate has not been evaluated yet.'
                      : 'Comparison bars activate after magnitude conversion. Negative source arguments have no magnitude bar until converted.'}
              </p>
              <div className="division-decision">
                {c
                  ? `${c.fits ? 'Fits' : 'Too large'}: ${c.candidate} ${c.fits ? '≤' : '>'} ${c.before}`
                  : checksDone
                    ? d.result === null
                      ? 'All 32 shift checks are complete. Apply the remembered sign at the next return.'
                      : 'No candidate remains. The remembered sign has been applied.'
                    : loopEntry
                      ? `Loop condition passed. Next evaluate divisor << ${d.i} against the remaining dividend.`
                      : 'Check the sign bits, then convert negative source arguments with ~x + 1.'}
              </div>
              <div className="division-flow">
                <ArrowDown size={20} aria-hidden="true" />
                <span>
                  {c?.state === 'subtracted'
                    ? 'Subtraction complete · quotient update pending'
                    : c?.state === 'committed'
                      ? 'Quotient bit committed · then decrease i'
                      : c?.fits
                        ? 'Subtract chunk → add bit weight → decrease i'
                        : c
                          ? 'Keep quotient unchanged → decrease i'
                          : checksDone
                            ? d.result === null
                              ? 'Loop finished · signed return pending'
                              : 'Signed quotient returned'
                            : loopEntry
                              ? 'Magnitudes ready · candidate check pending'
                              : 'The source dividend becomes the remaining magnitude.'}
                </span>
              </div>
              <div className="division-writes">
                <div>
                  <span>
                    {d.dividend < 0
                      ? 'Source dividend · not normalized yet'
                      : 'Source dividend · remaining'}
                  </span>
                  <strong>{d.dividend}</strong>
                  <small>
                    {c
                      ? `${c.before} − ${c.state === 'subtracted' || c.state === 'committed' ? c.candidate : '0 (no subtraction yet)'}`
                      : 'Current source argument'}
                  </small>
                </div>
                <div className={c?.state === 'committed' ? 'division-committed' : ''}>
                  <span>Source res · quotient magnitude</span>
                  <motion.strong
                    key={`quotient-${d.res}`}
                    initial={reduced ? false : { opacity: 0.75, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduced ? 0 : 0.15, ease: 'easeOut' }}
                  >
                    {show(d.res)}
                  </motion.strong>
                  <small>
                    {c?.state === 'subtracted'
                      ? `Still ${c.oldRes}; bit ${c.bit} is not written yet`
                      : 'Sign is applied only at return'}
                  </small>
                </div>
              </div>
            </>
          )}
        </section>
        <aside className="studio-ledger" aria-label="Source state ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              { label: 'Source i', value: show(d.i) },
              { label: 'Source divisor', value: d.divisor },
              {
                label: 'Checks evaluated',
                value: `${d.checks.length} / ${d.overflow ? 'skipped' : 32}`,
              },
              {
                label: 'Accepted bits committed',
                value: d.checks.filter((x) => x.state === 'committed').length,
              },
            ]}
          />
          <p>
            The diagram is a teaching trace. Your saved Python is reference text and is never
            executed.
          </p>
          <p>
            At completed writes: <code>|original dividend| = divisor × res + remaining</code>.
            Between subtraction and the res write, the matching quotient update is pending.
          </p>
        </aside>
      </div>
      <section className="studio-section" aria-label="Quotient bit inspector">
        <h3>Build the quotient, one bit at a time</h3>
        <p>
          Read from bit 31 on the left to bit 0 on the right. Select a bit to inspect it without
          changing the timeline. A dash means undecided: either unread or waiting for its quotient
          write. Only a rejected check commits zero.
        </p>
        <div className="division-inspect-controls">
          <label>
            Inspect quotient bit
            <select
              value={selected}
              onChange={(e) => {
                onInteract?.();
                setInspected(Number(e.target.value));
              }}
            >
              {Array.from({ length: 32 }, (_, n) => 31 - n).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <LessonButton
            className="studio-text-button"
            onClick={() => {
              onInteract?.();
              setInspected(null);
            }}
          >
            Follow active shift
          </LessonButton>
          <span>
            {inspected === null ? 'Following playback' : 'Inspecting only · playback paused'}
          </span>
        </div>
        <div
          className="study-scroll division-bits-scroll"
          ref={scroll}
          role="region"
          aria-label="Scrollable 32-bit quotient"
          tabIndex={0}
        >
          <ol className="division-bits">
            {Array.from({ length: 32 }, (_, n) => 31 - n).map((i) => {
              const item = d.checks.find((x) => x.bit === i),
                state =
                  item?.state === 'committed'
                    ? 'committed'
                    : item?.state === 'rejected'
                      ? 'rejected'
                      : 'pending';
              return (
                <li
                  key={i}
                  data-bit={i}
                  className={`division-bit-${state}${i === selected ? ' division-bit-inspected' : ''}${c?.bit === i ? ' division-bit-active' : ''}`}
                >
                  <button
                    aria-label={`Inspect quotient bit ${i}`}
                    aria-pressed={i === selected}
                    onClick={() => {
                      onInteract?.();
                      setInspected(i);
                    }}
                  >
                    <small>{i}</small>
                    <strong>
                      {item?.state === 'committed' ? '1' : item?.state === 'rejected' ? '0' : '—'}
                    </strong>
                    <span>
                      {d.overflow
                        ? 'Skipped'
                        : item?.state === 'committed'
                          ? 'Set'
                          : item?.state === 'rejected'
                            ? 'Skip'
                            : item
                              ? 'Pending'
                              : 'Unread'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="division-inspection">
          Bit {selected} · weight {String(1n << BigInt(selected))} ·{' '}
          {check
            ? `${check.candidate} versus ${check.before}: ${check.state === 'committed' ? 'bit committed as 1' : check.state === 'rejected' ? 'rejected; bit stays 0' : check.state === 'subtracted' ? 'subtracted; quotient write pending' : 'fits; subtraction pending'}`
            : d.overflow
              ? 'Skipped by the overflow return'
              : 'Not evaluated yet'}
        </p>
      </section>
      <section className="studio-section" aria-label="Accepted chunk ledger">
        <h3>Accepted chunks</h3>
        <p>
          Only committed rows contribute to res. Rejected shifts remain visible in the bit
          inspector.
        </p>
        {chunks.length ? (
          <div
            className="study-scroll"
            role="region"
            tabIndex={0}
            aria-label="Scrollable accepted chunks"
          >
            <table className="studio-table division-chunks">
              <caption className="sr-only">Accepted chunk source-write history</caption>
              <thead>
                <tr>
                  <th scope="col">Bit</th>
                  <th scope="col">Chunk subtracted</th>
                  <th scope="col">Remaining after</th>
                  <th scope="col">Quotient weight</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {chunks.map((x) => (
                  <tr key={x.bit}>
                    <th scope="row">{x.bit}</th>
                    <td>{x.candidate}</td>
                    <td>
                      {x.state === 'fits'
                        ? 'Pending'
                        : Number(BigInt(x.before) - BigInt(x.candidate))}
                    </td>
                    <td>{String(1n << BigInt(x.bit))}</td>
                    <td>
                      {x.state === 'committed'
                        ? 'Committed'
                        : x.state === 'subtracted'
                          ? 'Quotient update pending'
                          : 'Subtraction pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            {d.overflow
              ? 'No chunks: overflow returned before the loop.'
              : 'No fitting chunks yet.'}
          </p>
        )}
      </section>
      <section className="studio-section" aria-label="Signed quotient result">
        <h3>Restore the sign, truncate toward zero</h3>
        <p>
          The remaining magnitude is not rounded into another quotient unit. For example, 7 ÷ −3
          returns −2, not −3. A zero result stays 0 even when is_neg is true.
        </p>
        {d.result === null ? (
          <p>Result pending · finish the source loop or take the overflow return.</p>
        ) : (
          <>
            <output className="studio-result" aria-label={`Returned quotient: ${d.result}`}>
              {d.result}
            </output>
            <p>
              {d.overflow
                ? 'INT_MAX clamp: no remainder or quotient magnitude was computed.'
                : `res = ${d.res}; is_neg = ${String(d.isNeg)}; remaining magnitude = ${d.dividend}. The returned sign does not mutate res.`}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
