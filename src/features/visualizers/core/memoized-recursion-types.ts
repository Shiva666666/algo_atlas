/** A copied algorithm call state, independent of any rendering implementation. */
export interface MemoCallSnapshot {
  id: number;
  argument: number;
  best: number | null;
  choice: number | null;
  children: Array<{ label: string; target: number; result: number | null }>;
}
