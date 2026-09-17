import type { LessonValue } from './types';
import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  green = '#4fd1a1',
  pink = '#f06cae',
  muted = '#a9b4c2';

export function UniqueLesson({ v }: { v: LessonValue }) {
  const candidate = typeof v.candidate === 'number' ? v.arr?.[v.candidate] : null;
  return (
    <div className="three-lesson unique-lesson">
      <StateLegend
        items={[
          { label: 'Current word', symbol: '●', color: violet },
          { label: 'Candidate', symbol: '□', color: cyan },
          { label: 'Rejected', symbol: '×', color: pink },
          { label: 'Compatible', symbol: '✓', color: green },
        ]}
      />
      <section className="unique-stage" aria-label="String compatibility workbench">
        <div className="unique-words">
          <header>
            <span>INPUT WORDS</span>
            <small>indexes preserve subsequence order</small>
          </header>
          <div>
            {(v.arr ?? []).map((word: string, index: number) => (
              <article
                key={`${word}-${index}`}
                className={`${index === v.candidate ? 'candidate' : ''} ${v.word?.includes(word) && word ? 'chosen' : ''}`}
              >
                <small>{index}</small>
                <b>{word}</b>
              </article>
            ))}
          </div>
        </div>
        <div className="unique-current">
          <header>
            <span>CURRENT CALL</span>
            <small>
              backtrack({v.i ?? '—'}, "{v.word || ''}")
            </small>
          </header>
          <strong>{v.word || 'ε'}</strong>
          <p>Occupied letters</p>
          <div className="letter-rail">
            {Array.from('abcdefghijklmnopqrstuvwxyz').map((letter) => (
              <i className={(v.used ?? []).includes(letter) ? 'used' : ''} key={letter}>
                {letter}
              </i>
            ))}
          </div>
          <footer>
            Best returned length <b>{v.best ?? v.result ?? 0}</b>
          </footer>
        </div>
        <div className="unique-checks">
          <header>
            <span>CANDIDATE CHECK</span>
            <small>
              {candidate === null
                ? 'waiting for a candidate'
                : `arr[${v.candidate}] = "${candidate}"`}
            </small>
          </header>
          {candidate === null ? (
            <p>Step to a candidate check to compare its letters with the current word.</p>
          ) : (
            <dl>
              <div className={v.unique === false ? 'fail' : 'pass'}>
                <dt>1. Internal uniqueness</dt>
                <dd>
                  {v.unique === true
                    ? 'Pass · no repeated letter'
                    : v.unique === false
                      ? 'Fail · duplicate inside this word'
                      : '—'}
                </dd>
              </div>
              <div className={v.disjoint === null ? 'skipped' : v.disjoint ? 'pass' : 'fail'}>
                <dt>2. Disjoint with current</dt>
                <dd>
                  {v.disjoint === null
                    ? 'Not evaluated'
                    : v.disjoint
                      ? 'Pass · safe to concatenate'
                      : 'Fail · overlaps current word'}
                </dd>
              </div>
            </dl>
          )}
          <p className="why-line">
            Why: Python evaluates the internal uniqueness test first; overlap is only tested if it
            passes.
          </p>
        </div>
      </section>
    </div>
  );
}
