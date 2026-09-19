import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { farmlandVisualizer } from './adapter';
import { FarmlandCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Farmland"
    fields={[
      {
        key: 'land',
        label: 'Land grid',
        help: 'A rectangular matrix containing 0 and 1.',
        rows: 5,
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: farmlandVisualizer,
  aliases: ['find-all-groups-of-farmland', '1992'],
  Canvas: FarmlandCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'component-start', label: 'Next group' },
      { action: 'bounds', label: 'Next bound' },
    ],
  },
});
