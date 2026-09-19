import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { MaximumFishData } from './types';
export function MaximumFishCanvas({ data }: { data: MaximumFishData }) {
  return <TraversalLessonCanvas data={data} />;
}
