import { defineLesson } from '../../core/lesson';
import { ticketToRideVisualizer } from './adapter';
import { IntuitionCanvas } from '../../components/IntuitionCanvas';
export const lesson = defineLesson({
  adapter: ticketToRideVisualizer,
  aliases: ['ticket-to-ride'],
  Canvas: IntuitionCanvas,
});
