export type Cell = [number, number];
export interface IslandCall {
  id: number;
  parentId: number | null;
  cell: Cell;
  localArea: number | null;
  direction: number | null;
}
export interface IslandData {
  grid: number[][];
  scan: Cell | null;
  seen: string[];
  stack: IslandCall[];
  active: Cell | null;
  action: string;
  neighbor: {
    cell: Cell;
    direction: number;
    rowInBounds: boolean | null;
    columnInBounds: boolean | null;
    unseen: boolean | null;
    passes: boolean | null;
  } | null;
  returned: { callId: number; cell: Cell; value: number; parentId: number | null } | null;
  addition: { parentId: number; old: number; child: number; total: number } | null;
  islands: Array<{ id: number; root: Cell; area: number; cells: string[] }>;
  islandId: number;
  currentCells: string[];
  maxArea: number;
  result: number | null;
}
