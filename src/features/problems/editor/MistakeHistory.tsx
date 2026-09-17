import { Clock3 } from 'lucide-react';

import type { Difficulty, ProblemStatus } from '../../../shared/contracts/index';

import type { useProblemEditor } from './useProblemEditor';

type Model = ReturnType<typeof useProblemEditor>;
export function MistakeHistory({ model }: { model: Model }) {
  const { problem } = model;
  return (
    <article className="panel history-panel">
      <div className="panel-title">
        <span>
          <Clock3 size={14} /> MISTAKE HISTORY
        </span>
        <small>{problem?.mistake_count ?? 0} SIGNALS</small>
      </div>
      {problem?.mistake_events?.map((event) => (
        <div key={event.id}>
          <i />
          <span>
            <b>{new Date(event.occurred_at).toLocaleDateString()}</b>
            <small>
              {event.reasons.map((reason) => reason.name).join(' · ') || 'Unclassified'}
            </small>
            {event.observation && <p>{event.observation}</p>}
          </span>
        </div>
      ))}
    </article>
  );
}
