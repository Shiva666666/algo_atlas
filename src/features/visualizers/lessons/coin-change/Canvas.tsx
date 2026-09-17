import { useEffect, useRef } from 'react';

import type { CoinChangeData } from './adapter';

import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  red = '#ff6b7a',
  green = '#4fd1a1',
  muted = '#a9b4c2';

export function CoinChangeCanvas({ data }: { data: CoinChangeData }) {
  const call = data.stack.at(-1);
  const hasBranches =
    call && call.i < data.coins.length && call.a < data.amount && data.event !== 'cache hit';
  const stackView = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (stackView.current) stackView.current.scrollLeft = stackView.current.scrollWidth;
  }, [call?.id]);
  return (
    <div className="practice-visual coin-visual">
      <div className="coin-summary">
        <span>
          Coins, in original order <b>{data.coins.join(' · ')}</b>
        </span>
        <span>
          Target <b>{data.amount}</b>
        </span>
        <span>
          Root answer <b>{data.result ?? 'not returned'}</b>
        </span>
      </div>
      <section className="recursion-state" aria-label="Current recursive call">
        <div className="visual-section-label">
          Call stack <span>root → active call · {data.stack.length} deep</span>
        </div>
        <ol
          className="call-stack"
          ref={stackView}
          tabIndex={0}
          aria-label="Scrollable call stack, active call is last"
        >
          {data.stack.length ? (
            data.stack.map((entry, index) => (
              <li
                key={entry.id}
                className={index === data.stack.length - 1 ? 'active' : ''}
                aria-current={index === data.stack.length - 1 ? 'true' : undefined}
              >
                <small>{entry.via}</small>
                <code>
                  dfs({entry.i}, {entry.a})
                </code>
              </li>
            ))
          ) : (
            <li className="empty-stack">
              {data.result === null ? 'No calls yet' : 'All calls returned'}
            </li>
          )}
        </ol>
        {call && (
          <div className="active-call">
            <b>
              dfs(i = {call.i}, a = {call.a})
            </b>
            <span>
              <code>a</code> is the sum already collected, not the amount remaining.
            </span>
            {data.returnValue !== null && (
              <strong className="returned-value">Returning {data.returnValue}</strong>
            )}
          </div>
        )}
        {hasBranches && (
          <div className="coin-branches">
            <div
              className={data.event === 'take' || data.event === 'take returned' ? 'active' : ''}
            >
              <small>1 · Take {data.coins[call.i]}</small>
              <code>
                dfs({call.i}, {call.a + data.coins[call.i]})
              </code>
              <span>Same coin index · can reuse</span>
              <b>{call.take === null ? '? not returned' : `${call.take} ways`}</b>
            </div>
            <span className="branch-plus">+</span>
            <div className={data.event === 'skip' ? 'active' : ''}>
              <small>2 · Skip {data.coins[call.i]}</small>
              <code>
                dfs({call.i + 1}, {call.a})
              </code>
              <span>Next coin · same sum</span>
              <b>{call.skip === null ? '? not returned' : `${call.skip} ways`}</b>
            </div>
          </div>
        )}
      </section>
      <section aria-label="Memoization table">
        <div className="visual-section-label">
          Cache <span>row = coin index i · column = collected sum a</span>
        </div>
        <StateLegend
          items={[
            { label: 'Not cached', symbol: '—', color: muted },
            { label: 'Computed, including 0', symbol: '●', color: violet },
            { label: 'Current state', symbol: '□', color: cyan },
          ]}
        />
        <div
          className="memo-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable memoization table"
        >
          <table className="coin-memo">
            <caption>cache[(i, a)] counts ways to finish from this state.</caption>
            <thead>
              <tr>
                <th scope="col">i / a</th>
                {Array.from({ length: data.amount + 1 }, (_, a) => (
                  <th scope="col" key={a}>
                    {a}
                    {a === data.amount && <small>target</small>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.memo.map((row, i) => (
                <tr key={i}>
                  <th scope="row">
                    i = {i}
                    <small>coin {data.coins[i]}</small>
                  </th>
                  {row.map((value, a) => (
                    <td
                      key={a}
                      className={`${value !== null ? 'computed' : ''} ${data.active?.[0] === i && data.active[1] === a ? 'current' : ''} ${a === data.amount ? 'base-column' : ''}`}
                      aria-label={`i ${i}, sum ${a}: ${value === null ? 'not cached' : value}${data.active?.[0] === i && data.active[1] === a ? ', current state' : ''}`}
                    >
                      {value ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="visual-footnote">
          Base cases return directly and never enter this table. Reaching the target returns 1;
          overshooting or running out of coins returns 0. A stored 0 is a computed answer, not an
          empty cell.
        </p>
      </section>
    </div>
  );
}
