import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { keysRoomsVisualizer } from './adapter';
import { KeysRoomsCanvas } from './Canvas';

const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Rooms"
    fields={[
      {
        key: 'rooms',
        label: 'Keys in each room',
        help: 'Nested arrays such as [[1],[2],[]].',
        rows: 4,
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: keysRoomsVisualizer,
  aliases: ['keys-and-rooms', '841'],
  Canvas: KeysRoomsCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'dequeue', label: 'Next room' },
      { action: 'discover', label: 'Next unlock' },
    ],
  },
});
