import source from './reference.py?raw';
import { addFrame, integer, parseObject } from '../../core/trace';
import type { VisualFrame } from '../../core/types';
import type { CourseData, CourseInput } from './types';
export const courseCode = source.trimEnd();
export function parseCourseInput(raw: string): CourseInput {
  const p = parseObject(raw),
    numCourses = integer(p.numCourses, 'numCourses', 1, 12);
  if (!Array.isArray(p.prerequisites))
    throw new Error('prerequisites must be an array of [course, prerequisite] pairs.');
  if (p.prerequisites.length > numCourses * (numCourses - 1))
    throw new Error('Too many unique prerequisite pairs.');
  const seen = new Set<string>();
  const prerequisites: Array<[number, number]> = p.prerequisites.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2)
      throw new Error('Every prerequisite needs exactly two course IDs.');
    const a = integer(pair[0], 'Course', 0, numCourses - 1),
      b = integer(pair[1], 'Prerequisite', 0, numCourses - 1),
      key = `${a},${b}`;
    if (a === b) throw new Error('Self-prerequisites are outside this teaching contract.');
    if (seen.has(key)) throw new Error('Prerequisite pairs must be unique.');
    seen.add(key);
    return [a, b];
  });
  return { numCourses, prerequisites };
}
export function createCourseFrames(value: unknown): VisualFrame<CourseData>[] {
  const input = parseCourseInput(JSON.stringify(value)),
    { numCourses, prerequisites } = input;
  const frames: VisualFrame<CourseData>[] = [],
    indegree = Array(numCourses).fill(0),
    queue: number[] = [],
    order: number[] = [],
    edges: Array<[number, number]> = [],
    adj: number[][] = Array.from({ length: numCourses }, () => []);
  let active: number | null = null,
    inspected: [number, number] | null = null,
    result: number[] | null = null,
    blocked: number[] = [];
  const emit = (
    action: string,
    title: string,
    equation: string,
    line: string,
    message = equation,
  ) =>
    addFrame(
      frames,
      courseCode,
      'course-schedule',
      {
        ...input,
        edges,
        indegree,
        queue,
        order,
        active,
        inspected,
        action,
        equation,
        result,
        blocked,
      },
      'TOPOLOGICAL ORDER',
      title,
      message,
      line,
    );
  emit(
    'initialize',
    'Initialize indegrees, FIFO queue and output',
    'All indegrees start at 0.',
    'indegree = [0]*numCourses',
  );
  for (const [a, b] of prerequisites) {
    active = a;
    inspected = [b, a];
    indegree[a]++;
    emit(
      'build-degree',
      'Count a prerequisite',
      `indegree[${a}] = ${indegree[a]}`,
      'indegree[a] += 1',
    );
    adj[b].push(a);
    edges.push([b, a]);
    emit(
      'build-edge',
      'Direct the edge from prerequisite to course',
      `${b} → ${a}`,
      'adj_list[b].append(a)',
    );
  }
  active = null;
  inspected = null;
  emit(
    'early-guard',
    'Check whether any course can start',
    `0 not in indegree: ${!indegree.includes(0)}`,
    'if 0 not in set(indegree):',
  );
  if (!indegree.includes(0)) {
    result = [];
    blocked = Array.from({ length: numCourses }, (_, i) => i);
    emit(
      'result',
      'No initial zero-indegree course',
      'return []',
      'return []',
      'The graph cannot be completed. Blocked does not mean every course itself belongs to a cycle.',
    );
    return frames;
  }
  for (let i = 0; i < numCourses; i++) {
    active = i;
    emit(
      'zero-guard',
      'Inspect an initial indegree',
      `indegree[${i}] == 0: ${indegree[i] === 0}`,
      'if indegree[i] == 0:',
    );
    if (indegree[i] === 0) {
      queue.push(i);
      emit('enqueue', 'Append an initially ready course', `queue.append(${i})`, 'queue.append(i)');
    }
  }
  while (queue.length) {
    active = queue.shift()!;
    inspected = null;
    emit(
      'dequeue',
      'Remove the oldest ready course',
      `queue.popleft() = ${active}`,
      'node = queue.popleft()',
    );
    order.push(active);
    emit('append', 'Record the processed course', `res.append(${active})`, 'res.append(node)');
    for (const nxt of adj[active]) {
      inspected = [active, nxt];
      emit(
        'inspect',
        'Inspect one outgoing edge',
        `${active} → ${nxt}: indegree ${indegree[nxt]}`,
        'for nxt in adj_list[node]:',
      );
      const old = indegree[nxt];
      indegree[nxt]--;
      emit(
        'decrement',
        'Remove this processed prerequisite',
        `indegree[${nxt}]: ${old} − 1 = ${indegree[nxt]}`,
        'indegree[nxt] -= 1',
      );
      emit(
        'zero-guard',
        'Enqueue only when the indegree reaches zero',
        `indegree[${nxt}] == 0: ${indegree[nxt] === 0}`,
        'if indegree[nxt] == 0:',
      );
      if (indegree[nxt] === 0) {
        queue.push(nxt);
        emit(
          'enqueue',
          'Append the newly ready course',
          `queue.append(${nxt})`,
          'queue.append(nxt)',
        );
      }
    }
  }
  active = null;
  inspected = null;
  blocked = Array.from({ length: numCourses }, (_, i) => i).filter((i) => !order.includes(i));
  result = order.length === numCourses ? [...order] : [];
  emit(
    'result',
    blocked.length ? 'Partial processing is not a full schedule' : 'All courses were processed',
    `${order.length} == ${numCourses}: ${order.length === numCourses}; return [${result.join(', ')}]`,
    'return res if len(res) == numCourses else []',
    blocked.length
      ? 'The queue ran dry with unprocessed courses. This includes cycles and courses depending on them; do not call all blocked courses cycle members.'
      : 'Every prerequisite occurs earlier in the recorded order. Other valid orders may exist.',
  );
  return frames;
}
