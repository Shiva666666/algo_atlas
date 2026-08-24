import type {Problem} from '../types';
import {createGenericVisualizer} from './generic';
import {palindromePartitioningVisualizer} from './palindromePartitioning';
import type {VisualizerAdapter} from './types';

const specialized:Record<string,VisualizerAdapter>={
  'palindrome-partitioning-ii':palindromePartitioningVisualizer,
};

export function getVisualizer(problem:Problem):VisualizerAdapter{
  return specialized[problem.source_key]??createGenericVisualizer(problem);
}
