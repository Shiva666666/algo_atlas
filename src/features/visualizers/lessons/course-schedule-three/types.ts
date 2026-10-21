export interface Course {
  id: number;
  duration: number;
  deadline: number;
}
export interface CourseData {
  original: Course[];
  courses: Course[];
  sorted: boolean;
  index: number | null;
  heap: number[] | null;
  total: number | null;
  selected: number[];
  decisions: Array<'unread' | 'active' | 'kept' | 'removed' | 'skipped'>;
  fit: boolean | null;
  shorter: boolean | null;
  longest: number | null;
  proposal: number | null;
  pending: 'accept' | 'replace' | null;
  removed: number | null;
  events: Array<{
    id: number;
    outcome: 'accepted' | 'replaced' | 'skipped';
    removedId: number | null;
    total: number;
  }>;
  result: number | null;
  action: string;
  equation: string;
}
