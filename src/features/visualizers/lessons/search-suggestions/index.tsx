import { defineLesson } from '../../core/lesson';
import { searchSuggestionsVisualizer } from './adapter';
import { TrieSuggestionsCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: searchSuggestionsVisualizer,
  aliases: ['search-suggestions-system', '1268'],
  Canvas: TrieSuggestionsCanvas,
});
