import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function DepthInputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Expression"
      fields={[
        {
          key: 's',
          label: 'Expression string',
          help: 'A quoted string, 1–64 characters; digits, arithmetic operators and balanced parentheses.',
        },
      ]}
    />
  );
}
