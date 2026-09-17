import { defineLesson } from '../../core/lesson';
import { triangulationVisualizer } from './adapter';
import { TriangulationLesson } from './Canvas';
import type { LessonFrameData, LessonValue } from './types';
const Canvas = ({ data }: { data: LessonFrameData }) => <TriangulationLesson v={data.value} />;
export const lesson = defineLesson({
  adapter: triangulationVisualizer,
  aliases: ['minimum-score-triangulation-of-polygon', '1039'],
  Canvas: Canvas,
});
