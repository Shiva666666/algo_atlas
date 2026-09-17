import type { ComponentType } from 'react';
import type { Problem } from '../../../shared/contracts';
import type { VisualFrame, VisualizerAdapter } from './types';

export interface InputEditorProps {
  raw: string;
  onChange: (raw: string) => void;
}
export interface JumpControl {
  label: string;
  action?: string;
  nextPhase?: boolean;
  title?: string;
  className?: string;
}
export interface PlaybackOptions {
  stages?: Array<{ id: string; label: string }>;
  stageLabel?: string;
  hideTransitions?: boolean;
  jumpsBeforeSpeed?: JumpControl[];
  jumpsAfterSpeed?: JumpControl[];
}
export interface Lesson {
  adapter: VisualizerAdapter;
  aliases: string[];
  source?: string;
  Canvas: ComponentType<{ frame: VisualFrame; problem: Problem }>;
  InputEditor?: ComponentType<InputEditorProps>;
  playback?: PlaybackOptions;
}

/** Bind each typed trace producer to its matching renderer at one boundary. */
export function defineLesson<D>(options: {
  adapter: VisualizerAdapter<unknown, D>;
  aliases: string[];
  source?: string;
  Canvas: ComponentType<{ data: D; problem: Problem }>;
  InputEditor?: ComponentType<InputEditorProps>;
  playback?: PlaybackOptions;
  preservePresentation?: boolean;
}): Lesson {
  const { Canvas, adapter, preservePresentation, ...rest } = options;
  return {
    ...rest,
    adapter: preservePresentation ? adapter : { ...adapter, presentation: 'diagram-first' },
    Canvas: ({ frame, problem }) => <Canvas data={frame.data as D} problem={problem} />,
  };
}

export function buildTrace(adapter: VisualizerAdapter, problem: Problem, raw: string) {
  const frames = adapter.createFrames(adapter.parseInput(raw), problem);
  if (!frames.length) throw new Error('This input did not create any steps.');
  return frames;
}
export function selectFrames(
  frames: VisualFrame[],
  options: PlaybackOptions | undefined,
  stage: string,
  showAll: boolean,
) {
  let result = frames;
  if (options?.hideTransitions && !showAll)
    result = result.filter((frame) => frame.traceRole !== 'transition');
  if (options?.stages)
    result = result.filter((frame) => (frame.data as { stage?: string }).stage === stage);
  return result;
}
export function nextJump(frames: VisualFrame[], index: number, jump: JumpControl) {
  return frames.findIndex(
    (frame, i) =>
      i > index &&
      (jump.nextPhase
        ? frame.phase !== frames[index]?.phase
        : (frame.data as { action?: string }).action === jump.action),
  );
}
