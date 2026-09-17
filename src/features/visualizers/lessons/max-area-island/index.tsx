import { defineLesson } from '../../core/lesson';
import { maxAreaIslandVisualizer } from './adapter';
import { IslandCanvas } from './Canvas';
import { StructuredInputEditor } from '../../components/StructuredInputEditor';
import type { InputEditorProps } from '../../core/lesson';
import { parseIslandInput } from './adapter';
const InputEditor = (props: InputEditorProps) => (
  <StructuredInputEditor kind="island-grid" parseGrid={parseIslandInput} {...props} />
);
export const lesson = defineLesson({
  adapter: maxAreaIslandVisualizer,
  aliases: ['max-area-of-island', '695'],
  Canvas: IslandCanvas,
  InputEditor,
  playback: {
    jumpsAfterSpeed: [
      { action: 'island-start', label: 'Next island' },
      { action: 'return', label: 'Next return' },
    ],
  },
});
