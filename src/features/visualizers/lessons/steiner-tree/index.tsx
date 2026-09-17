import { defineLesson } from '../../core/lesson';
import { steinerTreeVisualizer } from './adapter';
import { SteinerCanvas } from './Canvas';
import { SteinerInputEditor } from './InputEditor';
export const lesson = defineLesson({
  adapter: steinerTreeVisualizer,
  aliases: ['abc395-g'],
  Canvas: SteinerCanvas,
  InputEditor: SteinerInputEditor,
  playback: {
    stages: [
      { id: 'floyd-warshall', label: '01 / Distance map' },
      { id: 'steiner-dp', label: '02 / Steiner DP' },
    ],
    stageLabel: 'Steiner lesson stage',
    hideTransitions: true,
  },
});
