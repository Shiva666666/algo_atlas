export interface HexadecimalData {
  original: number;
  working: number | null;
  result: string;
  nibble: number | null;
  digit: string | null;
  action: 'start' | 'zero' | 'mask' | 'lookup' | 'extract' | 'prepend' | 'shift' | 'complete';
}
