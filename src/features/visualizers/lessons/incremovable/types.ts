import type { InsightModel, RuleFocus } from '../../core/types';

export interface IncremovableFrameData {
  nums: number[];
  prefixEnd: number;
  suffixStart: number;
  suffixPointer?: number;
  comparison?: {
    left: number;
    right: number;
    kind: 'prefix' | 'bridge' | 'suffix';
    valid: boolean;
  };
  activeIndex: number | null;
  answer: number;
  added: number;
  bridgeValid: boolean | null;
  allIncreasing: boolean;
  action: string;
  insights: InsightModel;
  rules: RuleFocus[];
}

export type IncremovableInput = { nums: number[] };
