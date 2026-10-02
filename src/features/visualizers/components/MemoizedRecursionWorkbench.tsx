import { SequenceStrip, OperationLedger } from './StudyPrimitives';
import { FrontierLedger } from './TraversalPrimitives';
import type { MemoCallSnapshot } from '../core/memoized-recursion-types';

/** Render supplied snapshots only. null means pending/unknown, not an algorithmic zero. */
export function MemoizedRecursionWorkbench({
  calls,
  memo,
  equation,
  result,
  argumentLabel,
  children,
}: {
  calls: MemoCallSnapshot[];
  memo: Array<number | null>;
  equation: string;
  result: number | null;
  argumentLabel: string;
  children?: React.ReactNode;
}) {
  const current = calls.at(-1);
  return (
    <>
      <div className="study-layout">
        <section>
          <h3>Memo indexed by {argumentLabel.toLowerCase()}</h3>
          <SequenceStrip
            label="Memo states"
            cells={memo.map((value, index) => ({
              value: value ?? '?',
              note:
                value !== null
                  ? 'stored'
                  : calls.some((c) => c.argument === index)
                    ? 'pending'
                    : 'unknown',
              state:
                value !== null
                  ? 'stored'
                  : calls.some((c) => c.argument === index)
                    ? 'pending'
                    : 'idle',
            }))}
            pointer={
              current && current.argument < memo.length
                ? { index: current.argument, label: 'active' }
                : null
            }
          />
          {children}
        </section>
        <aside className="memo-call-state">
          <div
            className="memo-call-scroll"
            role="region"
            tabIndex={0}
            aria-label="Scrollable call ancestry"
          >
            <FrontierLedger
              label="Call ancestry · active call last"
              kind="stack"
              items={calls.map((call, index) => ({
                id: String(call.id),
                primary: `#${call.id} · topdown(${call.argument})`,
                secondary: index === calls.length - 1 ? 'active' : 'waiting for child',
                state: index === calls.length - 1 ? 'active' : 'frontier',
              }))}
            />
          </div>
          <OperationLedger
            equation={equation}
            metrics={[
              { label: argumentLabel, value: current?.argument ?? 'No active call' },
              {
                label: 'Local val',
                value: current ? (current.best ?? '∞ / not initialized') : '—',
              },
              { label: 'Returned answer', value: result ?? 'Pending' },
            ]}
          >
            {current?.children.length ? (
              <ul className="memo-branches" aria-label="Child return slots">
                {current.children.map((child, index) => (
                  <li key={index}>
                    <span>
                      {child.label} → {child.target}
                    </span>
                    <b>{child.result ?? 'Pending'}</b>
                  </li>
                ))}
              </ul>
            ) : null}
          </OperationLedger>
        </aside>
      </div>
    </>
  );
}
