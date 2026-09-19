import { defineLesson, type InputEditorProps } from '../../core/lesson';
import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import { completeComponentsVisualizer } from './adapter';
import { CompleteComponentsCanvas } from './Canvas';
const InputEditor = (props: InputEditorProps) => (
  <StructuredTraversalInputEditor
    {...props}
    label="Complete components"
    fields={[
      { key: 'n', label: 'Vertex count', help: 'An integer from 1 to 10.' },
      {
        key: 'edges',
        label: 'Undirected edges',
        help: 'Unique pairs such as [[0,1],[1,2]].',
        rows: 4,
      },
    ]}
  />
);
export const lesson = defineLesson({
  adapter: completeComponentsVisualizer,
  aliases: ['count-the-number-of-complete-components', '2685'],
  Canvas: CompleteComponentsCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'component-start', label: 'Next component' },
      { action: 'degree-audit', label: 'Next degree' },
    ],
  },
});
