import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import type { WiggleData } from './types';
import './styles.css';
export function Canvas({ data: d }: { data: WiggleData }) {
  const split = Math.ceil(d.original.length / 2);
  return (
    <div className="study-workbench">
      <StateLegend
        items={[
          { label: 'Active source / destination', symbol: '□', color: '#37d9ff' },
          { label: 'Lower / upper structure', symbol: '↔', color: '#9b8cff' },
          { label: 'Written result', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <h3>Original nums</h3>
      <SequenceStrip label="Original array" cells={d.original.map((value) => ({ value }))} />
      <h3>Sorted copy · x</h3>
      <SequenceStrip
        label="Sorted source halves"
        cells={d.sorted.map((item, index) => ({
          value: item.value,
          note: 'ID ' + item.id + (index === d.i ? ' · i' : '') + (index === d.j ? ' · j' : ''),
          state: d.transfer?.source === index ? 'active' : 'idle',
        }))}
        ranges={[
          { start: 0, end: split - 1, label: 'Lower half · valleys' },
          { start: split, end: d.original.length - 1, label: 'Upper half · peaks' },
        ].filter((r) => r.end >= r.start)}
        pointer={d.transfer ? { index: d.transfer.source, label: 'Read' } : null}
      />
      <div className="study-layout">
        <section className="wiggle-destination">
          <h3>Destination nums · overwritten in place</h3>
          <SequenceStrip
            label="Wiggle destination array"
            cells={d.nums.map((value, index) => ({
              value,
              note:
                (index % 2 ? 'Peak' : 'Valley') +
                (d.written.includes(index) ? ' · written' : ' · original'),
              state:
                d.transfer?.destination === index
                  ? 'active'
                  : d.written.includes(index)
                    ? 'result'
                    : 'pending',
            }))}
            pointer={d.z < d.nums.length ? { index: d.z, label: 'z' } : null}
          />
          <p>
            Read each half backwards. Positions not yet written still contain the original values.
          </p>
          {d.result && (
            <div className="wiggle-relations" aria-label="Derived strict wiggle checks">
              {d.result.slice(1).map((value, i) => (
                <span key={i}>
                  {d.result![i]} {i % 2 === 0 ? ' < ' : ' > '}
                  {value} · valid
                </span>
              ))}
            </div>
          )}
        </section>
        <OperationLedger
          equation={d.equation}
          metrics={[
            { label: 'Lower-half pointer · i', value: d.i },
            { label: 'Upper-half pointer · j', value: d.j },
            { label: 'Destination pointer · z', value: d.z },
            { label: 'Written positions', value: d.written.length + ' / ' + d.nums.length },
            { label: 'Python return', value: d.result ? 'None · nums modified' : 'Pending' },
          ]}
        />
      </div>
    </div>
  );
}
