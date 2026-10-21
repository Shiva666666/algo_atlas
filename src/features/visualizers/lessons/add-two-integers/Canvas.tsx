import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import {
  StateLegend,
  LessonButton,
  useLessonReducedMotion,
} from '../../../../shared/ui/LessonPrimitives';
import { OperationLedger } from '../../components/StudyPrimitives';
import type { AdditionData } from './types';
import '../../components/styles/counting-studios.css';
import './styles.css';
const word = (value: number) => (value < 0 ? value + 2 ** 32 : value);
const bit = (value: number, index: number) => Math.floor(word(value) / 2 ** index) % 2;
export function Canvas({ data: d, onInteract }: { data: AdditionData; onInteract?: () => void }) {
  const reduced = useLessonReducedMotion();
  const [inspected, setInspected] = useState<number | null>(null),
    scroll = useRef<HTMLDivElement>(null);
  const selected = inspected ?? d.i ?? 0,
    column = d.column,
    committed = d.i !== null && d.written > d.i;
  useEffect(() => {
    const region = scroll.current,
      cell = region?.querySelector<HTMLElement>(`[data-bit="${selected}"]`);
    if (region && cell)
      region.scrollLeft = Math.max(
        0,
        cell.offsetLeft - region.clientWidth / 2 + cell.offsetWidth / 2,
      );
  }, [selected]);
  const show = (value: number | null | undefined) => value ?? '—';
  return (
    <div className="study-workbench counting-studio addition-studio">
      <StateLegend
        items={[
          { label: 'Current operation / bit', symbol: '□', color: '#37d9ff' },
          { label: 'Input / inspected bit', symbol: '◇', color: '#9b8cff' },
          { label: 'Captured carry-in', symbol: '←', color: '#f06cae' },
          { label: 'Committed result bit', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="addition-layout">
        <section aria-label="Full-adder current column">
          <h3>{d.i === null ? 'Prepare the full adder' : `Bit ${d.i} · full adder`}</h3>
          <p>
            One column uses two input bits and the incoming carry. The sum bit is calculated before
            carry is overwritten. — means not yet evaluated in this column.
          </p>
          <dl className="addition-operands">
            <div>
              <dt>Input bit a</dt>
              <dd>{show(column?.a)}</dd>
            </div>
            <div>
              <dt>Input bit b</dt>
              <dd>{show(column?.b)}</dd>
            </div>
            <div className="addition-old-carry">
              <dt>Carry in · captured</dt>
              <dd>{show(column?.carryIn)}</dd>
            </div>
          </dl>
          <div className="addition-flow" aria-hidden="true">
            <ArrowDown size={22} />
            <span>Two separate source assignments</span>
          </div>
          <div className="addition-outputs">
            <motion.div
              initial={false}
              className={committed ? 'addition-committed' : undefined}
              animate={{ backgroundColor: committed ? '#142b21' : '#080b10' }}
              transition={{ duration: reduced ? 0 : 0.16 }}
            >
              <span>sum_bit</span>
              <strong>{show(column?.sumBit)}</strong>
              <code>a XOR b XOR carry_in</code>
              <small>{committed ? 'Written to res' : 'Write pending'}</small>
            </motion.div>
            <div>
              <span>Carry out · next column</span>
              <strong>{show(column?.carryOut)}</strong>
              <code>(a AND b) OR ((a XOR b) AND carry_in)</code>
              <small>
                {column?.carryOut === null || !column
                  ? 'Not evaluated yet'
                  : 'Source carry updated'}
              </small>
            </div>
          </div>
          {d.action === 'sum-bit' && (
            <p className="studio-transfer">
              sum_bit is computed; source carry is still {d.carry}. The next assignment calculates
              carry-out using that same incoming value.
            </p>
          )}
          {column?.carryOut !== null && column && (
            <p className="addition-column-note">
              Captured carry-in {column.carryIn} stays here for comparison. Source carry is now{' '}
              {d.carry}.
            </p>
          )}
        </section>
        <aside className="studio-ledger" aria-label="Addition operation ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              { label: 'Inputs num1 / num2', value: `${d.num1} / ${d.num2}` },
              {
                label: d.result === null ? 'Source i' : 'Last source i',
                value: d.i ?? 'Not assigned',
              },
              { label: 'Bits committed · derived', value: `${d.written} / 32` },
              { label: 'Source carry now', value: d.carry ?? 'Not assigned' },
              { label: 'Unsigned working res', value: d.res ?? 'Not assigned' },
              {
                label: 'Hex working word',
                value:
                  d.res === null
                    ? 'Not assigned'
                    : '0x' + d.res.toString(16).toUpperCase().padStart(8, '0'),
              },
            ]}
          />
          <p>
            The loop always visits all 32 columns—even after small positive inputs have only zero
            bits left.
          </p>
          {d.written === 32 && (
            <p>
              Carry after bit 31: {d.carry}. The loop ends here; this carry is not appended as a
              33rd result bit.
            </p>
          )}
          {d.result !== null && (
            <output className="studio-result" aria-label="Returned sum">
              Returned sum: {d.result}
            </output>
          )}
        </aside>
        <section className="studio-section addition-secondary" aria-label="32-bit addition board">
          <h3>32-bit word map</h3>
          <p>
            Bit 31 is on the left, bit 0 on the right. Processing moves from right to left. Negative
            inputs use their low 32 two’s-complement bits.
          </p>
          <div className="addition-inspect-controls">
            <label>
              Inspect bit
              <select
                aria-label="Inspect bit"
                value={selected}
                onChange={(e) => {
                  onInteract?.();
                  setInspected(Number(e.target.value));
                }}
              >
                {Array.from({ length: 32 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                    {i === 31 ? ' · sign bit' : ''}
                  </option>
                ))}
              </select>
            </label>
            <LessonButton
              className="studio-text-button"
              onClick={() => {
                onInteract?.();
                setInspected(null);
                const region = scroll.current,
                  cell = region?.querySelector<HTMLElement>(`[data-bit="${d.i ?? 0}"]`);
                if (region && cell)
                  region.scrollLeft = Math.max(
                    0,
                    cell.offsetLeft - region.clientWidth / 2 + cell.offsetWidth / 2,
                  );
              }}
            >
              Follow active bit
            </LessonButton>
            <span>Inspection pauses playback; it does not change algorithm state.</span>
          </div>
          <div
            className="study-scroll addition-word-scroll"
            role="region"
            tabIndex={0}
            aria-label="Scrollable 32-bit addition board"
            ref={scroll}
          >
            <table className="studio-table addition-word-table">
              <caption className="sr-only">32-bit source words and working result.</caption>
              <thead>
                <tr>
                  <th scope="col">Source word</th>
                  {Array.from({ length: 32 }, (_, j) => {
                    const b = 31 - j;
                    return (
                      <th
                        scope="col"
                        data-bit={b}
                        key={b}
                        className={
                          b === d.i
                            ? 'addition-active-bit'
                            : b === selected
                              ? 'addition-selected-bit'
                              : ''
                        }
                      >
                        <LessonButton
                          aria-label={`Inspect bit ${b}`}
                          aria-pressed={b === selected}
                          onClick={() => {
                            onInteract?.();
                            setInspected(b);
                          }}
                        >
                          {b}
                        </LessonButton>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: `num1 · ${d.num1}`, value: d.num1 },
                  { label: `num2 · ${d.num2}`, value: d.num2 },
                  { label: 'Working res', value: d.res },
                ].map((row, r) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {Array.from({ length: 32 }, (_, j) => {
                      const b = 31 - j;
                      return (
                        <td
                          key={b}
                          className={[
                            b === d.i ? 'addition-active-bit' : '',
                            r === 2 && b < d.written ? 'addition-written' : '',
                            b === selected ? 'addition-inspected' : '',
                          ].join(' ')}
                        >
                          {row.value === null ? '—' : bit(row.value, b)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="addition-table-guide">
            Green result cells have been written; other result zeros are initialized, not finalized.
          </p>
          <p className="addition-inspection" aria-live="polite">
            Inspected bit {selected} · weight {2 ** selected}: num1 bit {bit(d.num1, selected)},
            num2 bit {bit(d.num2, selected)}; res{' '}
            {d.res === null
              ? 'not initialized'
              : `${bit(d.res, selected)} (${selected < d.written ? 'committed' : 'initialized, not finalized'})`}
            . These are derived diagram annotations.
          </p>
        </section>
        <section
          className="studio-section addition-secondary"
          aria-label="Signed result interpretation"
        >
          <h3>From a working word to a signed answer</h3>
          {d.signSet === null ? (
            <p>
              Wait for all 32 writes. The source has not tested bit 31 or returned an answer yet.
            </p>
          ) : (
            <>
              <p>
                Sign bit 31 is {d.signSet ? 1 : 0}. Working res remains {d.res}; the return
                expression does not modify it.
              </p>
              {d.signSet ? (
                <>
                  <code className="addition-formula">return ~(res ^ 0xFFFFFFFF)</code>
                  {d.complement === null ? (
                    <p>
                      The negative branch is selected; its return expression has not been evaluated
                      yet.
                    </p>
                  ) : (
                    <>
                      <p>
                        Mask-XOR subexpression: {d.res} XOR 0xFFFFFFFF = {d.complement}. Python ~
                        {d.complement} = −{d.complement} − 1 = {d.result}.
                      </p>
                      <p>
                        Equivalent derived interpretation: {d.res} − 2^32 = {d.result}. This
                        equivalence explains the encoding; it is not an extra source statement.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <code className="addition-formula">return res</code>
                  <p>The sign bit is zero; no negative conversion is needed.</p>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
