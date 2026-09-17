import { defineLesson } from '../../core/lesson';
import { verticesVisualizer } from './adapter';
import { VerticesLesson } from './Canvas';
import type { LessonFrameData, LessonValue } from './types';
const Canvas = ({ data }: { data: LessonFrameData }) => <VerticesLesson v={data.value} />;
export const lesson = defineLesson({
  adapter: verticesVisualizer,
  aliases: ['minimum-number-of-vertices-to-reach-all-nodes', '1557'],
  Canvas: Canvas,
});
