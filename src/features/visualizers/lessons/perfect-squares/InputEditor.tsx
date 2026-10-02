import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function SquaresInputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Perfect Squares"
      fields={[
        {
          key: 'n',
          label: 'Target n',
          help: 'Integer 1–40. Complete bounded recursion, without truncation.',
        },
      ]}
    />
  );
}
