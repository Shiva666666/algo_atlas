import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { CompleteComponentsData } from './types';
export function CompleteComponentsCanvas({ data }: { data: CompleteComponentsData }) {
  return <TraversalLessonCanvas data={data} />;
}
