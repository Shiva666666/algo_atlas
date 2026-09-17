import { defineLesson } from '../../core/lesson';
import { weightedWordMappingVisualizer } from './adapter';
import { WeightedWordMappingCanvas } from './Canvas';
import { WeightedWordInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: weightedWordMappingVisualizer,
  aliases: ['weighted-word-mapping'],
  Canvas: WeightedWordMappingCanvas,
  InputEditor: WeightedWordInputEditor,
});
