import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { DependencyGrid, OperationLedger } from '../../components/StudyPrimitives';
import type { TriangleData } from './types';
export function TriangleCanvas({ data }: { data: TriangleData }) {
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Current cell', symbol: '□', color: '#37d9ff' },
          { label: 'Compared parent', symbol: '↗', color: '#9b8cff' },
          { label: 'Derived final path', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="study-layout">
        <section>
          <h3>Input above · minimum cost below</h3>
          <DependencyGrid
            label="Triangle path costs"
            active={data.active}
            parents={data.parents}
            rows={data.triangle.map((row, r) =>
              row.map((input, c) => ({
                input,
                cost: data.dp[r][c],
                state:
                  data.active?.[0] === r && data.active[1] === c
                    ? 'active'
                    : data.parents.some(([pr, pc]) => pr === r && pc === c)
                      ? 'dependency'
                      : data.path.some(([pr, pc]) => pr === r && pc === c)
                        ? 'result'
                        : data.dp[r][c] === null
                          ? 'idle'
                          : 'stored',
              })),
            )}
          />
        </section>
        <OperationLedger
          equation={data.equation}
          metrics={[
            { label: 'Active cell', value: data.active?.join(', ') ?? '—' },
            { label: 'Parent', value: data.parents.map((p) => p.join(', ')).join(' / ') || '—' },
            { label: 'Returned minimum', value: data.result ?? 'Pending' },
          ]}
        >
          <p>
            ∞ means initialized, with no evaluated path. Each valid dependency belongs to the
            preceding row.
          </p>
          {data.path.length > 0 && (
            <p>
              Derived path: {data.path.map(([r, c]) => data.triangle[r][c]).join(' → ')}. This
              annotation is reconstructed after DP finishes.
            </p>
          )}
        </OperationLedger>
      </div>
    </div>
  );
}
