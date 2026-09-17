import { defineLesson } from '../../core/lesson';
import { bipartiteVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: bipartiteVisualizer,
  aliases: ['is-graph-bipartite'],
  Canvas: IntuitionCanvas,
});
