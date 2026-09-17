export interface PalindromeFrameData {
  s: string;
  palindrome: Array<Array<boolean | null>>;
  cuts: Array<number | null>;
  activeStart: number | null;
  activeEnd: number | null;
  highlightStart: number | null;
  highlightEnd: number | null;
  accepted: boolean | null;
  candidate: number | null;
}

export type PalindromeInput = { s: string };
