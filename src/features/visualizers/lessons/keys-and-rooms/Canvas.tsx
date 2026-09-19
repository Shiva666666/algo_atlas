import { TraversalLessonCanvas } from '../../components/TraversalPrimitives';
import type { KeysRoomsData } from './types';

export function KeysRoomsCanvas({ data }: { data: KeysRoomsData }) {
  return <TraversalLessonCanvas data={data} />;
}
