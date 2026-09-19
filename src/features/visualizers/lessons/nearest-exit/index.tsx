import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { nearestExitVisualizer } from './adapter';
import { NearestExitCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Maze"
    fields={[
      { key: 'maze', label: 'Maze rows', help: 'Strings containing + and . only.', rows: 4 },
      { key: 'entrance', label: 'Entrance', help: 'An open [row, column] coordinate.' },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: nearestExitVisualizer,
  aliases: ['nearest-exit-from-entrance-in-maze', '1926'],
  Canvas: NearestExitCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'dequeue', label: 'Next cell' },
      { action: 'enqueue', label: 'Next discovery' },
    ],
  },
});
