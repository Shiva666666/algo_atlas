export interface CourseInput {
  numCourses: number;
  prerequisites: Array<[number, number]>;
}
export interface CourseData extends CourseInput {
  edges: Array<[number, number]>;
  indegree: number[];
  queue: number[];
  order: number[];
  active: number | null;
  inspected: [number, number] | null;
  action: string;
  equation: string;
  result: number[] | null;
  blocked: number[];
}
