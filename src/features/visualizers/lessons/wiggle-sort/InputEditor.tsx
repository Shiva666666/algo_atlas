import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Wiggle sort"
      fields={[
        {
          key: 'nums',
          label: 'Input array · nums',
          help: 'Paste 1–12 integers, 0–5000, with a valid strict wiggle arrangement.',
          rows: 3,
        },
      ]}
    />
  );
}
