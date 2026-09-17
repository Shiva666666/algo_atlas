import type { InsightModel, RuleFocus } from '../../core/types';

export interface MonotonicWindowFrameData {
  nums: number[];
  limit: number;
  left: number;
  right: number;
  minDeque: number[];
  maxDeque: number[];
  best: number;
  bestRange: [number, number] | null;
  activeIndex: number | null;
  valid: boolean | null;
  action: string;
  insights: InsightModel;
  rules: RuleFocus[];
}

export type WindowInput = { nums: number[]; limit: number };
