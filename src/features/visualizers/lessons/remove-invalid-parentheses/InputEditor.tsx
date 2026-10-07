import { BracketInputEditor } from '../../components/BracketInputEditor';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor(props: InputEditorProps) {
  return (
    <BracketInputEditor
      {...props}
      help="1–12 lowercase letters and parentheses; complete traces up to 12,000 steps. Letters are never removed."
    />
  );
}
