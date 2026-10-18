import { NumberArrayInputEditor } from '../../components/NumberArrayInputEditor';
import type { InputEditorProps } from '../../core/lesson';
export const InputEditor = (props: InputEditorProps) => (
  <NumberArrayInputEditor {...props} maximum={12} />
);
