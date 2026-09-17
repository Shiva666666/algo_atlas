import { useEffect, useMemo, useState } from 'react';
import type { Problem } from '../../../shared/contracts';
import type { VisualFrame } from './types';
import { buildTrace, selectFrames, type Lesson } from './lesson';
export function useLessonTrace(problem: Problem | undefined, lesson: Lesson | null) {
  const adapter = lesson?.adapter;
  const options = lesson?.playback;
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [appliedInput, setAppliedInput] = useState('');
  const [frames, setFrames] = useState<VisualFrame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1100);
  const [traceError, setTraceError] = useState('');
  const [stage, setStage] = useState(options?.stages?.[0]?.id ?? '');
  const [showAllSteps, setShowAllSteps] = useState(false);
  const playbackFrames = useMemo(
    () => selectFrames(frames, options, stage, showAllSteps),
    [frames, options, showAllSteps, stage],
  );
  useEffect(() => {
    setPlaying(false);
    setFrames([]);
    setFrameIndex(0);
    setTraceError('');
    setInspectorOpen(false);
    setStage(options?.stages?.[0]?.id ?? '');
    setShowAllSteps(false);
    if (!problem || !adapter) return;
    const initial = adapter.presets[0]?.input ?? adapter.placeholder;
    setRaw(initial);
    setAppliedInput(initial);
    try {
      setFrames(buildTrace(adapter, problem, initial));
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : 'Could not build the trace.');
    }
  }, [problem, adapter]);
  useEffect(() => {
    if (!playing) return;
    if (frameIndex >= playbackFrames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setFrameIndex((current) => current + 1), speed);
    return () => window.clearTimeout(timer);
  }, [playing, frameIndex, speed, playbackFrames.length]);

  const runTrace = (nextRaw = raw) => {
    if (!adapter || !problem) return;
    setPlaying(false);
    try {
      const replacement = buildTrace(adapter, problem, nextRaw);
      setFrames(replacement);
      setFrameIndex(0);
      if (options?.stages) setStage(options?.stages?.[0]?.id ?? '');
      setAppliedInput(nextRaw);
      setTraceError('');
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : 'Could not build the trace.');
    }
  };
  const stepTo = (index: number) => {
    setPlaying(false);
    setFrameIndex(Math.max(0, Math.min(index, playbackFrames.length - 1)));
  };

  return {
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
  };
}
