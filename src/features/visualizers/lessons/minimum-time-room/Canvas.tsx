import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { MinimumTimeData } from './types';
export function MinimumTimeCanvas({ data }: { data: MinimumTimeData }) {
  return <TraversalLessonCanvas data={data} />;
}
