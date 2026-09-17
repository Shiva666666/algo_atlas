import { defineLesson } from '../../core/lesson';
import { repeatedSubstringVisualizer } from './adapter';
import { RepeatedSubstringCanvas } from './Canvas';
import { StructuredInputEditor } from '../../components/StructuredInputEditor';
import type { InputEditorProps } from '../../core/lesson';
const InputEditor = (props: InputEditorProps) => (
  <StructuredInputEditor kind="prefix-string" {...props} />
);
export const lesson = defineLesson({
  adapter: repeatedSubstringVisualizer,
  aliases: ['repeated-substring-pattern', '459'],
  Canvas: RepeatedSubstringCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'candidate', label: 'Next candidate' },
      { action: 'comparison', label: 'Next comparison' },
    ],
  },
});
