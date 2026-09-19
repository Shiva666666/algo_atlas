import type { MistakeCheckpoint, VisualFrame } from './types';

export function parseObject(raw: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Enter valid JSON before building steps.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Enter a JSON object with the named input fields.');
  return value as Record<string, unknown>;
}

export function addFrame<T>(
  frames: VisualFrame<T>[],
  code: string,
  kind: string,
  data: T,
  phase: string,
  title: string,
  message: string,
  snippet: string,
  options: { traceRole?: 'checkpoint' | 'transition'; mistakeCheckpoint?: MistakeCheckpoint } = {},
) {
  const line = code.split('\n').findIndex((item) => item.trim() === snippet.trim());
  if (line < 0) throw new Error(`Missing reference line: ${snippet}`);
  frames.push({
    kind,
    phase,
    title,
    message,
    data: structuredClone(data),
    codeFocus: [snippet],
    codeLines: [line + 1],
    ...options,
  });
}

export function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max)
    throw new Error(`${label} must be an integer from ${min} to ${max}.`);
  return Number(value);
}

export function rectangularGrid(
  value: unknown,
  label: string,
  maxRows: number,
  maxColumns: number,
  cell: (value: unknown) => boolean,
): number[][] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxRows)
    throw new Error(`${label} must contain 1–${maxRows} rows.`);
  const columns = Array.isArray(value[0]) ? value[0].length : 0;
  if (columns < 1 || columns > maxColumns)
    throw new Error(`${label} must contain 1–${maxColumns} columns.`);
  if (
    !value.every(
      (row) => Array.isArray(row) && row.length === columns && row.every((entry) => cell(entry)),
    )
  )
    throw new Error(`${label} must be rectangular and contain only supported numeric values.`);
  return value.map((row) => [...(row as number[])]);
}
