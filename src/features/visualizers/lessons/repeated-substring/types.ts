export interface RepeatedData {
  s: string;
  n: number;
  length: number | null;
  remainder: number | null;
  copies: number | null;
  prefix: string;
  built: string;
  candidates: Array<{
    length: number;
    status: 'untested' | 'testing' | 'non-divisor' | 'mismatch' | 'successful';
  }>;
  mismatches: number[];
  comparison: boolean | null;
  result: boolean | null;
  action: string;
}
