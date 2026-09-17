import type { UniqueSplitFrameData } from './types';

import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

export function UniqueSplitCanvas({ data }: { data: UniqueSplitFrameData }) {
  const end = data.end ?? data.start;
  return (
    <div className="batch1-visual unique-split-visual">
      <StateLegend
        items={[
          { label: 'Candidate', symbol: '▣', color: '#37d9ff' },
          { label: 'Chosen path', symbol: '●', color: '#4fd1a1' },
          { label: 'Rejected duplicate', symbol: '×', color: '#ff6b7a' },
        ]}
      />
      <div className="split-string" aria-label={`Input string ${data.s}`}>
        {Array.from(data.s).map((character, index) => (
          <span
            className={index >= data.start && index < end ? 'active' : ''}
            key={`${character}-${index}`}
          >
            <small>{index}</small>
            <b>{character}</b>
          </span>
        ))}
      </div>
      <div className="split-workbench">
        <section>
          <small>ACTIVE CALL STACK</small>
          <div className="split-calls">
            {data.callStack.length ? (
              data.callStack.map((call, index) => (
                <article
                  className={index === data.callStack.length - 1 ? 'current' : ''}
                  key={`${call.start}-${index}`}
                >
                  <span>backtrack({call.start})</span>
                  <strong>best {call.answer}</strong>
                </article>
              ))
            ) : (
              <em>returned to root</em>
            )}
          </div>
        </section>
        <section>
          <small>CHOSEN SUBSTRINGS · SEEN</small>
          <div className="split-chips">
            {data.path.length ? (
              data.path.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)
            ) : (
              <em>empty path</em>
            )}
          </div>
          <p>
            {data.action === 'reject'
              ? `“${data.candidate}” is already in seen.`
              : data.childResult === null
                ? 'Choose a candidate to recurse.'
                : `Child returned ${data.childResult}; this branch contributes 1 + ${data.childResult}.`}
          </p>
        </section>
      </div>
      <div className="split-status">
        <span>
          candidate <code>{data.candidate ?? '—'}</code>
        </span>
        <span>
          range{' '}
          <code>
            {data.candidateRange ? `[${data.candidateRange[0]}, ${data.candidateRange[1]})` : '—'}
          </code>
        </span>
        <span>
          best <strong>{data.best}</strong>
        </span>
      </div>
      <p className="visual-footnote">
        Only the active branch is expanded; completed siblings remain represented by their returned
        best count.
      </p>
    </div>
  );
}
