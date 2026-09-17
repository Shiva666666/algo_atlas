import { useLessonTrace } from './core/useLessonTrace';
import { useProblemQuery } from '../problems/index';

import { ExplanationPanel } from './components/ExplanationPanel';
import { nextJump, type JumpControl } from './core/lesson';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { LessonButton, LessonMotion, SmoothTabs } from '../../shared/ui/LessonPrimitives';
import { getLesson } from './registry';

import './learning.css';
import './lesson.css';

export function ProblemVisualizerPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { data: problem, isLoading, error: loadError } = useProblemQuery(problemId);
  const lesson = useMemo(() => (problem ? getLesson(problem) : null), [problem]);
  const adapter = lesson?.adapter ?? null;
  const options = lesson?.playback;
  const diagramFirst = adapter?.presentation === 'diagram-first';
  const {
    inspectorOpen,
    setInspectorOpen,
    raw,
    setRaw,
    appliedInput,
    frames,
    frameIndex,
    setFrameIndex,
    playing,
    setPlaying,
    speed,
    setSpeed,
    traceError,
    stage,
    setStage,
    showAllSteps,
    setShowAllSteps,
    playbackFrames,
    runTrace,
    stepTo,
  } = useLessonTrace(problem, lesson);
  if (isLoading)
    return (
      <div className="page-loading">
        <i />
        <p>Loading the visual explanation…</p>
      </div>
    );
  if (loadError || !problem || !adapter)
    return (
      <section className="page-scroll lesson-page">
        <div className="lesson-empty">
          <ScanLine size={28} />
          <h2>Visualizer unavailable</h2>
          <p>
            {loadError instanceof Error ? loadError.message : 'This problem could not be loaded.'}
          </p>
          <button type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </section>
    );

  const InputEditor = lesson?.InputEditor;
  const Canvas = lesson!.Canvas;
  const current = playbackFrames[frameIndex];
  const dirty = raw !== appliedInput;
  const renderJump = (jump: JumpControl) => {
    const next = nextJump(playbackFrames, frameIndex, jump);
    return (
      <LessonButton
        key={jump.label}
        className={jump.className}
        title={jump.title}
        disabled={next < 0}
        onClick={() => stepTo(next)}
      >
        {jump.label}
      </LessonButton>
    );
  };
  return (
    <LessonMotion>
      <section className="page-scroll lesson-page">
        <header className="lesson-header">
          <LessonButton className="lesson-back" onClick={() => navigate(`/problems/${problem.id}`)}>
            <ArrowLeft size={16} /> Problem notes
          </LessonButton>
          <div className="lesson-title">
            <h1>{problem.title}</h1>
            <p className="lesson-meta">2D visual explanation · {problem.status}</p>
            <p>{adapter.description}</p>
          </div>
          {problem.url && (
            <a className="lesson-source" href={problem.url} target="_blank" rel="noreferrer">
              {problem.source}
              <ExternalLink size={14} />
            </a>
          )}
        </header>
        {adapter.mistakeExplanation && (
          <details className="lesson-missed-note">
            <summary>Why this was easy to miss</summary>
            <ul>
              {adapter.mistakeExplanation.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </details>
        )}
        <form
          className="lesson-input"
          onSubmit={(event) => {
            event.preventDefault();
            runTrace();
          }}
        >
          <label className="lesson-presets">
            <span>Try an example</span>
            <select
              value={adapter.presets.find((preset) => preset.input === raw)?.input ?? ''}
              onChange={(event) => {
                setRaw(event.target.value);
                runTrace(event.target.value);
              }}
            >
              <option value="" disabled>
                Custom input
              </option>
              {adapter.presets.map((preset) => (
                <option value={preset.input} key={preset.label}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          {InputEditor ? (
            <InputEditor
              key={adapter.id}
              raw={raw}
              onChange={(value) => {
                setRaw(value);
                setPlaying(false);
              }}
            />
          ) : (
            <details className="lesson-custom-input">
              <summary>
                {adapter.inputLabel}
                <span>Edit JSON input</span>
              </summary>
              <label className="lesson-raw">
                <textarea
                  rows={2}
                  value={raw}
                  onChange={(event) => {
                    setRaw(event.target.value);
                    setPlaying(false);
                  }}
                  aria-describedby="lesson-input-guide"
                  placeholder={adapter.placeholder}
                  spellCheck={false}
                />
              </label>
            </details>
          )}
          <LessonButton className="lesson-primary" type="submit">
            <ScanLine size={16} /> Build steps
          </LessonButton>
          <p id="lesson-input-guide">
            {adapter.inputGuide ??
              `Use the example format shown above. ${adapter.mode === 'generic' ? 'This fallback inspects parameters and notes, not algorithm execution.' : 'This teaching simulation uses bounded inputs.'}`}
          </p>
        </form>
        {traceError && (
          <p className="lesson-error" role="alert">
            {traceError}
          </p>
        )}
        {dirty && frames.length > 0 && (
          <p className="lesson-notice">
            Input edited. Build steps to apply it; the paused view below still uses{' '}
            <code>{appliedInput}</code>.
          </p>
        )}
        <div className={`lesson-workspace ${diagramFirst ? 'diagram-first' : 'classic-workspace'}`}>
          <section className="lesson-stage" aria-label="Algorithm visual and playback">
            <div className="lesson-stage-label">
              <span>
                {adapter.mode === 'generic'
                  ? 'Study outline · not execution'
                  : adapter.referenceCode
                    ? 'Code-linked algorithm trace'
                    : 'Algorithm teaching model'}
              </span>
              <small>Local simulation · Python never executed</small>
            </div>
            {options?.stages && (
              <div className="steiner-stage-nav">
                <SmoothTabs
                  id="steiner-stage"
                  value={stage}
                  onChange={(value) => {
                    setPlaying(false);
                    setFrameIndex(0);
                    setStage(value);
                  }}
                  label={options.stageLabel}
                  items={options.stages}
                />
                <label className="trace-detail-toggle">
                  <input
                    type="checkbox"
                    checked={showAllSteps}
                    onChange={(event) => {
                      setPlaying(false);
                      setFrameIndex(0);
                      setShowAllSteps(event.target.checked);
                    }}
                  />{' '}
                  Show every transition
                </label>
              </div>
            )}
            <div className="lesson-controls" aria-label="Playback controls">
              <LessonButton
                onClick={() => stepTo(0)}
                disabled={!playbackFrames.length || frameIndex === 0}
                aria-label="Restart trace"
                title="Restart trace"
              >
                <RotateCcw size={17} />
              </LessonButton>
              <LessonButton
                onClick={() => stepTo(frameIndex - 1)}
                disabled={!playbackFrames.length || frameIndex === 0}
                aria-label="Previous step"
                title="Previous step"
              >
                <ChevronLeft size={19} />
              </LessonButton>
              <LessonButton
                className="lesson-play"
                onClick={() => {
                  if (!playing && frameIndex === playbackFrames.length - 1) setFrameIndex(0);
                  setPlaying((value) => !value);
                }}
                disabled={playbackFrames.length < 2 || dirty}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}{' '}
                {playing ? 'Pause' : frameIndex === playbackFrames.length - 1 ? 'Replay' : 'Play'}
              </LessonButton>
              <LessonButton
                onClick={() => stepTo(frameIndex + 1)}
                disabled={!playbackFrames.length || frameIndex >= playbackFrames.length - 1}
                aria-label="Next step"
                title="Next step"
              >
                <ChevronRight size={19} />
              </LessonButton>
              {options?.jumpsBeforeSpeed?.map(renderJump)}
              <label>
                Speed
                <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                  <option value={2200}>0.5×</option>
                  <option value={1100}>1×</option>
                  <option value={550}>2×</option>
                </select>
              </label>
              {options?.jumpsAfterSpeed?.map(renderJump)}
              <output>
                Step {playbackFrames.length ? frameIndex + 1 : 0}{' '}
                <span>/ {playbackFrames.length}</span>
              </output>
            </div>
            <div className="lesson-timeline">
              <input
                aria-label="Trace step"
                aria-valuetext={`Step ${frameIndex + 1}: ${current?.title ?? 'No trace'}`}
                type="range"
                min={0}
                max={Math.max(0, playbackFrames.length - 1)}
                value={frameIndex}
                disabled={!playbackFrames.length}
                onChange={(event) => stepTo(Number(event.target.value))}
              />
            </div>
            {current ? (
              <>
                <div className="lesson-frame-heading">
                  <span>{current.phase}</span>
                  <h2>{current.title}</h2>
                  <p>{current.message}</p>
                </div>
                <div className="lesson-canvas">
                  <Canvas frame={current} problem={problem} />
                </div>
              </>
            ) : (
              <p className="lesson-empty">Enter a valid input and build steps to begin.</p>
            )}
          </section>
          {diagramFirst && !inspectorOpen && (
            <div className="lesson-inspector-launch">
              <p>
                Follow the visual state one operation at a time. Open the reference code or complete
                step list when you want to cross-check it.
              </p>
              <LessonButton onClick={() => setInspectorOpen(true)}>
                <ScanLine size={16} /> Open code &amp; steps
              </LessonButton>
            </div>
          )}
          {(!diagramFirst || inspectorOpen) && (
            <ExplanationPanel
              key={problem.id}
              adapter={adapter}
              problem={problem}
              frames={playbackFrames}
              index={frameIndex}
              stepTo={stepTo}
              onClose={() => setInspectorOpen(false)}
            />
          )}
        </div>
      </section>
    </LessonMotion>
  );
}
