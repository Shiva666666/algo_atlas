import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function GoodStringsInputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Good Strings"
      fields={[
        { key: 'low', label: 'Minimum good length · low', help: 'Integer 1–24.' },
        { key: 'high', label: 'Maximum good length · high', help: 'Integer low–24.' },
        { key: 'zero', label: 'Zeros per appended block', help: 'Integer 1–low.' },
        { key: 'one', label: 'Ones per appended block', help: 'Integer 1–low.' },
      ]}
    />
  );
}
