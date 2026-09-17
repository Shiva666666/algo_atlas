import { defineLesson } from '../../core/lesson';
import { hexadecimalVisualizer } from './adapter';
import { HexadecimalCanvas } from './Canvas';
export const lesson = defineLesson({
  adapter: hexadecimalVisualizer,
  aliases: ['convert-a-number-to-hexadecimal'],
  Canvas: HexadecimalCanvas,
  preservePresentation: true,
});
