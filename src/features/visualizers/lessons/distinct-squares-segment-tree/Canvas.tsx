import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  SmoothTabs,
  StateLegend,
  useLessonReducedMotion,
} from '../../../../shared/ui/LessonPrimitives';
import { OperationLedger, SequenceStrip } from '../../components/StudyPrimitives';
import { FrontierLedger } from '../../components/TraversalPrimitives';
import type { SquaresData } from './types';
import '../../components/styles/counting-studios.css';
import './styles.css';

function TreePlane({
  d,
  inspect,
  selected,
  visible,
  focusIndex,
}: {
  d: SquaresData;
  inspect: (i: number) => void;
  selected: number;
  visible: boolean;
  focusIndex: number;
}) {
  const region = useRef<HTMLDivElement>(null);
  const width = Math.max(650, d.nums.length * 112);
  const levels = Math.ceil(Math.log2(d.nums.length));
  const point = (l: number, r: number, i: number) => ({
    x: ((l + r + 1) * width) / (2 * d.nums.length),
    y: 54 + Math.floor(Math.log2(i + 1)) * 110,
  });
  const ancestry = new Set(d.calls.map((call) => call.i));
  useEffect(() => {
    const scroll = region.current;
    const node = d.nodes.find((n) => n.i === focusIndex);
    if (!visible || !scroll || !node) return;
    const center = ((node.l + node.r + 1) * width) / (2 * d.nums.length);
    scroll.scrollLeft = Math.max(0, center - scroll.clientWidth / 2);
  }, [focusIndex, visible, width, d.nums.length, d.nodes]);
  return (
    <div
      ref={region}
      className="study-scroll"
      role="region"
      tabIndex={0}
      aria-label="Scrollable lazy segment tree"
    >
      <svg
        className="squares-tree"
        width={width}
        height={levels * 110 + 105}
        role="group"
        aria-label="Stored lazy segment tree"
      >
        <title>Actual source indexes, intervals and stored aggregates</title>
        {d.nodes
          .filter((node) => node.i !== 0)
          .map((node) => {
            const parent = d.nodes.find((p) => p.i === Math.floor((node.i - 1) / 2))!;
            const a = point(parent.l, parent.r, parent.i),
              b = point(node.l, node.r, node.i);
            const transfer = d.transfer?.parent === parent.i && d.transfer.child === node.i;
            return (
              <motion.line
                key={`edge-${node.i}`}
                x1={a.x}
                y1={a.y + 38}
                x2={b.x}
                y2={b.y - 38}
                stroke={transfer ? '#37d9ff' : ancestry.has(node.i) ? '#9b8cff' : '#495465'}
                strokeWidth={transfer ? 3 : 1.5}
              />
            );
          })}
        {d.nodes.map((node) => {
          const p = point(node.l, node.r, node.i);
          return (
            <g
              key={node.i}
              transform={`translate(${p.x} ${p.y})`}
              role="button"
              tabIndex={0}
              aria-label={`Inspect node ${node.i}, interval ${node.l} to ${node.r}, sum ${d.sum[node.i] ?? 'pending'}, squared sum ${d.square[node.i] ?? 'pending'}, lazy ${d.lazy[node.i] ?? 'pending'}`}
              aria-pressed={selected === node.i}
              className={`tree-node ${node.i === d.active ? 'current' : ''} ${d.lazy[node.i] ? 'deferred' : ''} ${node.i === selected ? 'inspected' : ''}`}
              onClick={() => inspect(node.i)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  inspect(node.i);
                }
              }}
            >
              <rect x={-48} y={-38} width={96} height={76} rx={6} />
              <text textAnchor="middle" y={-21}>
                #{node.i} · [{node.l},{node.r}]
              </text>
              <text textAnchor="middle" y={0}>
                S {d.sum[node.i] ?? '—'} · Q {d.square[node.i] ?? '—'}
              </text>
              <text className="tree-tag" textAnchor="middle" y={23}>
                lazy {d.lazy[node.i] ?? '—'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Canvas({ data: d, onInteract }: { data: SquaresData; onInteract?: () => void }) {
  const [view, setView] = useState('counts');
  const [inspected, setInspected] = useState<number | null>(null);
  const reduced = useLessonReducedMotion();
  const selected = d.nodes.find((n) => n.i === (inspected ?? d.active)) ?? d.nodes[0];
  const sealed = d.right >= 0 && d.committedRight === d.right;
  const op = d.operation;
  return (
    <div className="study-workbench counting-studio squares-studio">
      <StateLegend
        items={[
          { label: 'Current / update range', symbol: '□', color: '#37d9ff' },
          { label: 'Tree structure', symbol: '◇', color: '#9b8cff' },
          { label: 'Deferred tag', symbol: '+', color: '#f06cae' },
          { label: 'Sealed contribution', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <SequenceStrip
        label="Input values and right endpoint"
        cells={d.nums.map((value, i) => ({
          value,
          note:
            i === d.right
              ? d.num === null
                ? 'reading'
                : 'current'
              : i === d.prev
                ? 'previous occurrence'
                : i < d.right
                  ? 'read'
                  : 'unread',
          state: i === d.right ? 'active' : i === d.prev ? 'dependency' : 'idle',
        }))}
        pointer={d.right >= 0 ? { index: d.right, label: 'right' } : null}
        ranges={
          d.range
            ? [{ start: d.range[0], end: d.range[1], label: 'Starts gaining one distinct value' }]
            : []
        }
      />
      <SmoothTabs
        id="squares-views"
        label="Distinct squares linked views"
        value={view}
        onChange={(value) => {
          onInteract?.();
          setView(value);
        }}
        items={[
          { id: 'counts', label: 'Subarray Counts' },
          { id: 'tree', label: 'Lazy Tree State' },
        ]}
      />
      <div className="study-layout">
        <section>
          <div
            role="tabpanel"
            id="squares-views-counts-panel"
            aria-labelledby="squares-views-counts"
            hidden={view !== 'counts'}
          >
            <h3>
              {d.committedRight < 0
                ? 'No endpoint sealed yet'
                : `Counts sealed at right = ${d.committedRight}`}
            </h3>
            <p>
              Each start l represents one subarray ending at the last completed endpoint. These are
              derived teaching counts, not an eagerly expanded tree.
            </p>
            <SequenceStrip
              label="Committed distinct counts by start"
              cells={d.committed.map((value, i) => ({
                value: i <= d.committedRight ? value : '—',
                note: i <= d.committedRight ? `${value}² = ${value * value}` : 'inactive start',
                state: i <= d.committedRight ? 'stored' : 'idle',
              }))}
            />
            {d.preview && (
              <section className="studio-pending" aria-label="Pending range increment preview">
                <h3>Pending +1 preview · not committed</h3>
                <p>
                  {d.updating ? 'The tree update is in progress.' : 'The update has not run yet.'}{' '}
                  Only starts in [{d.range?.join(', ')}] gain one distinct value.
                </p>
                <SequenceStrip
                  label="Expected counts after this update"
                  cells={d.preview.map((value, i) => ({
                    value: i <= d.right ? value : '—',
                    note: i > d.right ? 'inactive' : i >= d.range![0] ? '+1 pending' : 'unchanged',
                    state: i <= d.right && i >= d.range![0] ? 'pending' : 'idle',
                  }))}
                />
              </section>
            )}
            <section className="studio-section" aria-label="Endpoint contribution history">
              <h3>One contribution per right endpoint</h3>
              <div
                className="study-scroll"
                tabIndex={0}
                role="region"
                aria-label="Scrollable endpoint contributions"
              >
                <table className="studio-table">
                  <caption>Root Q is added only after the complete range update returns.</caption>
                  <thead>
                    <tr>
                      <th scope="col">right</th>
                      <th scope="col">Root Q</th>
                      <th scope="col">res after modulo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.contributions.map((entry) => (
                      <tr key={entry.right}>
                        <th scope="row">{entry.right}</th>
                        <td>{entry.value}</td>
                        <td>{entry.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!d.contributions.length && <p>No contribution accumulated yet.</p>}
              </div>
            </section>
          </div>
          <div
            role="tabpanel"
            id="squares-views-tree-panel"
            aria-labelledby="squares-views-tree"
            hidden={view !== 'tree'}
          >
            <h3>Stored aggregates · deferred children stay deferred</h3>
            <p>
              S = sum_tree, Q = sq_tree. A parent with a lazy tag can differ from its children.
              Click or keyboard-select a node to inspect it.
            </p>
            <TreePlane
              d={d}
              visible={view === 'tree'}
              focusIndex={inspected ?? d.transfer?.child ?? d.active ?? 0}
              selected={selected.i}
              inspect={(i) => {
                onInteract?.();
                setInspected(i);
              }}
            />
            <div className="studio-node-detail" aria-label="Selected source node">
              <h3>
                Source node {selected.i} · [{selected.l}, {selected.r}]
              </h3>
              <dl className="studio-inline-values">
                <div>
                  <dt>Stored S</dt>
                  <dd>{d.sum[selected.i] ?? 'Pending'}</dd>
                </div>
                <div>
                  <dt>Stored Q</dt>
                  <dd>{d.square[selected.i] ?? 'Pending'}</dd>
                </div>
                <div>
                  <dt>Lazy tag</dt>
                  <dd>{d.lazy[selected.i] ?? 'Pending'}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="studio-text-button"
                onClick={() => {
                  onInteract?.();
                  setInspected(null);
                }}
              >
                Follow active node
              </button>
            </div>
            {d.transfer && (
              <motion.div
                className="studio-transfer"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
                aria-label="Lazy tag transfer"
              >
                <strong>
                  Transfer +{d.transfer.val} ·{' '}
                  {d.transfer.child === null
                    ? d.action === 'push-complete'
                      ? 'complete'
                      : 'starting'
                    : `node ${d.transfer.parent} → child ${d.transfer.child}`}
                </strong>
                <p>
                  {d.action === 'push-complete'
                    ? 'Both children include the tag; the parent is now clear.'
                    : 'In progress: do not add the parent tag to child values again. It clears after both child applications.'}
                </p>
              </motion.div>
            )}
            <FrontierLedger
              label="Active helper calls"
              kind="stack"
              items={d.calls.map((call, i) => ({
                id: String(call.id),
                primary: `${call.fn}(#${call.i}, [${call.l},${call.r}], +${call.val})`,
                secondary: i === d.calls.length - 1 ? 'Current helper' : 'Waiting for child',
                state: i === d.calls.length - 1 ? 'active' : 'frontier',
              }))}
            />
          </div>
        </section>
        <aside className="studio-ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              {
                label: 'Overlap check',
                value:
                  d.calls.at(-1)?.fn === 'update' ? (d.coverage ?? 'Pending') : 'Not evaluating',
              },
              {
                label: 'right / current value',
                value: d.right < 0 ? 'Pending' : `${d.right} / ${d.num ?? 'unread'}`,
              },
              { label: 'Previous occurrence', value: d.prev ?? 'Not looked up' },
              { label: 'Sealed endpoint Q', value: sealed ? d.square[0] : 'Pending update' },
              { label: 'Accumulated res', value: d.res },
            ]}
          />
          <section className="studio-section" aria-label="Square update identity">
            <h3>Square update uses old S</h3>
            <code className="studio-formula">Q′ = Q + 2vS + Lv²</code>
            <code className="studio-formula">S′ = S + Lv</code>
            {op && d.action.startsWith('apply-') ? (
              <dl className="studio-formula-values">
                <div>
                  <dt>Node / length L</dt>
                  <dd>
                    {op.i} / {op.length}
                  </dd>
                </div>
                <div>
                  <dt>Old S / old Q</dt>
                  <dd>
                    {op.oldSum} / {op.oldSquare}
                  </dd>
                </div>
                <div>
                  <dt>Addition v</dt>
                  <dd>{op.val}</dd>
                </div>
                <div>
                  <dt>Current stored S / Q</dt>
                  <dd>
                    {d.sum[op.i]} / {d.square[op.i]}
                  </dd>
                </div>
              </dl>
            ) : (
              <p>Update Q before changing S. A pushed tag can be larger than one.</p>
            )}
          </section>
          <section className="studio-section" aria-label="Last occurrence map">
            <h3>last · previous indexes</h3>
            {Object.keys(d.last).length ? (
              <dl className="studio-formula-values">
                {Object.entries(d.last).map(([value, index]) => (
                  <div key={value}>
                    <dt>{value}</dt>
                    <dd>{index}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Empty · unseen values use −1.</p>
            )}
          </section>
        </aside>
      </div>
      {d.result !== null && (
        <output className="studio-result" aria-label="Returned sum of squared distinct counts">
          Returned answer: {d.result}
        </output>
      )}
    </div>
  );
}
