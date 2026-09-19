import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { FindCityData } from './types';
export function FindCityCanvas({ data }: { data: FindCityData }) {
  return <TraversalLessonCanvas data={data} />;
}
