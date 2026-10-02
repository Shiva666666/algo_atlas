import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function TriangleInputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Triangle"
      fields={[
        {
          key: 'triangle',
          label: 'Triangle rows',
          help: '1–8 rows; row r has r+1 integers between −10,000 and 10,000.',
          rows: 4,
        },
      ]}
    />
  );
}
