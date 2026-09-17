import { ProblemClassification } from './ProblemClassification';
import { SolutionEditor } from './SolutionEditor';
import { PrecisionNotes } from './PrecisionNotes';
import { MistakeHistory } from './MistakeHistory';

import { ArrowLeft, Braces, Check, Plus, Save, ScanLine, Sparkles, Trash2, X } from 'lucide-react';

import type { Difficulty, ProblemStatus } from '../../../shared/contracts/index';

import { useProblemEditor } from './useProblemEditor';
export function ProblemEditorPage() {
  const model = useProblemEditor();
  const {
    editing,
    navigate,
    form,
    message,
    setMessage,
    repeatOpen,
    setRepeatOpen,
    repeatReasons,
    setRepeatReasons,
    repeatObservation,
    setRepeatObservation,
    taxonomy,
    problem,
    save,
    remove,
    addRepeat,
    openVisualizer,
  } = model;
  return (
    <section className="page-scroll editor-page">
      <div className="editor-top">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> BACK
        </button>
        <div>
          <p className="eyebrow">
            <Braces size={13} /> {editing ? 'PROBLEM SIGNAL' : 'NEW MISTAKE'}
          </p>
          <h2>{editing ? (problem?.title ?? 'Loading signal…') : 'Log what went wrong'}</h2>
        </div>
        <div className="editor-actions">
          {editing && (
            <button className="danger-icon" onClick={remove} aria-label="Delete problem">
              <Trash2 size={16} />
            </button>
          )}
          {editing && (
            <button className="visualize-btn" onClick={openVisualizer}>
              <ScanLine size={15} /> 2D VISUALIZATION
            </button>
          )}
          <button className="secondary-btn" onClick={() => setRepeatOpen(true)} disabled={!editing}>
            <Plus size={15} /> WRONG AGAIN
          </button>
          <button
            className="primary-btn"
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.title || !form.primary_subtag_id}
          >
            <Save size={15} /> {save.isPending ? 'SAVING…' : 'SAVE SIGNAL'}
          </button>
        </div>
      </div>
      {message && (
        <div
          className={`toast-message ${message.includes('saved') || message.includes('added') ? 'success' : ''}`}
        >
          <Sparkles size={14} />
          {message}
          <button onClick={() => setMessage('')}>
            <X size={13} />
          </button>
        </div>
      )}
      <div className="editor-grid">
        <div className="editor-main">
          <ProblemClassification model={model} />
          <SolutionEditor model={model} />
        </div>
        <aside className="notes-column">
          <PrecisionNotes model={model} />
          {editing && <MistakeHistory model={model} />}
        </aside>
      </div>
      {repeatOpen && (
        <div className="modal-backdrop">
          <div className="repeat-modal panel">
            <button className="modal-close" onClick={() => setRepeatOpen(false)}>
              <X size={16} />
            </button>
            <p className="eyebrow">REPEAT SIGNAL</p>
            <h3>What broke this time?</h3>
            <div className="chip-field failure-field">
              <div>
                {taxonomy?.failure_reasons.map((node) => (
                  <button
                    type="button"
                    className={repeatReasons.includes(node.id) ? 'selected' : ''}
                    key={node.id}
                    onClick={() =>
                      setRepeatReasons((current) =>
                        current.includes(node.id)
                          ? current.filter((id) => id !== node.id)
                          : [...current, node.id],
                      )
                    }
                  >
                    {node.name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={4}
              value={repeatObservation}
              onChange={(e) => setRepeatObservation(e.target.value)}
              placeholder="Optional observation…"
            />
            <button className="primary-btn" onClick={addRepeat}>
              <Check size={15} /> ADD TO HISTORY
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
