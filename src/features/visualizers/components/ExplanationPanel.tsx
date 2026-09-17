import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Problem } from '../../../shared/contracts';
import type { VisualFrame, VisualizerAdapter } from '../core/types';
import { LessonButton, SmoothTabs } from '../../../shared/ui/LessonPrimitives';
import { normalizeCode } from '../core/code';
export function ExplanationPanel({
  adapter,
  problem,
  frames,
  index,
  stepTo,
  onClose,
}: {
  adapter: VisualizerAdapter;
  problem: Problem;
  frames: VisualFrame[];
  index: number;
  stepTo: (index: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState('code');
  const codeList = useRef<HTMLPreElement>(null);
  const stepList = useRef<HTMLOListElement>(null);
  const code = adapter.referenceCode ?? problem.python_code ?? '';
  const matches =
    !!adapter.referenceCode && normalizeCode(code) === normalizeCode(problem.python_code ?? '');
  const focus = frames[index]?.codeFocus ?? [];
  const exactLines = new Set(frames[index]?.codeLines ?? []);
  const highlights = code
    .split('\n')
    .map((line, lineIndex) =>
      exactLines.size > 0
        ? exactLines.has(lineIndex + 1)
        : focus.some((snippet) => line.replace(/\s/g, '').includes(snippet.replace(/\s/g, ''))),
    );
  const activeLines = highlights.flatMap((active, line) => (active ? [line + 1] : []));
  useEffect(() => {
    const panel = tab === 'code' ? codeList.current : stepList.current;
    const active = panel?.querySelector<HTMLElement>('[data-current="true"]');
    if (panel && active) {
      const top = active.offsetTop - panel.offsetTop;
      if (top < panel.scrollTop || top + active.offsetHeight > panel.scrollTop + panel.clientHeight)
        panel.scrollTop = Math.max(0, top - panel.clientHeight / 3);
    }
  }, [index, tab]);
  return (
    <aside className="lesson-explanation" aria-label="Code and steps inspector">
      <div className="lesson-inspector-heading">
        <strong>Code &amp; steps</strong>
        <LessonButton
          onClick={onClose}
          aria-label="Close code and steps inspector"
          title="Close inspector"
        >
          <X size={16} />
        </LessonButton>
      </div>
      <SmoothTabs
        id="lesson-view"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'code', label: 'Python code' },
          { id: 'steps', label: `Steps · ${frames.length}` },
        ]}
      />
      <div
        id="lesson-view-code-panel"
        role="tabpanel"
        aria-labelledby="lesson-view-code"
        hidden={tab !== 'code'}
      >
        <p className="code-context">
          {adapter.referenceCode
            ? matches
              ? 'Reference code matches your saved text.'
              : 'Reference implementation shown. Your saved text differs; custom edits are not simulated.'
            : 'Saved code for reference. This view does not execute or verify your Python.'}
        </p>
        {activeLines.length > 0 && (
          <p className="code-context" id="current-code-operation">
            {frames[index]?.title} · Code {activeLines.length === 1 ? 'line' : 'lines'}{' '}
            {activeLines.join(', ')}
          </p>
        )}
        {code ? (
          <pre
            className="lesson-code"
            ref={codeList}
            tabIndex={0}
            aria-label="Python reference code"
            aria-describedby={activeLines.length ? 'current-code-operation' : undefined}
          >
            <code>
              {code.split('\n').map((line, lineIndex) => (
                <span
                  key={lineIndex}
                  className={highlights[lineIndex] ? 'code-line current' : 'code-line'}
                  data-current={highlights[lineIndex]}
                  aria-current={highlights[lineIndex] ? 'true' : undefined}
                >
                  <i aria-hidden="true">{lineIndex + 1}</i>
                  <span>{line || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        ) : (
          <p className="lesson-empty">No Python code saved for this problem yet.</p>
        )}
        {adapter.referenceCode && !matches && (
          <details className="saved-code">
            <summary>Your saved code</summary>
            <pre tabIndex={0}>{problem.python_code || 'No code saved.'}</pre>
          </details>
        )}
        <p className="code-footnote">
          {adapter.referenceCode
            ? 'Highlighted lines are grouped logical operations. A line may have more than one visual step.'
            : 'Algorithm explanation, not a live Python debugger.'}
        </p>
      </div>
      <div
        id="lesson-view-steps-panel"
        role="tabpanel"
        aria-labelledby="lesson-view-steps"
        hidden={tab !== 'steps'}
      >
        <ol className="lesson-step-list" ref={stepList}>
          {frames.map((frame, step) => (
            <li key={step}>
              <button
                type="button"
                className={step === index ? 'current' : ''}
                aria-current={step === index ? 'step' : undefined}
                data-current={step === index}
                onClick={() => stepTo(step)}
              >
                <span>{step + 1}</span>
                <span>
                  <small>{frame.phase}</small>
                  <b>{frame.title}</b>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
