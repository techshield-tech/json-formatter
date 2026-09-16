// Pure, framework-free JSON formatting logic. Tool-specific.

export type IndentOption = '2' | '4' | 'tab';

export interface FormatOptions {
  indent: IndentOption;
  sortKeys: boolean;
}

export interface MinifyOptions {
  sortKeys: boolean;
}

function indentFor(option: IndentOption): string | number {
  if (option === 'tab') return '\t';
  if (option === '4') return 4;
  return 2;
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sortedEntries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of sortedEntries) {
      result[key] = sortKeysDeep(entryValue);
    }
    return result;
  }
  return value;
}

/** Parses `input` as JSON and returns it pretty-printed. Throws SyntaxError on invalid input. */
export function formatJson(input: string, options: FormatOptions): string {
  const parsed: unknown = JSON.parse(input);
  const value = options.sortKeys ? sortKeysDeep(parsed) : parsed;
  return JSON.stringify(value, null, indentFor(options.indent));
}

/** Parses `input` as JSON and returns it minified. Throws SyntaxError on invalid input. */
export function minifyJson(input: string, options: MinifyOptions): string {
  const parsed: unknown = JSON.parse(input);
  const value = options.sortKeys ? sortKeysDeep(parsed) : parsed;
  return JSON.stringify(value);
}
