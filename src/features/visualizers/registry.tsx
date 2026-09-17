import type { Problem } from '../../shared/contracts';
import { defineLesson, type Lesson } from './core/lesson';
import { createGenericVisualizer } from './lessons/generic/adapter';
import { GenericCanvas } from './lessons/generic/Canvas';
import type { GenericFrameData } from './core/types';
import { lesson as bipartiteLesson } from './lessons/bipartite';
import { lesson as kokoLesson } from './lessons/koko';
import { lesson as specialArrayLesson } from './lessons/special-array';
import { lesson as fallingPathLesson } from './lessons/falling-path';
import { lesson as ipoLesson } from './lessons/ipo';
import { lesson as incremovableLesson } from './lessons/incremovable';
import { lesson as nQueensLesson } from './lessons/n-queens';
import { lesson as coinChangeLesson } from './lessons/coin-change';
import { lesson as hexadecimalLesson } from './lessons/hexadecimal';
import { lesson as monotonicWindowLesson } from './lessons/monotonic-window';
import { lesson as palindromePartitioningLesson } from './lessons/palindrome-partitioning';
import { lesson as steinerTreeLesson } from './lessons/steiner-tree';
import { lesson as subsetsLesson } from './lessons/subsets';
import { lesson as ticketToRideLesson } from './lessons/ticket-to-ride';
import { lesson as maximalSquareLesson } from './lessons/maximal-square';
import { lesson as searchSuggestionsLesson } from './lessons/search-suggestions';
import { lesson as uniqueSplitLesson } from './lessons/unique-split';
import { lesson as generateParenthesesLesson } from './lessons/generate-parentheses';
import { lesson as weightedWordMappingLesson } from './lessons/weighted-word-mapping';
import { lesson as matchsticksSquareLesson } from './lessons/matchsticks-square';
import { lesson as removeKDigitsLesson } from './lessons/remove-k-digits';
import { lesson as repeatedSubstringLesson } from './lessons/repeated-substring';
import { lesson as maxAreaIslandLesson } from './lessons/max-area-island';
import { lesson as articulationPointsLesson } from './lessons/articulation-points';
import { lesson as uniqueConcatenationLesson } from './lessons/unique-concatenation';
import { lesson as minimumVerticesLesson } from './lessons/minimum-vertices';
import { lesson as polygonTriangulationLesson } from './lessons/polygon-triangulation';
export const lessons: Lesson[] = [
  bipartiteLesson,
  kokoLesson,
  specialArrayLesson,
  fallingPathLesson,
  ipoLesson,
  incremovableLesson,
  nQueensLesson,
  coinChangeLesson,
  hexadecimalLesson,
  monotonicWindowLesson,
  palindromePartitioningLesson,
  steinerTreeLesson,
  subsetsLesson,
  ticketToRideLesson,
  maximalSquareLesson,
  searchSuggestionsLesson,
  uniqueSplitLesson,
  generateParenthesesLesson,
  weightedWordMappingLesson,
  matchsticksSquareLesson,
  removeKDigitsLesson,
  repeatedSubstringLesson,
  maxAreaIslandLesson,
  articulationPointsLesson,
  uniqueConcatenationLesson,
  minimumVerticesLesson,
  polygonTriangulationLesson,
];
const byKey = new Map<string, Lesson>();
for (const lesson of lessons)
  for (const alias of lesson.aliases) {
    const key = (lesson.source ?? '*') + ':' + alias;
    if (byKey.has(key)) throw new Error('Duplicate lesson identity: ' + key);
    byKey.set(key, lesson);
  }
const FallbackCanvas = ({ data, problem }: { data: GenericFrameData; problem: Problem }) => (
  <GenericCanvas data={data} approach={problem.notes?.approach ?? []} />
);
export function getLesson(problem: Problem): Lesson {
  return (
    byKey.get(problem.source.toLowerCase() + ':' + problem.source_key) ??
    byKey.get('*:' + problem.source_key) ??
    defineLesson({ adapter: createGenericVisualizer(problem), aliases: [], Canvas: FallbackCanvas })
  );
}
export function getVisualizer(problem: Problem) {
  return getLesson(problem).adapter;
}
