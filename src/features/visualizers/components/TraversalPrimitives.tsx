import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';

import {
  SmoothTabs,
  StateLegend,
  useLessonReducedMotion,
} from '../../../shared/ui/LessonPrimitives';
import type {
  DiagramState,
  TraversalLessonData,
  WorkbenchCell,
  WorkbenchEdge,
  WorkbenchNode,
} from '../core/traversal';
import type { MistakeCheckpoint as MistakeCheckpointData } from '../core/types';

export type {
  DiagramState,
  TraversalLessonData,
  WorkbenchCell,
  WorkbenchEdge,
  WorkbenchNode,
} from '../core/traversal';

function fallbackPoint(node: WorkbenchNode, index: number, count: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, count);
  const componentOffset = ((node.component ?? 0) % 3) * 12;
  return {
    x: node.x ?? 320 + Math.cos(angle) * (218 - componentOffset),
    y: node.y ?? 175 + Math.sin(angle) * (128 - componentOffset / 2),
  };
}

export function GraphTraversalWorkbench({
  nodes,
  edges,
  label,
}: {
  nodes: WorkbenchNode[];
  edges: WorkbenchEdge[];
  label: string;
}) {
  const markerId = useId().replaceAll(':', '');
  const points = useMemo(
    () => new Map(nodes.map((node, index) => [node.id, fallbackPoint(node, index, nodes.length)])),
    [nodes],
  );
  return (
    <div className="traversal-graph-scroll" role="region" tabIndex={0} aria-label={label}>
      <svg className="traversal-graph" viewBox="0 0 640 350" role="img" aria-label={label}>
        <title>{label}</title>
        <desc>Algorithm graph. Node and edge state is also described by text in the lesson.</desc>
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <g className="traversal-edges">
          {edges.map((edge, index) => {
            const from = points.get(edge.from);
            const to = points.get(edge.to);
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const inset = 25;
            const x1 = from.x + (dx / length) * inset;
            const y1 = from.y + (dy / length) * inset;
            const x2 = to.x - (dx / length) * inset;
            const y2 = to.y - (dy / length) * inset;
            return (
              <g
                className={`state-${edge.state ?? 'idle'}`}
                key={`${edge.from}-${edge.to}-${index}`}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  markerEnd={edge.directed ? `url(#${markerId})` : undefined}
                />
                {edge.weight !== undefined && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}>
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <g className="traversal-nodes">
          {nodes.map((node, index) => {
            const point = points.get(node.id)!;
            return (
              <g
                key={node.id}
                className={`state-${node.state ?? 'idle'}`}
                transform={`translate(${point.x} ${point.y})`}
              >
                <circle r="23" />
                {node.state && node.state !== 'idle' && (
                  <text className="node-state" y="-31">
                    {node.state}
                  </text>
                )}
                <text className="node-main" y="5">
                  {node.label ?? node.id}
                </text>
                {node.detail && (
                  <text className="node-detail" y="43">
                    {node.detail}
                  </text>
                )}
                <title>{`${node.label ?? node.id}${node.detail ? ` — ${node.detail}` : ''}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function GridTraversalBoard({
  cells,
  label,
  rowLabel = 'row',
  columnLabel = 'column',
}: {
  cells: WorkbenchCell[][];
  label: string;
  rowLabel?: string;
  columnLabel?: string;
}) {
  return (
    <div className="traversal-grid-scroll" role="region" tabIndex={0} aria-label={label}>
      <table className="traversal-grid">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">
              {rowLabel[0]} / {columnLabel[0]}
            </th>
            {cells[0]?.map((_, column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{rowIndex}</th>
              {row.map((cell, columnIndex) => (
                <td
                  key={columnIndex}
                  className={`state-${cell.state ?? 'idle'}`}
                  aria-label={`${rowLabel} ${rowIndex}, ${columnLabel} ${columnIndex}: ${cell.value}${cell.note ? `, ${cell.note}` : ''}`}
                >
                  <b>{cell.value}</b>
                  <span>{cell.note ?? ''}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FrontierLedger({
  label,
  kind,
  items,
}: {
  label: string;
  kind: 'queue' | 'stack' | 'min-heap';
  items: Array<{ id: string; primary: string; secondary?: string; state?: DiagramState }>;
}) {
  return (
    <section className="frontier-ledger" aria-label={label}>
      <header>
        <h3>{label}</h3>
        <span>
          {kind} · {items.length}
        </span>
      </header>
      {items.length ? (
        <ol>
          {items.map((item) => (
            <li key={item.id} className={`state-${item.state ?? 'idle'}`}>
              <b>{item.primary}</b>
              {item.secondary && <span>{item.secondary}</span>}
            </li>
          ))}
        </ol>
      ) : (
        <p>Empty</p>
      )}
    </section>
  );
}

export function DistanceMatrix({
  values,
  label,
  active,
}: {
  values: Array<Array<number | null>>;
  label: string;
  active?: Array<[number, number]>;
}) {
  const highlighted = new Set((active ?? []).map(([row, column]) => `${row},${column}`));
  return (
    <div className="distance-matrix-scroll" role="region" tabIndex={0} aria-label={label}>
      <table className="distance-matrix">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">from / to</th>
            {values.map((_, column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {values.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{rowIndex}</th>
              {row.map((value, columnIndex) => (
                <td
                  className={highlighted.has(`${rowIndex},${columnIndex}`) ? 'active' : ''}
                  key={columnIndex}
                >
                  {value === null ? '∞' : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MistakeCheckpoint({ checkpoint }: { checkpoint: MistakeCheckpointData }) {
  const reduced = useLessonReducedMotion();
  return (
    <motion.aside
      className={`mistake-checkpoint ${checkpoint.tone ?? 'mistake'}`}
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.18 }}
      aria-label={checkpoint.title}
    >
      <h3>{checkpoint.title}</h3>
      <dl>
        <div>
          <dt>Your version</dt>
          <dd>
            <code>{checkpoint.submitted}</code>
          </dd>
        </div>
        <div>
          <dt>Invariant</dt>
          <dd>{checkpoint.invariant}</dd>
        </div>
        <div>
          <dt>Correction</dt>
          <dd>
            <code>{checkpoint.correction}</code>
          </dd>
        </div>
      </dl>
    </motion.aside>
  );
}

export interface StructuredField {
  key: string;
  label: string;
  help: string;
  rows?: number;
}

export function TraversalLessonCanvas({ data }: { data: TraversalLessonData }) {
  return (
    <div className="traversal-studio">
      <header>
        <div>
          <h2>{data.heading}</h2>
          <p>{data.summary}</p>
        </div>
      </header>
      <StateLegend items={data.legend} />
      <div className="traversal-layout">
        <section className="traversal-panel" aria-label="Algorithm diagram">
          {data.graph && <GraphTraversalWorkbench {...data.graph} />}
          {data.grid && <GridTraversalBoard {...data.grid} />}
          {data.matrix && <DistanceMatrix {...data.matrix} />}
        </section>
        <aside className="traversal-side">
          {data.frontier && <FrontierLedger {...data.frontier} />}
          <section className="traversal-panel" aria-label="Current algorithm state">
            <header>
              <h3>Current operation</h3>
              <span>{data.equation ?? 'state snapshot'}</span>
            </header>
            <dl className="metric-ledger">
              {data.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {data.results && (
            <section className="frontier-ledger" aria-label="Completed results">
              <header>
                <h3>Completed results</h3>
                <span>{data.results.length}</span>
              </header>
              {data.results.length ? (
                <ol>
                  {data.results.map((result, index) => (
                    <li
                      key={`${result.label}-${index}`}
                      className={`state-${result.state ?? 'idle'}`}
                    >
                      <b>{result.label}</b>
                      <span>{result.value}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Nothing recorded yet.</p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export function StructuredTraversalInputEditor({
  raw,
  onChange,
  fields,
  label,
}: {
  raw: string;
  onChange: (raw: string) => void;
  fields: StructuredField[];
  label: string;
}) {
  const id = useId();
  const [tab, setTab] = useState('builder');
  let value: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed;
  } catch {
    value = null;
  }
  const update = (key: string, next: string) => {
    if (!value) return;
    try {
      onChange(JSON.stringify({ ...value, [key]: JSON.parse(next) }));
    } catch {
      // Keep invalid fragments in the full JSON editor; builder changes apply only when valid.
    }
  };
  return (
    <div className="structured-traversal-input">
      <SmoothTabs
        id={id}
        value={tab}
        onChange={setTab}
        label={`${label} input mode`}
        items={[
          { id: 'builder', label: 'Fields' },
          { id: 'json', label: 'JSON' },
        ]}
      />
      <div
        role="tabpanel"
        id={`${id}-builder-panel`}
        aria-labelledby={`${id}-builder`}
        hidden={tab !== 'builder'}
      >
        {value ? (
          fields.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <textarea
                rows={field.rows ?? 2}
                value={JSON.stringify(value?.[field.key] ?? '')}
                onChange={(event) => update(field.key, event.target.value)}
                spellCheck={false}
              />
              <small>{field.help}</small>
            </label>
          ))
        ) : (
          <p>Repair the JSON input to use the structured fields.</p>
        )}
      </div>
      <div
        role="tabpanel"
        id={`${id}-json-panel`}
        aria-labelledby={`${id}-json`}
        hidden={tab !== 'json'}
      >
        <label>
          <span>{label} JSON</span>
          <textarea
            rows={5}
            value={raw}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
