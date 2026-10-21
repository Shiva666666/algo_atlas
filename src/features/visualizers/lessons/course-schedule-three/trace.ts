import raw from './reference.py?raw';
import { completeTrace } from '../../core/complete-trace';
import type { Problem } from '../../../../shared/contracts';
import type { CourseData } from './types';
export const referenceCode = raw.trimEnd();
export function parseInput(raw: string): { courses: number[][] } {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    throw Error('Use {"courses":[[duration,deadline],...]} or a bare matrix.');
  }
  const courses = Array.isArray(input) ? input : input?.courses;
  if (!Array.isArray(courses) || courses.length < 1 || courses.length > 12)
    throw Error('Use 1–12 courses for a complete readable trace.');
  if (
    !courses.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 2 &&
        row.every((v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 1 && v <= 10000),
    )
  )
    throw Error(
      'Each course needs exactly two integers, duration and deadline, from 1 through 10,000.',
    );
  return { courses: courses.map((row) => [...row]) };
}
function push(heap: number[], value: number) {
  heap.push(value);
  let i = heap.length - 1;
  while (i) {
    const p = (i - 1) >> 1;
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
function pop(heap: number[]) {
  const result = heap[0],
    last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    let i = 0;
    while (2 * i + 1 < heap.length) {
      let child = 2 * i + 1;
      if (child + 1 < heap.length && heap[child + 1] < heap[child]) child++;
      if (heap[i] <= heap[child]) break;
      [heap[i], heap[child]] = [heap[child], heap[i]];
      i = child;
    }
  }
  return result;
}
export function createFrames(input: unknown, _problem?: Problem, limit = 12000) {
  const { courses } = parseInput(JSON.stringify(input));
  const original = courses.map(([duration, deadline], id) => ({ duration, deadline, id }));
  return completeTrace<CourseData>(
    referenceCode,
    'course-schedule-three',
    () => ({
      original,
      courses: [...original],
      sorted: false,
      index: null,
      heap: null,
      total: null,
      selected: [],
      decisions: original.map(() => 'unread'),
      fit: null,
      shorter: null,
      longest: null,
      proposal: null,
      pending: null,
      removed: null,
      events: [],
      result: null,
      action: '',
      equation: '',
    }),
    (d, emit) => {
      const say = (action: string, eq: string, line: string, message: string, occurrence = 0) =>
        emit(action, eq, line, message, true, 'Deadline scheduling', occurrence);
      d.courses.sort((a, b) => a.deadline - b.deadline);
      d.sorted = true;
      say(
        'sort',
        'Sort by last day',
        'courses.sort(key = lambda x: x[1])',
        'Python sort is stable: tied deadlines retain input order. Course IDs are derived labels, not values stored by the heap.',
      );
      d.heap = [];
      say(
        'heap-init',
        'heap = []',
        'heap = []',
        'A min-heap of negative durations makes the longest selected duration the root.',
      );
      d.total = 0;
      say('total-init', 'total = 0', 'total = 0', 'Start with no scheduled days.');
      for (let index = 0; index < d.courses.length; index++) {
        d.index = index;
        d.fit = null;
        d.shorter = null;
        d.longest = null;
        d.proposal = null;
        d.removed = null;
        d.pending = null;
        const c = d.courses[index];
        d.decisions[c.id] = 'active';
        say(
          'course',
          `Consider C${c.id + 1}: ${c.duration} days, deadline ${c.deadline}`,
          'for dur, lastday in courses:',
          'Deadline order is the scan order, not a prerequisite graph.',
        );
        d.proposal = d.total + c.duration;
        d.fit = c.deadline >= d.proposal;
        say(
          'fit-check',
          `${c.deadline} ≥ ${d.total} + ${c.duration}: ${d.fit}`,
          'if lastday >=  total + dur:',
          'Finishing exactly on the last day is allowed.',
        );
        if (d.fit) {
          d.pending = 'accept';
          d.total += c.duration;
          say(
            'accept-total',
            `total += ${c.duration} → ${d.total}`,
            'total += dur',
            'Total changes first. Heap insertion and the derived schedule commit are still pending.',
          );
          push(d.heap, -c.duration);
          d.selected.push(c.id);
          d.decisions[c.id] = 'kept';
          d.pending = null;
          d.events.push({ id: c.id, outcome: 'accepted', removedId: null, total: d.total });
          say(
            'accept',
            'Keep the course',
            'heapq.heappush(heap, -dur)',
            'The heap now contains the new negative duration. The committed schedule is a derived feasible witness.',
          );
        } else {
          d.longest = d.heap.length ? -d.heap[0] : null;
          d.shorter = d.longest === null ? null : d.longest > c.duration;
          say(
            'replace-check',
            d.longest === null
              ? 'Heap empty · duration comparison not evaluated'
              : `${d.longest} > ${c.duration}: ${d.shorter}`,
            'if heap and -heap[0]>dur:',
            'Only a strictly shorter course replaces the longest. Equal duration does not pass >.',
          );
          if (d.shorter) {
            d.pending = 'replace';
            const negative = pop(d.heap);
            d.removed = -negative;
            d.total += negative;
            const removedId = d.selected.find((id) => d.original[id].duration === d.removed)!;
            say(
              'remove',
              `total += (${negative}) → ${d.total}`,
              'total += heapq.heappop(heap)',
              'The pop and this total assignment are one source statement. The committed witness remains unchanged until replacement finishes.',
            );
            d.total += c.duration;
            say(
              'replace-total',
              `total += ${c.duration} → ${d.total}`,
              'total+=dur',
              'The candidate’s duration is added; heap insertion is still pending.',
            );
            push(d.heap, -c.duration);
            d.selected = d.selected.filter((id) => id !== removedId);
            d.selected.push(c.id);
            d.decisions[removedId] = 'removed';
            d.decisions[c.id] = 'kept';
            d.pending = null;
            d.events.push({ id: c.id, outcome: 'replaced', removedId, total: d.total });
            say(
              'replace',
              'Replace the longest selected duration',
              'heapq.heappush(heap, -dur)',
              'Same count, less total time. With equal durations, witness IDs choose one equivalent course; Python stores durations only.',
              1,
            );
          } else {
            d.decisions[c.id] = 'skipped';
            d.events.push({ id: c.id, outcome: 'skipped', removedId: null, total: d.total });
            say(
              'skip',
              'Skip this course',
              'if heap and -heap[0]>dur:',
              'It does not fit and offers no strictly shorter replacement. Keep the selected set unchanged.',
            );
          }
        }
      }
      d.result = d.heap.length;
      say(
        'return',
        `Return ${d.result} courses`,
        'return len(heap)',
        'The result is the count, not the heap’s physical order or a uniquely chosen set of course IDs.',
      );
    },
    limit,
  );
}
