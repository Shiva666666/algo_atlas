import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { FarmlandData } from './types';
export function FarmlandCanvas({ data }: { data: FarmlandData }) {
  return <TraversalLessonCanvas data={data} />;
}
