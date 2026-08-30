import type {Problem} from '../types';
import {bipartiteVisualizer} from './bipartite';
import {kokoVisualizer,specialArrayVisualizer} from './binarySearch';
import {fallingPathVisualizer} from './fallingPath';
import {createGenericVisualizer} from './generic';
import {ipoVisualizer} from './ipo';
import {incremovableVisualizer} from './incremovable';
import {nQueensVisualizer} from './nQueens';
import {coinChangeVisualizer} from './coinChange';
import {hexadecimalVisualizer} from './hexadecimal';
import {monotonicWindowVisualizer} from './monotonicWindow';
import {palindromePartitioningVisualizer} from './palindromePartitioning';
import {steinerTreeVisualizer} from './steinerTree';
import {subsetsVisualizer} from './subsets';
import {ticketToRideVisualizer} from './ticketToRide';
import type {VisualizerAdapter} from './types';

const specialized:Record<string,VisualizerAdapter>={
  'palindrome-partitioning-ii':palindromePartitioningVisualizer,
  'abc395-g':steinerTreeVisualizer,
  'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit':monotonicWindowVisualizer,
  'koko-eating-bananas':kokoVisualizer,
  'special-array-with-x-elements-greater-than-or-equal-x':specialArrayVisualizer,
  'minimum-falling-path-sum':fallingPathVisualizer,
  'is-graph-bipartite':bipartiteVisualizer,
  'subsets-ii':subsetsVisualizer,
  'ipo':ipoVisualizer,
  'ticket-to-ride':ticketToRideVisualizer,
  'count-the-number-of-incremovable-subarrays-i':incremovableVisualizer,
  'coin-change-ii':coinChangeVisualizer,
  'convert-a-number-to-hexadecimal':hexadecimalVisualizer,
};

export function getVisualizer(problem:Problem):VisualizerAdapter{
  if(problem.source.toLowerCase()==='lintcode'&&problem.source_key==='33')return nQueensVisualizer;
  return specialized[problem.source_key]??createGenericVisualizer(problem);
}
