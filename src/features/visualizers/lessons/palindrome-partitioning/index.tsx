import { defineLesson } from '../../core/lesson';
import { palindromePartitioningVisualizer } from './adapter';
import { PalindromeCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: palindromePartitioningVisualizer,
  aliases: ['palindrome-partitioning-ii'],
  Canvas: PalindromeCanvas,
});
