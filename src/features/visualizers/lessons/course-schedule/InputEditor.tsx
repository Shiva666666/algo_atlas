import { StructuredTraversalInputEditor } from '../../components/TraversalPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function CourseInputEditor(props: InputEditorProps) {
  return (
    <StructuredTraversalInputEditor
      {...props}
      label="Course Schedule"
      fields={[
        { key: 'numCourses', label: 'Number of courses', help: 'Integer 1–12.' },
        {
          key: 'prerequisites',
          label: '[course, prerequisite] pairs',
          help: 'Unique valid course IDs, no self-edges.',
          rows: 4,
        },
      ]}
    />
  );
}
