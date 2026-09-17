import type { CSSProperties } from 'react';

import type { NQueensData } from './adapter';

import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  red = '#ff6b7a',
  green = '#4fd1a1',
  muted = '#a9b4c2';

const setText = (values: number[]) => (values.length ? `{ ${values.join(', ')} }` : '∅');

export function NQueensCanvas({ data }: { data: NQueensData }) {
  const { n, board, candidate } = data;
  const describe = `${n} by ${n} working board. ${board.length ? board.map((column, row) => `Queen at row ${row}, column ${column}`).join('. ') : 'No queens placed.'}${candidate ? ` Candidate row ${candidate.row}, column ${candidate.column}; ${candidate.conflicts.length ? 'attacked' : 'safe'}.` : ''}`;
  return (
    <div className="practice-visual queens-visual">
      <StateLegend
        items={[
          { label: 'Placed queen', symbol: 'Q', color: violet },
          { label: 'Candidate', symbol: '◎', color: cyan },
          { label: 'Conflict', symbol: '×', color: red },
        ]}
      />
      <div className="queen-workspace">
        <section aria-label="Working chessboard">
          <div className="visual-section-label">
            Working board <span>0-based row / column</span>
          </div>
          <div className="queen-coordinates" style={{ '--board-n': n } as CSSProperties}>
            <span className="queen-axis-corner">r / c</span>
            <div className="queen-column-axis">
              {Array.from({ length: n }, (_, c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="queen-row-axis">
              {Array.from({ length: n }, (_, r) => (
                <span className={r === data.row ? 'current' : ''} key={r}>
                  {r}
                </span>
              ))}
            </div>
            <div className="queen-board" role="img" aria-label={describe}>
              {Array.from({ length: n * n }, (_, index) => {
                const row = Math.floor(index / n),
                  column = index % n;
                const placed = board[row] === column;
                const testing = candidate?.row === row && candidate.column === column;
                const conflict = placed && candidate?.conflicts.includes(row);
                return (
                  <div
                    key={index}
                    aria-hidden="true"
                    className={`queen-square ${(row + column) % 2 ? 'dark' : ''} ${placed ? 'placed' : ''} ${testing ? 'candidate' : ''} ${conflict || (testing && candidate.conflicts.length) ? 'conflict' : ''}`}
                  >
                    {placed ? (
                      <b>Q</b>
                    ) : testing ? (
                      <b>{candidate.conflicts.length ? '×' : '◎'}</b>
                    ) : (
                      <span>·</span>
                    )}
                  </div>
                );
              })}
              {candidate && candidate.conflicts.length > 0 && (
                <svg className="queen-attack-lines" viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
                  {candidate.conflicts.map((row) => (
                    <line
                      key={row}
                      x1={board[row] + 0.5}
                      y1={row + 0.5}
                      x2={candidate.column + 0.5}
                      y2={candidate.row + 0.5}
                    />
                  ))}
                </svg>
              )}
            </div>
          </div>
        </section>
        <section className="queen-state" aria-label="Attack sets">
          <div className="visual-section-label">Occupied attack sets</div>
          <dl>
            <div>
              <dt>
                Columns <code>col</code>
              </dt>
              <dd>{setText(data.columns)}</dd>
            </div>
            <div>
              <dt>
                ↘ Diagonals <code>row − col</code>
              </dt>
              <dd>{setText(data.differences)}</dd>
            </div>
            <div>
              <dt>
                ↗ Diagonals <code>row + col</code>
              </dt>
              <dd>{setText(data.sums)}</dd>
            </div>
          </dl>
          {candidate ? (
            <div className={`candidate-check ${candidate.conflicts.length ? 'is-conflict' : ''}`}>
              <b>{data.action === 'place' ? 'Registered queen' : 'Candidate check'}</b>
              <span>column = {candidate.column}</span>
              <span>row − col = {candidate.row - candidate.column}</span>
              <span>row + col = {candidate.row + candidate.column}</span>
              <p>
                {candidate.conflicts.length
                  ? 'A matching set entry means this square is attacked.'
                  : data.action === 'place'
                    ? 'All three markers now include this queen.'
                    : 'None of these markers are occupied. This square is safe.'}
              </p>
            </div>
          ) : (
            <p className="visual-footnote">
              Each recursive call chooses one row. Removing a queen must also remove all three
              attack markers.
            </p>
          )}
        </section>
      </div>
      <details
        className="saved-boards"
        open={data.action === 'complete' || data.action === 'solution'}
      >
        <summary>
          Saved solutions <strong>{data.solutions.length}</strong>
          <span>Copied boards, separate from the working board</span>
        </summary>
        {data.solutions.length ? (
          <div className="saved-board-list">
            {data.solutions.map((solution, index) => (
              <figure key={index}>
                <div
                  className="mini-board"
                  style={{ '--board-n': n } as CSSProperties}
                  role="img"
                  aria-label={`Solution ${index + 1}: columns ${solution.join(', ')}`}
                >
                  {Array.from({ length: n * n }, (_, cell) => (
                    <span
                      key={cell}
                      aria-hidden="true"
                      className={solution[Math.floor(cell / n)] === cell % n ? 'placed' : ''}
                    >
                      {solution[Math.floor(cell / n)] === cell % n ? 'Q' : '·'}
                    </span>
                  ))}
                </div>
                <figcaption>Solution {index + 1}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="visual-footnote">
            {data.action === 'complete'
              ? `No valid board exists for n = ${n}.`
              : 'No complete board saved yet.'}
          </p>
        )}
      </details>
    </div>
  );
}
