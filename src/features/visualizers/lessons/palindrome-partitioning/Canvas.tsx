import type { CSSProperties } from 'react';

import type { PalindromeFrameData } from './types';

export function PalindromeCanvas({ data }: { data: PalindromeFrameData }) {
  const n = data.s.length;
  const active = (index: number) =>
    data.highlightStart !== null &&
    data.highlightEnd !== null &&
    index >= data.highlightStart &&
    index <= data.highlightEnd;
  return (
    <div className="palindrome-visual">
      <div className="string-ribbon" aria-label={`Input string ${data.s}`}>
        {Array.from(data.s).map((character, index) => (
          <div
            className={`${active(index) ? 'active' : ''} ${index === data.activeStart ? 'start' : ''} ${index === data.activeEnd ? 'end' : ''}`}
            key={`${character}-${index}`}
          >
            <small>{index}</small>
            <b>{character}</b>
          </div>
        ))}
      </div>
      <div className="state-plane-grid">
        <section className="state-plane">
          <header>
            <span>PALINDROME[start][end]</span>
            <small>DEPENDENCY PLANE</small>
          </header>
          <div className="viz-matrix-scroll">
            <div className="viz-matrix" style={{ '--viz-n': n } as CSSProperties}>
              <i className="matrix-corner" />
              {Array.from(data.s).map((character, index) => (
                <b className="matrix-axis column" key={`column-${index}`}>
                  {character}
                  <small>{index}</small>
                </b>
              ))}
              {data.palindrome.map((row, start) => (
                <div className="matrix-row" key={`row-${start}`}>
                  <b className="matrix-axis row">
                    {data.s[start]}
                    <small>{start}</small>
                  </b>
                  {row.map((value, end) => {
                    const current = start === data.activeStart && end === data.activeEnd;
                    const className = [
                      value === null ? 'void' : value ? 'truthy' : 'falsy',
                      current ? 'current' : '',
                      current && data.accepted === true ? 'accepted' : '',
                      current && data.accepted === false ? 'rejected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <span
                        className={className}
                        key={`${start}-${end}`}
                        title={`palindrome[${start}][${end}] = ${value}`}
                      >
                        <em>{value === null ? '·' : value ? 'T' : 'F'}</em>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="state-transfer">
          <i />
          <span>
            VALID FINAL
            <br />
            PALINDROME
          </span>
          <i />
        </div>
        <section className="state-plane cut-plane">
          <header>
            <span>CUTS[end]</span>
            <small>PREFIX STATE</small>
          </header>
          <div className="cut-cells">
            {data.cuts.map((value, index) => (
              <div className={index === data.activeEnd ? 'current' : ''} key={`cut-${index}`}>
                <small>{index}</small>
                <strong>{value ?? '—'}</strong>
                <span>{data.s.slice(0, index + 1)}</span>
              </div>
            ))}
          </div>
          <div className={`transition-equation ${data.accepted === false ? 'rejected' : ''}`}>
            {data.activeStart === null || data.activeEnd === null ? (
              <>
                <small>STATE RULE</small>
                <b>cuts[end] = min(cuts[start − 1] + 1)</b>
              </>
            ) : (
              <>
                <small>{data.accepted ? 'TRANSITION ACCEPTED' : 'TRANSITION SKIPPED'}</small>
                <b>
                  {data.accepted
                    ? data.activeStart === 0
                      ? `cuts[${data.activeEnd}] = 0`
                      : `cuts[${data.activeEnd}] ← min(current, cuts[${data.activeStart - 1}] + 1${data.candidate === null ? '' : ` = ${data.candidate}`})`
                    : `palindrome[${data.activeStart}][${data.activeEnd}] = False`}
                </b>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
