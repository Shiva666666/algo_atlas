import type { Difficulty, ProblemStatus } from '../../../shared/contracts/index';

import type { useProblemEditor } from './useProblemEditor';

const sections = [
  ['why_missed', 'WHY I MISSED IT', 'Be brutally specific: one reason per line.'],
  [
    'recognition_signals',
    'RECOGNITION SIGNALS',
    'What clue should trigger this technique next time?',
  ],
  ['core_insight', 'CORE INSIGHT', 'The shortest correct mental model.'],
  ['approach', 'APPROACH', 'Ordered steps, one per line.'],
  ['invariants', 'INVARIANTS', 'What must remain true throughout the algorithm?'],
  ['edge_cases', 'EDGE CASES', 'Empty, singleton, duplicate, overflow…'],
  ['follow_up', 'FOLLOW-UP', 'What would you change or compare next?'],
] as const;

type Model = ReturnType<typeof useProblemEditor>;
export function PrecisionNotes({ model }: { model: Model }) {
  const { noteValue, updateNotes } = model;
  return (
    <article className="panel notes-panel">
      <div className="panel-title">
        <span>03 / PRECISION NOTES</span>
        <small>ONE BULLET PER LINE</small>
      </div>
      {sections.map(([key, label, hint]) => (
        <label key={key}>
          <span>{label}</span>
          <small>{hint}</small>
          <textarea
            rows={key === 'core_insight' ? 3 : 4}
            value={noteValue(key)}
            onChange={(e) => updateNotes(key, e.target.value)}
            placeholder="• Keep this concise and actionable"
          />
        </label>
      ))}
    </article>
  );
}
