import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { OperationLedger, SequenceStrip } from '../../components/StudyPrimitives';
import type { DepthData } from './types';
export function DepthCanvas({ data }: { data: DepthData }) {
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Character being read', symbol: '□', color: '#37d9ff' },
          { label: 'Occupied level', symbol: '(', color: '#9b8cff' },
          { label: 'Matched ranges are derived', symbol: '()', color: '#a9b4c2' },
        ]}
      />
      <SequenceStrip
        label="Expression characters"
        cells={[...data.s].map((value, index) => ({
          value,
          state: index === data.i ? 'active' : 'idle',
        }))}
        pointer={data.i < data.s.length ? { index: data.i, label: 'i' } : null}
        ranges={data.ranges.map((range) => ({ ...range, label: `Matched level ${range.level}` }))}
      />
      <div className="study-layout">
        <section>
          <h3>Current nesting levels</h3>
          <div className="depth-meter" aria-label={`Current depth ${data.localDepth}`}>
            {Array.from({ length: Math.max(1, data.localDepth, data.maximum) }, (_, level) => (
              <div key={level} className={level < data.localDepth ? 'occupied' : ''}>
                Level {level + 1} · {level < data.localDepth ? 'open' : 'outside'}
              </div>
            ))}
          </div>
          <p>
            Matched ranges are explanatory annotations. The reference uses two counters and a
            pointer.
          </p>
        </section>
        <OperationLedger
          equation={data.equation}
          metrics={[
            { label: 'Current depth · loc_depth', value: data.localDepth },
            { label: 'Maximum recorded · depth', value: data.maximum },
            { label: 'Pointer · i', value: data.i },
            { label: 'Returned value', value: data.result ?? 'Pending' },
          ]}
        />
      </div>
    </div>
  );
}
