/** Derived proof only: the reference algorithm does not build these cycles. */
export function permutationCycles(original: number[], target: number[]): number[][] {
  const destination = new Map(target.map((value, index) => [value, index]));
  const seen = new Set<number>();
  const cycles: number[][] = [];
  for (let start = 0; start < original.length; start++) {
    if (seen.has(start)) continue;
    const cycle: number[] = [];
    let next = start;
    while (!seen.has(next)) {
      seen.add(next);
      cycle.push(next);
      next = destination.get(original[next])!;
    }
    cycles.push(cycle);
  }
  return cycles;
}
