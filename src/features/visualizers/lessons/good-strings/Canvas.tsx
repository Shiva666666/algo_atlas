import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { MemoizedRecursionWorkbench } from '../../components/MemoizedRecursionWorkbench';
import type { GoodStringsData } from './types';
export function GoodStringsCanvas({ data }: { data: GoodStringsData }) {
  const call = data.calls.at(-1),
    width = 510;
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Active length', symbol: '→', color: '#37d9ff' },
          { label: 'Pending', symbol: '?', color: '#f1b85b' },
          { label: 'Stored', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <MemoizedRecursionWorkbench
        calls={data.calls}
        memo={data.memo}
        equation={data.equation}
        result={data.result}
        argumentLabel="Length"
      >
        <section className="memo-choice">
          <h3>Two distinct appended blocks</h3>
          <div
            className="study-scroll"
            role="region"
            tabIndex={0}
            aria-label="Length-state branches"
          >
            <svg
              width={width}
              height={178}
              role="img"
              aria-label="Zero and one blocks lead from the active length to their next lengths"
            >
              <g stroke="#495465" fill="none">
                <path
                  d="M130 85 Q240 10 350 42"
                  stroke={call?.choice === 0 ? '#37d9ff' : '#495465'}
                />
                <path
                  d="M130 85 Q240 150 350 132"
                  stroke={call?.choice === 1 ? '#37d9ff' : '#495465'}
                />
              </g>
              <g fill="#10151d" stroke="#9b8cff">
                <rect x="16" y="59" width="114" height="52" rx="6" />
                <rect x="350" y="18" width="140" height="48" rx="6" />
                <rect x="350" y="108" width="140" height="48" rx="6" />
              </g>
              <g fill="#eef4fb" fontSize="14" textAnchor="middle">
                <text x="73" y="89">
                  length {call?.argument ?? '—'}
                </text>
                <text x="420" y="47">
                  {call ? call.argument + data.zero : '—'} · zeros
                </text>
                <text x="420" y="137">
                  {call ? call.argument + data.one : '—'} · ones
                </text>
                <text x="232" y="31">
                  append {data.zero} zeros
                </text>
                <text x="232" y="146">
                  append {data.one} ones
                </text>
              </g>
            </svg>
          </div>
          <p>
            {data.zero === data.one
              ? 'Same destination length, two different choices: both returned counts are added.'
              : 'The memo stores continuation counts, not complete strings.'}{' '}
            Valid stopping lengths: [{data.low}, {data.high}].
          </p>
        </section>
      </MemoizedRecursionWorkbench>
    </div>
  );
}
