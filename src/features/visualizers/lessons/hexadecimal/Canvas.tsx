import type { HexadecimalData } from './adapter';

import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

const cyan = '#37d9ff',
  violet = '#9b8cff',
  red = '#ff6b7a',
  green = '#4fd1a1',
  muted = '#a9b4c2';

export function HexadecimalCanvas({ data }: { data: HexadecimalData }) {
  const bits = data.working?.toString(2).padStart(32, '0');
  return (
    <div className="practice-visual hex-visual">
      <div className="hex-values">
        <div>
          <small>Original signed input</small>
          <strong>{data.original}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>Working unsigned value</small>
          <strong>{data.working ?? 'not masked'}</strong>
        </div>
      </div>
      <section aria-label="32-bit working word">
        <div className="visual-section-label">
          32-bit working word <span>Read left → right · bit 31 to bit 0</span>
        </div>
        {bits ? (
          <div className="bit-word">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                className={`bit-nibble ${index === 7 && data.nibble !== null ? 'current' : ''}`}
                key={index}
              >
                <small>
                  {31 - index * 4}–{28 - index * 4}
                </small>
                <code>{bits.slice(index * 4, index * 4 + 4)}</code>
                <span>{index === 7 ? 'lowest 4 bits' : `group ${7 - index}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="word-placeholder">
            {data.action === 'zero'
              ? 'The zero branch returns before the bit operations.'
              : 'The 32-bit word appears after num &= 0xFFFFFFFF.'}
          </div>
        )}
      </section>
      <StateLegend
        items={[
          { label: 'Current nibble', symbol: '□', color: cyan },
          { label: 'New result digit', symbol: '●', color: green },
        ]}
      />
      <div className="hex-operation">
        <div>
          <small>Extract</small>
          <code>num & 15</code>
          <b>
            {data.nibble === null
              ? '—'
              : `${data.nibble.toString(2).padStart(4, '0')}₂ = ${data.nibble}`}
          </b>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>Look up</small>
          <code>hashmap[value]</code>
          <b>{data.digit === null ? '—' : `“${data.digit}”`}</b>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>Prepend</small>
          <code>digit + res</code>
          <b>
            {data.action === 'prepend'
              ? 'Updated below'
              : data.action === 'extract'
                ? 'Next operation'
                : '—'}
          </b>
        </div>
      </div>
      <details className="hex-lookup" open={data.action === 'lookup'}>
        <summary>Hex digit map · 0–15 → 0–f</summary>
        <div>
          {Array.from('0123456789abcdef', (digit, index) => (
            <span className={data.nibble === index ? 'current' : ''} key={digit}>
              <small>{index}</small>
              <b>{digit}</b>
            </span>
          ))}
        </div>
      </details>
      <section className="hex-result" aria-label="Accumulated result">
        <div className="visual-section-label">
          Result <span>New digits are added on the left</span>
        </div>
        <div className="hex-result-digits">
          {data.result ? (
            Array.from(data.result, (digit, index) => (
              <span
                className={data.action === 'prepend' && index === 0 ? 'new-digit' : ''}
                key={index}
              >
                {digit}
              </span>
            ))
          ) : (
            <em>Empty string ""</em>
          )}
        </div>
      </section>
      <p className="visual-footnote">
        One hexadecimal digit represents four bits. Masking first keeps negative inputs within 32
        bits; shifting then discards the nibble just consumed. This is your bit-manipulation
        solution, not a built-in conversion.
      </p>
    </div>
  );
}
