import { LessonMotion, StateLegend } from '../../../shared/ui/LessonPrimitives';
import { motion } from 'motion/react';
import { SequenceStrip } from './StudyPrimitives';
import './styles/indexed-stack.css';
export interface StackToken {
  index: number;
  value: string;
}
export function IndexedStackRail({
  tokens,
  label,
  focus,
}: {
  tokens: StackToken[];
  label: string;
  focus?: number | null;
}) {
  return (
    <section className="indexed-stack" aria-label={label}>
      <header>
        <h3>{label}</h3>
        <span>Bottom → top · {tokens.length}</span>
      </header>
      <div className="study-scroll" role="region" tabIndex={0} aria-label={'Scrollable ' + label}>
        <LessonMotion>
          <ol>
            {tokens.map((token, i) => (
              <motion.li
                key={token.index}
                layout
                className={token.index === focus ? 'stack-focus' : ''}
              >
                <span>Index {token.index}</span>
                <b>{token.value}</b>
                <span>{i === tokens.length - 1 ? 'Top' : 'Stored'}</span>
              </motion.li>
            ))}
          </ol>
        </LessonMotion>
        {!tokens.length && <p className="stack-empty">Empty · no stored resources</p>}
      </div>
    </section>
  );
}
export function BracketRibbon({ s, index }: { s: string; index: number }) {
  return (
    <SequenceStrip
      label="Indexed input characters"
      cells={[...s].map((value, i) => ({
        value,
        state: i === index ? 'active' : i < index ? 'stored' : 'pending',
        note: i === index ? 'Current' : i < index ? 'Read' : 'Unread',
      }))}
      pointer={index < s.length && index >= 0 ? { index, label: 'Read' } : null}
    />
  );
}
export function BracketLegend() {
  return (
    <StateLegend
      items={[
        { label: 'Current character', symbol: '□', color: '#37d9ff' },
        { label: 'Stored opening / resource', symbol: '(', color: '#9b8cff' },
        { label: 'Rejected', symbol: '×', color: '#f06cae' },
        { label: 'Completed', symbol: '✓', color: '#4fd1a1' },
      ]}
    />
  );
}
