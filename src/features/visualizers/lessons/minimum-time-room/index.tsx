import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { minimumTimeVisualizer } from './adapter';
import { MinimumTimeCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Room times"
    fields={[
      {
        key: 'moveTime',
        label: 'Earliest entry times',
        help: 'Rectangular nonnegative grid, at most 8×8.',
        rows: 5,
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: minimumTimeVisualizer,
  aliases: ['minimum-time-to-reach-last-room-ii', '3342'],
  Canvas: MinimumTimeCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'pop', label: 'Next heap pop' },
      { action: 'relax', label: 'Next relaxation' },
    ],
  },
});
