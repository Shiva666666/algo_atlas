import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  StateLegend,
  LessonButton,
  useLessonReducedMotion,
} from '../../../../shared/ui/LessonPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import { permutationCycles } from './annotations';
import type { DigitSumSwapData } from './types';
import '../../components/styles/counting-studios.css';
import './styles.css';

export function Canvas({
  data: d,
  onInteract,
}: {
  data: DigitSumSwapData;
  onInteract?: () => void;
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const reduced = useLessonReducedMotion();
  const arrow = useId();
  const inputIdentity = d.original.join(',');
  useEffect(() => {
    setSelection(null);
    setProofOpen(false);
  }, [inputIdentity]);
  const phase =
    d.helper || d.action === 'sort-start'
      ? 'Digit sums'
      : d.pos === null
        ? 'Target order'
        : d.count === null
          ? 'Position map'
          : d.result === null
            ? 'Fix positions'
            : 'Result';
  const activeIndex = d.result !== null ? null : (d.helper?.inputIndex ?? d.i);
  const selected =
    (selection !== null && d.original.includes(selection) ? selection : null) ??
    d.helper?.value ??
    (d.i === null ? d.original[0] : d.nums[d.i]);
  const selectedOriginal = d.original.indexOf(selected);
  const selectedIndex = d.nums.indexOf(selected);
  const selectedKey = d.keys[selectedOriginal];
  const keyFor = (value: number) => d.keys[d.original.indexOf(value)];
  const inspect = (value: number) => {
    onInteract?.();
    setSelection(value);
  };
  const panTo = (index: number) => {
    const el = region.current;
    if (!el) return;
    const left = index * 172;
    if (left < el.scrollLeft + 8) el.scrollLeft = Math.max(0, left - 8);
    else if (left + 160 > el.scrollLeft + el.clientWidth - 8)
      el.scrollLeft = left + 168 - el.clientWidth;
  };
  useEffect(() => {
    if (activeIndex !== null) panTo(activeIndex);
  }, [activeIndex, inputIdentity]);
  const width = d.nums.length * 172 - 12;
  const gridStyle = { gridTemplateColumns: `repeat(${d.nums.length}, 160px)` };
  const prepared = d.swap?.stage === 'prepared-one' || d.swap?.stage === 'prepared-both';
  const cycles = d.target ? permutationCycles(d.original, d.target) : [];
  const minimum = cycles.reduce((sum, cycle) => sum + cycle.length - 1, 0);
  const metric = (value: number | null | undefined) => value ?? 'Not assigned';
  return (
    <div className="study-workbench counting-studio ds-studio">
      <StateLegend
        items={[
          { label: 'Active / prepared swap', symbol: '↔', color: '#37d9ff' },
          { label: 'Target relationship', symbol: '◇', color: '#9b8cff' },
          { label: 'Displaced value', symbol: '≠', color: '#f06cae' },
          { label: 'Confirmed prefix', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <ol className="ds-phases" aria-label="Algorithm progress">
        {['Digit sums', 'Target order', 'Position map', 'Fix positions', 'Result'].map((label) => (
          <li key={label} aria-current={phase === label ? 'step' : undefined}>
            {label}
          </li>
        ))}
      </ol>
      <div className="study-layout">
        <div className="ds-main">
          <section aria-label="Aligned working and target arrays">
            <h3>Working array → target order</h3>
            <p>Keys are (digit sum, numeric value). Index columns stay aligned as values move.</p>
            <div
              className="ds-scroll"
              ref={region}
              role="region"
              tabIndex={0}
              aria-label="Scrollable working and target arrays"
            >
              <div className="ds-aligned" style={{ width }}>
                <ol className="ds-index-row" style={gridStyle} aria-label="Array indexes">
                  {d.nums.map((_, i) => (
                    <li key={i}>
                      Index {i}
                      {activeIndex === i ? ' · current' : ''}
                    </li>
                  ))}
                </ol>
                <ol className="ds-value-row" style={gridStyle} aria-label="Working nums">
                  {d.nums.map((value, i) => {
                    const current = activeIndex === i || d.swap?.j === i;
                    const confirmed = i < d.confirmed;
                    const matches = d.target?.[i] === value;
                    const state =
                      current && d.result === null
                        ? 'current'
                        : confirmed
                          ? 'confirmed'
                          : d.target && !matches
                            ? 'displaced'
                            : 'idle';
                    return (
                      <motion.li
                        key={value}
                        layout={reduced ? false : 'position'}
                        transition={{ duration: reduced ? 0 : 0.22 }}
                      >
                        <button
                          type="button"
                          className={`ds-value ds-${state}`}
                          aria-label={`Inspect working value ${value} at index ${i}`}
                          aria-pressed={selection === value}
                          onClick={() => inspect(value)}
                        >
                          <strong>{value}</strong>
                          <span>
                            {keyFor(value) === null
                              ? 'Key not computed'
                              : `Key (${keyFor(value)}, ${value})`}
                          </span>
                          <span>
                            {confirmed
                              ? 'Confirmed'
                              : current
                                ? d.helper
                                  ? 'Read digit key'
                                  : i === d.i
                                    ? 'Current · i'
                                    : 'Partner · j'
                                : matches
                                  ? 'Matches · not processed'
                                  : d.target
                                    ? 'Displaced'
                                    : 'Original value'}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ol>
                {d.swap ? (
                  <svg
                    className="ds-connection"
                    width={width}
                    height={54}
                    role="img"
                    aria-label={`Swap connection between positions ${d.swap.i} and ${d.swap.j}`}
                  >
                    <defs>
                      <marker
                        id={arrow}
                        viewBox="0 0 8 8"
                        markerWidth="6"
                        markerHeight="6"
                        refX="7"
                        refY="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
                      </marker>
                    </defs>
                    <path
                      d={`M ${d.swap.i * 172 + 80} 6 Q ${(d.swap.i + d.swap.j) * 86 + 80} 78 ${d.swap.j * 172 + 80} 6`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      markerStart={`url(#${arrow})`}
                      markerEnd={`url(#${arrow})`}
                    />
                  </svg>
                ) : (
                  <div className="ds-connection-empty">
                    {d.target
                      ? d.result !== null
                        ? 'Target reached. No active swap remains.'
                        : 'Compare each position with the target below.'
                      : 'Complete every key before establishing the target.'}
                  </div>
                )}
                {d.target ? (
                  <ol
                    className="ds-value-row ds-target-row"
                    style={gridStyle}
                    aria-label="Target sorted_nums"
                  >
                    {d.target.map((value, i) => (
                      <li key={value}>
                        <button
                          type="button"
                          className={`ds-value ${i < d.confirmed ? 'ds-confirmed' : 'ds-target'}`}
                          aria-label={`Inspect target value ${value} at index ${i}`}
                          aria-pressed={selection === value}
                          onClick={() => inspect(value)}
                        >
                          <strong>{value}</strong>
                          <span>
                            Key ({keyFor(value)}, {value})
                          </span>
                          <span>Target index {i}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="ds-target-pending">sorted_nums · not assigned</p>
                )}
              </div>
            </div>
            {d.swap && (
              <div className="ds-pair-summary" aria-label="Active exchange">
                <p>
                  Positions{' '}
                  <code>
                    {d.swap.i} ↔ {d.swap.j}
                  </code>{' '}
                  · required <code>{d.swap.required}</code> · displaced{' '}
                  <code>{d.swap.displaced}</code>
                </p>
                <div>
                  <LessonButton
                    className="studio-text-button"
                    onClick={() => {
                      onInteract?.();
                      panTo(d.swap!.i);
                    }}
                  >
                    Show position {d.swap.i}
                  </LessonButton>
                  <LessonButton
                    className="studio-text-button"
                    onClick={() => {
                      onInteract?.();
                      panTo(d.swap!.j);
                    }}
                  >
                    Show position {d.swap.j}
                  </LessonButton>
                </div>
              </div>
            )}
            <p className="ds-prefix">
              Confirmed prefix: {d.confirmed === 0 ? 'empty' : `[0, ${d.confirmed - 1}]`} ·{' '}
              {d.confirmed}/{d.nums.length} positions. This is derived progress, not a source
              variable.
            </p>
          </section>
        </div>
        <aside className="studio-ledger" aria-label="Swap and digit inspector">
          <OperationLedger
            equation={d.equation}
            metrics={[
              {
                label: d.result !== null ? 'Last array index · i' : 'Current array index · i',
                value: metric(d.i),
              },
              { label: d.swap ? 'Lookup position · j' : 'Last assigned j', value: metric(d.j) },
              { label: 'Source count', value: metric(d.count) },
              { label: 'Executed exchanges', value: d.history.length },
            ]}
          />
          {prepared && (
            <p className="ds-pending">
              {d.swap!.writes.length}/2 map writes prepared. nums is still unchanged.
            </p>
          )}
          {d.swap?.stage === 'swapped' && (
            <p className="ds-pending">
              Swap completed; count update next. Source count is still {d.count}.
            </p>
          )}
          {d.helper && (
            <section
              className="studio-section ds-digit-helper"
              aria-label="Active digit-sum helper"
            >
              <h3>add_digits({d.helper.value})</h3>
              <p>Input index {d.helper.inputIndex} · helper-local i, not the outer array index.</p>
              <dl className="studio-formula-values">
                <div>
                  <dt>Remaining number · i</dt>
                  <dd>{d.helper.remaining}</dd>
                </div>
                <div>
                  <dt>Extracted digit · derived</dt>
                  <dd>{d.helper.digit ?? 'Not evaluated'}</dd>
                </div>
                <div>
                  <dt>Running total</dt>
                  <dd>{d.helper.total}</dd>
                </div>
              </dl>
              <p>
                Rightmost digit first: <code>total += i % 10</code>, then <code>i //= 10</code>.
              </p>
            </section>
          )}
          <section className="studio-section" aria-label="Selected value inspector">
            <h3>Inspect value {selected}</h3>
            <p>
              Inspection is a derived annotation. Click another value or map entry; the trace stays
              at this frame.
            </p>
            <dl className="studio-formula-values">
              <div>
                <dt>Original index</dt>
                <dd>{selectedOriginal}</dd>
              </div>
              <div>
                <dt>Current array index</dt>
                <dd>{selectedIndex}</dd>
              </div>
              <div>
                <dt>Computed digit sum</dt>
                <dd>{selectedKey ?? 'Not computed'}</dd>
              </div>
              <div>
                <dt>Numeric tie-break</dt>
                <dd>{selected}</dd>
              </div>
              <div>
                <dt>Target index</dt>
                <dd>{d.target ? d.target.indexOf(selected) : 'Not assigned'}</dd>
              </div>
              <div>
                <dt>Stored pos[value]</dt>
                <dd>{d.pos?.[selected] ?? 'Not recorded'}</dd>
              </div>
            </dl>
            <LessonButton
              className="studio-text-button"
              onClick={() => {
                onInteract?.();
                panTo(selectedIndex);
              }}
            >
              Show selected position
            </LessonButton>
          </section>
          <p>
            A matching digit sum is not a tie in identity: smaller numeric values come first. All
            input values must be distinct.
          </p>
          {d.result !== null && (
            <output className="studio-result" aria-label="Returned minimum swaps">
              Returned minimum swaps: {d.result}
            </output>
          )}
        </aside>
        <div className="ds-secondary">
          <section className="studio-section" aria-label="Position-map updates">
            <h3>Position map · pos[value]</h3>
            <p>
              {d.pos === null
                ? 'Not initialized yet.'
                : d.count === null
                  ? 'Building entries in input order. Missing entries are not zero.'
                  : prepared
                    ? 'Position updates prepared; swap pending. Stored indexes describe the upcoming exchange, not the current array.'
                    : 'At completed swap boundaries, every stored index matches nums.'}
            </p>
            {d.swap && (
              <ol className="ds-map-writes" aria-label="Individual map writes">
                {[d.swap.displaced, d.swap.required].map((value, index) => {
                  const write = d.swap!.writes[index];
                  return (
                    <li key={value} className={write ? 'ds-write-done' : ''}>
                      <code>pos[{value}]</code>
                      <span>
                        {write
                          ? `${write.before} → ${write.after} · ${prepared ? 'prepared' : 'written'}`
                          : 'Not written yet'}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            <div
              className="study-scroll ds-map-scroll"
              role="region"
              tabIndex={0}
              aria-label="Scrollable position map"
            >
              <table className="studio-table">
                <caption>Select a value to inspect; selection does not advance the trace.</caption>
                <thead>
                  <tr>
                    <th scope="col">Value</th>
                    <th scope="col">Stored pos</th>
                    <th scope="col">Actual index</th>
                  </tr>
                </thead>
                <tbody>
                  {d.original.map((value) => (
                    <tr
                      key={value}
                      className={
                        d.swap?.writes.some((w) => w.value === value) ? 'ds-map-prepared' : ''
                      }
                    >
                      <th scope="row">
                        <button
                          className="ds-map-button"
                          type="button"
                          aria-pressed={selection === value}
                          aria-label={`Inspect map value ${value}`}
                          onClick={() => inspect(value)}
                        >
                          {value}
                        </button>
                      </th>
                      <td>{d.pos?.[value] ?? 'Not recorded'}</td>
                      <td>{d.nums.indexOf(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="studio-section" aria-label="Completed exchange history">
            <h3>Swap history</h3>
            {d.history.length === 0 ? (
              <p>No swaps executed.</p>
            ) : (
              <ol className="ds-history">
                {d.history.map((swap, i) => (
                  <li key={i}>
                    <code>
                      {swap.i} ↔ {swap.j}
                    </code>
                    <span>
                      {swap.displaced} ↔ {swap.required}
                    </span>
                    <span>{i < (d.count ?? 0) ? 'Counted' : 'Executed · count update next'}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <details
            className="ds-details"
            open={proofOpen}
            onToggle={(event) => {
              const open = event.currentTarget.open;
              if (open !== proofOpen) {
                setProofOpen(open);
                onInteract?.();
              }
            }}
          >
            <summary>Why is this minimum?</summary>
            <p>
              Derived explanation, not another algorithm in your Python. Follow each original index
              to its value’s target index.
            </p>
            {!d.target ? (
              <p>Available after the target order is established.</p>
            ) : (
              <>
                <ul className="ds-cycles">
                  {cycles.map((cycle, i) => (
                    <li key={cycle[0]}>
                      <code>{[...cycle, cycle[0]].join(' → ')}</code>
                      <span>
                        {cycle.length === 1
                          ? 'Already placed · 0 swaps'
                          : `Length ${cycle.length} · ${cycle.length - 1} ${cycle.length === 2 ? 'swap' : 'swaps'}`}
                      </span>
                      <span>Cycle {i + 1}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Each length-L cycle needs at least L − 1 arbitrary-position swaps. Each source
                  swap fixes the current index and splits that cycle, achieving the bound.
                </p>
                <strong className="ds-proof-total">
                  Minimum required: {minimum} swaps
                  {d.result === null ? ' · derived lower bound' : ` · returned count ${d.result}`}
                </strong>
              </>
            )}
          </details>
          <details className="ds-details" onToggle={() => onInteract?.()}>
            <summary>Original input · unchanged reference</summary>
            <SequenceStrip
              label="Original input values"
              cells={d.original.map((value, i) => ({ value, note: `Original index ${i}` }))}
            />
          </details>
        </div>
      </div>
    </div>
  );
}
