import type {Problem} from '../types';
import {bipartiteVisualizer} from './bipartite';
import {kokoVisualizer,specialArrayVisualizer} from './binarySearch';
import {fallingPathVisualizer} from './fallingPath';
import {createGenericVisualizer} from './generic';
import {ipoVisualizer} from './ipo';
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
};

export function getVisualizer(problem:Problem):VisualizerAdapter{
  return specialized[problem.source_key]??createGenericVisualizer(problem);
}
