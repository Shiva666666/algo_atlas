// Conservative textual comparison: preserve indentation and string contents.
// This is not an arbitrary-Python verifier.
export function normalizeCode(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n');
}
