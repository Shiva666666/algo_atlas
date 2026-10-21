import { StateLegend } from '../../../../shared/ui/LessonPrimitives';
import { SequenceStrip, OperationLedger } from '../../components/StudyPrimitives';
import type { DecodeData } from './types';
import '../../components/styles/counting-studios.css';
import '../../components/styles/recovery-studios.css';
export function Canvas({ data: d }: { data: DecodeData }) {
  const width = Math.max(
    4,
    ...[d.first, ...d.encoded, ...d.res, d.board?.result ?? 0].map((v) => v.toString(2).length),
  );
  const rows = [
    { name: 'Encoded · num', value: d.board?.encoded ?? null },
    { name: 'Previous decoded used', value: d.board?.previous ?? null },
    { name: 'Computed · real', value: d.board?.result ?? null },
  ];
  const pending = d.action === 'xor' && d.board?.result !== null;
  return (
    <div className="study-workbench counting-studio recovery-studio">
      <StateLegend
        items={[
          { label: 'Current XOR / pending append', symbol: '□', color: '#37d9ff' },
          { label: 'Encoded input / known first', symbol: '◇', color: '#9b8cff' },
          { label: 'Stored decoded value', symbol: '✓', color: '#4fd1a1' },
        ]}
      />
      <div className="recovery-layout">
        <section aria-label="Encoded and decoded sequence">
          <h3>Encoded input</h3>
          <SequenceStrip
            label="Encoded XOR values"
            cells={d.encoded.map((value, i) => ({
              value,
              note:
                d.result !== null
                  ? 'Input'
                  : i === d.index
                    ? 'Current'
                    : d.index !== null && i < d.index
                      ? 'Processed'
                      : 'Unread',
              state: d.result === null && i === d.index ? 'active' : 'idle',
            }))}
            pointer={
              d.result === null && d.index !== null ? { index: d.index, label: 'num' } : null
            }
          />
          <h3>Decoded output · res</h3>
          <SequenceStrip
            label="Decoded values and pending preview"
            cells={Array.from({ length: d.encoded.length + 1 }, (_, i) => ({
              value:
                i < d.res.length
                  ? d.res[i]
                  : pending && i === d.res.length
                    ? d.board!.result!
                    : '?',
              note:
                i === 0
                  ? 'Known first'
                  : i < d.res.length
                    ? 'Stored'
                    : pending && i === d.res.length
                      ? 'Preview · append pending'
                      : 'Not decoded',
              state:
                i < d.res.length ? 'result' : pending && i === d.res.length ? 'active' : 'idle',
            }))}
            pointer={
              d.result !== null || d.res.length > d.encoded.length
                ? null
                : {
                    index: d.res.length,
                    label: pending ? 'Append next' : 'Next slot',
                  }
            }
          />
        </section>
        <aside className="studio-ledger" aria-label="XOR recovery ledger">
          <OperationLedger
            equation={d.equation}
            metrics={[
              { label: 'Known first', value: d.first },
              {
                label: d.result === null ? 'Encoded index · derived' : 'Last encoded index',
                value: d.index ?? 'Not assigned',
              },
              { label: 'num', value: d.num ?? 'Not assigned' },
              { label: 'Last assigned real', value: d.real ?? 'Not assigned' },
              { label: 'Stored output length', value: d.res.length },
            ]}
          />
          <code className="recovery-rule">
            encoded[i] = arr[i] XOR arr[i+1]
            <br />
            next = encoded[i] XOR previous
          </code>
          <p>
            XOR cancels the known previous value: a XOR b XOR a = b. Zero keeps the previous value;
            equal operands produce zero.
          </p>
          {pending && (
            <p className="studio-transfer">
              Computed {d.real}; res has not changed. Append happens in the next source statement.
            </p>
          )}
          {d.result !== null && (
            <output className="studio-result" aria-label="Returned decoded array">
              Returned decoded array: [{d.result.join(', ')}]
            </output>
          )}
        </aside>
        <section
          className="studio-section recovery-secondary"
          aria-label="Bitwise XOR operation board"
        >
          <h3>{d.result !== null ? 'Last XOR operation' : 'Bitwise XOR · high bit to low bit'}</h3>
          <p>
            0 XOR 0 = 0 · 1 XOR 1 = 0 · different bits = 1. Operands remain the ones used before the
            append; future cells are not precomputed.
          </p>
          <div
            className="study-scroll"
            role="region"
            tabIndex={0}
            aria-label="Scrollable XOR bit board"
          >
            <table className="studio-table recovery-bit-table">
              <caption>
                Aligned binary operands · {width} bits. Input values ≤100,000; decoded results may
                be larger.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Operand</th>
                  <th scope="col">Decimal</th>
                  {Array.from({ length: width }, (_, i) => (
                    <th key={i} scope="col">
                      {width - i - 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.name} className={ri === 2 ? 'xor-result' : ''}>
                    <th scope="row">{row.name}</th>
                    <td>{row.value ?? 'Not evaluated'}</td>
                    {Array.from({ length: width }, (_, i) => {
                      const bit =
                        row.value === null ? '—' : row.value.toString(2).padStart(width, '0')[i];
                      return (
                        <td key={i} className={ri === 2 && bit === '1' ? 'xor-one' : ''}>
                          {bit}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
