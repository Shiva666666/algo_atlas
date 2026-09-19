import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { NearestExitData } from './types';
export function NearestExitCanvas({ data }: { data: NearestExitData }) {
  return <TraversalLessonCanvas data={data} />;
}
