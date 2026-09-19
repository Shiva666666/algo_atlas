import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { maximumFishVisualizer } from './adapter';
import { MaximumFishCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Fish grid"
    fields={[
      {
        key: 'grid',
        label: 'Fish values',
        help: 'Rectangular nonnegative grid, at most 10×10.',
        rows: 5,
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: maximumFishVisualizer,
  aliases: ['maximum-number-of-fish-in-a-grid', '2658'],
  Canvas: MaximumFishCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'enter', label: 'Next DFS call' },
      { action: 'pond-complete', label: 'Next pond' },
    ],
  },
});
