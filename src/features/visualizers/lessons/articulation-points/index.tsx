import { defineLesson } from '../../core/lesson';
import { articulationVisualizer } from './adapter';
import { ArticulationLesson } from './Canvas';
import type { LessonFrameData, LessonValue } from './types';
const Canvas = ({ data }: { data: LessonFrameData }) => <ArticulationLesson v={data.value} />;
export const lesson = defineLesson({
  adapter: articulationVisualizer,
  aliases: ['articulation-point2616'],
  Canvas: Canvas,
});
