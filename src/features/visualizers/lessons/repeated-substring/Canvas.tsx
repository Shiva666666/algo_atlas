import { motion } from 'motion/react';

import { StateLegend, useLessonReducedMotion } from '../../../../shared/ui/LessonPrimitives';

import type { RepeatedData } from './adapter';

import '../../components/styles/sequence-and-grid.css';

const colors = { current: '#37d9ff', structure: '#9b8cff', reject: '#f06cae', success: '#4fd1a1' };

export function RepeatedSubstringCanvas({ data: d }: { data: RepeatedData }) {
  const reduced = useLessonReducedMotion();
  return (
    <div className="two-lesson prefix-studio" data-action={d.action}>
      <header className="two-heading">
        <div>
          <h2>One prefix. A whole string.</h2>
          <p>A valid block divides the length and recreates every character.</p>
        </div>
        <span className="two-measure">n = {d.n}</span>
      </header>
      <StateLegend
        items={[
          { symbol: '→', label: 'Current candidate', color: colors.current },
          { symbol: 'P', label: 'Prefix blocks', color: colors.structure },
          { symbol: '×', label: 'Mismatch / skipped', color: colors.reject },
          { symbol: '✓', label: 'Complete match', color: colors.success },
        ]}
      />
      <div className="prefix-workspace">
        <section className="two-plane" aria-label="Aligned original and reconstructed strings">
          <h3>Original vs reconstruction</h3>
          <div
            className="two-scroll"
            tabIndex={0}
            role="region"
            aria-label="Character alignment, scroll horizontally"
          >
            <div className="prefix-alignment" style={{ width: Math.max(280, d.n * 44) }}>
              <div className="prefix-strip-label">
                Original s <span>index above · character below</span>
              </div>
              <div className="prefix-strip">
                {Array.from(d.s).map((char, i) => (
                  <div
                    className={
                      'prefix-character ' +
                      (d.mismatches.includes(i) ? 'mismatch' : '') +
                      (d.comparison === true ? ' matched' : '')
                    }
                    key={i}
                  >
                    <small>{i}</small>
                    <b>{char}</b>
                    <span>{d.mismatches.includes(i) ? '×' : d.comparison === true ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
              <div className="prefix-strip-label">
                Repeated prefix{' '}
                <span>
                  {d.copies === null
                    ? 'Awaiting construction'
                    : d.copies + ' copies of “' + d.prefix + '”'}
                </span>
              </div>
              <div className="prefix-strip">
                {Array.from(d.s).map((_, i) => (
                  <motion.div
                    key={String(d.length) + '-' + i}
                    initial={false}
                    animate={{ y: d.built ? 0 : 3, opacity: d.built ? 1 : 0.55 }}
                    transition={{
                      duration: reduced ? 0 : 0.18,
                      delay: reduced ? 0 : Math.min(0.25, Math.floor(i / (d.length || 1)) * 0.035),
                    }}
                    className={
                      'prefix-character reconstructed ' +
                      (d.length && i % d.length === 0 ? 'block-start ' : '') +
                      (d.mismatches.includes(i) ? 'mismatch' : '') +
                      (d.comparison === true ? ' matched' : '')
                    }
                  >
                    <small>
                      {d.built && d.length
                        ? i % d.length === 0
                          ? '#' + (Math.floor(i / d.length) + 1)
                          : ' '
                        : '—'}
                    </small>
                    <b>{d.built[i] ?? '·'}</b>
                    <span>{d.mismatches.includes(i) ? '×' : d.comparison === true ? '✓' : ''}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <p className="two-help">
            Mismatch markers explain one string equality check. They do not add a character loop to
            your Python.
          </p>
        </section>
        <aside className="two-plane prefix-ledger" aria-label="Divisibility ledger">
          <h3>Candidate ledger</h3>
          <dl>
            <div>
              <dt>Prefix length</dt>
              <dd>{d.length ?? '—'}</dd>
            </div>
            <div>
              <dt>Divisibility</dt>
              <dd>
                {d.remainder === null
                  ? 'Not checked'
                  : d.n + ' % ' + d.length + ' = ' + d.remainder}
              </dd>
            </div>
            <div>
              <dt>Prefix s[:length]</dt>
              <dd>{d.prefix ? '“' + d.prefix + '”' : 'Not extracted'}</dd>
            </div>
            <div>
              <dt>Copies n // length</dt>
              <dd>{d.copies ?? 'Not computed'}</dd>
            </div>
          </dl>
          <p
            className={
              'two-verdict ' +
              (d.comparison === true
                ? 'success'
                : d.comparison === false || !!d.remainder
                  ? 'rejected'
                  : '')
            }
          >
            {d.remainder
              ? 'Non-divisor: no complete tiling.'
              : d.comparison === false
                ? d.mismatches.length + ' mismatching positions'
                : d.comparison === true
                  ? 'Every block matches.'
                  : 'Compare only when the length divides n.'}
          </p>
        </aside>
      </div>
      <section className="two-plane" aria-label="Candidate lengths">
        <h3>Lengths tried in code order</h3>
        {d.candidates.length ? (
          <ol className="prefix-candidates">
            {d.candidates.map((c) => (
              <li
                key={c.length}
                aria-current={c.length === d.length ? 'step' : undefined}
                className={c.status + (c.length === d.length ? ' current' : '')}
              >
                <b>{c.length}</b>
                <span>{c.status}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>No candidates: floor(1 / 2) = 0.</p>
        )}
      </section>
      <footer
        className={'two-result ' + (d.result === true ? 'success' : '')}
        aria-label="Repeated substring result"
      >
        <span>Return value</span>
        <output>{d.result === null ? 'Still testing' : d.result ? 'True' : 'False'}</output>
        <p>
          {d.result === true
            ? '“' + d.prefix + '” × ' + d.copies + ' reconstructs “' + d.s + '”.'
            : d.result === false
              ? 'No proper prefix can repeat to form this string.'
              : 'A candidate can fail without ending the search.'}
        </p>
      </footer>
    </div>
  );
}
