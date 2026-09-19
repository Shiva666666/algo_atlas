import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { findCityVisualizer } from './adapter';
import { FindCityCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="City graph"
    fields={[
      { key: 'n', label: 'City count', help: 'Integer from 2 through 7.' },
      { key: 'edges', label: 'Weighted edges', help: 'Triples [u, v, weight].', rows: 4 },
      {
        key: 'distanceThreshold',
        label: 'Threshold',
        help: 'Distances equal to the threshold qualify.',
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: findCityVisualizer,
  aliases: ['find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', '1334'],
  Canvas: FindCityCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'layer', label: 'Next k layer' },
      { action: 'rank', label: 'Next city' },
    ],
  },
});
