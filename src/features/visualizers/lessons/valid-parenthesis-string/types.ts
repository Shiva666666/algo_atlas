export interface WildcardData {
  s: string;
  index: number;
  openings: number[];
  stars: number[];
  roles: Array<{ index: number; role: 'pending' | 'opening' | 'closing' | 'empty' }>;
  consumed: Array<{ resource: number; close: number }>;
  pair: { open: number; star: number } | null;
  result: boolean | null;
  action: string;
  equation: string;
}
