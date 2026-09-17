import type { CSSProperties } from 'react';
import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import type { MatchstickSide, MatchsticksFrameData } from './adapter';

const sides: MatchstickSide[] = ['left', 'right', 'top', 'down'];
const sideLabels: Record<MatchstickSide, string> = {
  left: 'LEFT',
  right: 'RIGHT',
  top: 'TOP',
  down: 'DOWN',
};
const sideSymbols: Record<MatchstickSide, string> = { left: '←', right: '→', top: '↑', down: '↓' };

function stickLabel(data: MatchsticksFrameData, id: number) {
  const item = data.sorted.find((candidate) => candidate.id === id);
  return item ? `${item.value} · #${id + 1}` : `#${id + 1}`;
}

export function MatchsticksCanvas({ data }: { data: MatchsticksFrameData }) {
  const active = data.currentStick;
  const activeChoice = data.choices.find((choice) => choice.side === data.activeSide);
  const solved = data.result === true || data.action === 'return-success';
  return (
    <div className="matchsticks-visual">
      <StateLegend
        items={[
          { label: 'Current operation', symbol: '◎', color: '#37d9ff' },
          { label: 'Rejected / failed', symbol: '×', color: '#f06cae' },
          { label: 'Structure', symbol: '◇', color: '#9b8cff' },
          { label: 'Solved side', symbol: '◆', color: '#4fd1a1' },
        ]}
      />
      <section className="matchsticks-order" aria-label="Matchstick order">
        <header>
          <span>INPUT → LARGEST-FIRST ORDER</span>
          <small>
            {active ? `active stick ${active.value} · #${active.id + 1}` : 'search complete'}
          </small>
        </header>
        <div className="matchsticks-order-row">
          <div>
            <small>ORIGINAL</small>
            <div>
              {data.original.map((value, index) => (
                <span key={`${index}-${value}`} className={active?.id === index ? 'active' : ''}>
                  {value}
                  <i>#{index + 1}</i>
                </span>
              ))}
            </div>
          </div>
          <b aria-hidden="true">→</b>
          <div>
            <small>SORT + REVERSE</small>
            <div>
              {data.sorted.map((item) => (
                <span
                  key={`${item.id}-${item.value}`}
                  className={active?.id === item.id ? 'active' : ''}
                >
                  {item.value}
                  <i>#{item.id + 1}</i>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="matchsticks-layout">
        <section
          className="matchsticks-square"
          aria-label={`Square side assignment. Target ${data.target}`}
        >
          <header>
            <span>SQUARE CAPACITY WORKBENCH</span>
            <small>target = {data.target} · positive lengths only</small>
          </header>
          <div className="square-plane">
            {sides.map((side) => {
              const sum = data.sideSums[side];
              const activeSide = data.activeSide === side;
              return (
                <div
                  className={`square-side square-${side} ${activeSide ? 'active' : ''} ${solved ? 'solved' : ''}`}
                  key={side}
                >
                  <div className="square-side-title">
                    <b>
                      {sideSymbols[side]} {sideLabels[side]}
                    </b>
                    <strong>
                      {sum} / {data.target}
                    </strong>
                  </div>
                  <div className="square-side-track">
                    <i
                      style={
                        {
                          '--fill': `${data.target ? Math.min(100, (sum / data.target) * 100) : 0}%`,
                        } as CSSProperties
                      }
                    />
                  </div>
                  <div className="square-stick-list">
                    {data.sideSticks[side].length ? (
                      data.sideSticks[side].map((id) => (
                        <span key={id}>{stickLabel(data, id)}</span>
                      ))
                    ) : (
                      <em>empty</em>
                    )}
                  </div>
                  <small>{Math.max(0, data.target - sum)} capacity remaining</small>
                </div>
              );
            })}
            <div className="square-center">
              <span>{active ? `TRY ${active.value}` : 'TRACE COMPLETE'}</span>
              <strong>
                {data.index} / {data.sorted.length}
              </strong>
              <small>
                {data.action === 'resume'
                  ? 'Resume parent state'
                  : data.action === 'prune'
                    ? 'Capacity prune'
                    : data.action === 'return-failure'
                      ? 'All choices failed'
                      : solved
                        ? 'Square closed'
                        : 'Explore a legal side'}
              </small>
            </div>
          </div>
        </section>

        <section className="matchsticks-ledger" aria-label="Side choice ledger">
          <header>
            <span>CHOICE LEDGER</span>
            <small>
              {active
                ? `stick ${active.value} · ${data.activeSide ?? 'checking'}`
                : 'four recursive choices'}
            </small>
          </header>
          <p className="matchsticks-rule">
            <code>side + matchsticks[i] ≤ target</code>
            <span>legal means “explore”, not “commit”</span>
          </p>
          <div className="choice-list">
            {data.choices.map((choice) => (
              <div className={`choice-row choice-${choice.state}`} key={choice.side}>
                <b>
                  {sideSymbols[choice.side]} {sideLabels[choice.side]}
                </b>
                <code>
                  {data.sideSums[choice.side]} + {active?.value ?? '—'} = {choice.candidateSum}
                </code>
                <span>
                  {choice.state === 'pruned'
                    ? 'PRUNED'
                    : choice.state === 'failed'
                      ? 'CHILD FALSE'
                      : choice.state === 'successful'
                        ? 'CHILD TRUE'
                        : choice.state === 'exploring'
                          ? 'EXPLORING'
                          : choice.state === 'checking'
                            ? 'CHECKING'
                            : 'UNTRIED'}
                </span>
              </div>
            ))}
          </div>
          <div
            className={`matchsticks-return-note ${data.action === 'resume' ? 'visible' : ''}`}
            aria-live="polite"
          >
            <strong>
              {data.action === 'resume' ? '↩ Resume parent state' : 'RECURSIVE DECISION'}
            </strong>
            <p>
              {data.action === 'resume'
                ? 'This branch failed. Other choices are still available. The scalar side totals above are unchanged.'
                : activeChoice?.state === 'pruned'
                  ? 'An over-capacity side is impossible because later sticks are positive.'
                  : 'Explore every legal sibling until one succeeds or all fail.'}
            </p>
          </div>
        </section>
      </div>

      <section className="matchsticks-callstack" aria-label="Recursive call stack">
        <header>
          <span>ACTIVE CALL STACK</span>
          <small>
            {data.stack.length
              ? `${data.stack.length} ancestor${data.stack.length === 1 ? '' : 's'} visible`
              : 'returned to entry point'}
          </small>
        </header>
        <div className="callstack-list">
          {data.stack.length ? (
            data.stack.map((call, index) => (
              <div className={`${index === data.stack.length - 1 ? 'current' : ''}`} key={call.id}>
                <span>{index === data.stack.length - 1 ? '●' : '○'}</span>
                <code>
                  backtrack({call.index}, {call.sums.left}, {call.sums.right}, {call.sums.top},{' '}
                  {call.sums.down})
                </code>
                <small>{call.activeSide ? `trying ${call.activeSide}` : 'waiting'}</small>
              </div>
            ))
          ) : (
            <p>All recursive calls have returned.</p>
          )}
        </div>
        <p className="visual-footnote">
          Saved Python is displayed for study only and is never executed. The trace is a bounded,
          code-linked simulation of its scalar recursive states.
        </p>
      </section>
    </div>
  );
}
