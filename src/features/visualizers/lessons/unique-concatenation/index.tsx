import { defineLesson } from '../../core/lesson';
import { uniqueVisualizer } from './adapter';
import { UniqueLesson } from './Canvas';
import type { LessonFrameData, LessonValue } from './types';
const Canvas = ({ data }: { data: LessonFrameData }) => <UniqueLesson v={data.value} />;
export const lesson = defineLesson({
  adapter: uniqueVisualizer,
  aliases: ['maximum-length-of-a-concatenated-string-with-unique-characters', '1239'],
  Canvas: Canvas,
});
