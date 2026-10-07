import { BracketInputEditor } from '../../components/BracketInputEditor';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor(props: InputEditorProps) {
  return <BracketInputEditor {...props} help="2–32 balanced parentheses." />;
}
