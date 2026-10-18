export interface OrCall {
  id: number;
  pos: number;
  or: number;
  via: 'root' | 'take' | 'skip';
  chosen: number[];
  take: number | null;
  skip: number | null;
  returned: number | null;
}
export interface OrMemo {
  pos: number;
  or: number;
  count: number;
}
export interface OrData {
  action: string;
  equation: string;
  nums: number[];
  maxOr: number;
  targetReady: boolean;
  scan: number | null;
  calls: OrCall[];
  memo: OrMemo[];
  memoKey: [number, number] | null;
  cacheHit: boolean | null;
  bit: { old: number; value: number; next: number } | null;
  returned: number | null;
  result: number | null;
}
