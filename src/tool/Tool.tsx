import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, CopyButton, ErrorBox, Panel, Select, TextArea, Toolbar } from '../shell/ui';
import { describeJsonError, formatJsonErrorInfo } from './json-error';
import { SAMPLE_JSON } from './sample';
import { formatJson, minifyJson, type IndentOption } from './json-transform';

// Above this size, formatting only happens on an explicit action (button
// click or Ctrl/Cmd+Enter) — never on a debounce timer — so we don't
// re-parse/re-stringify large documents on every keystroke.
const AUTO_FORMAT_MAX_BYTES = 200 * 1024;
const DEBOUNCE_MS = 300;

const INDENT_OPTIONS: { value: IndentOption; label: string }[] = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
];

function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<IndentOption>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const inputBytes = useMemo(() => byteSize(input), [input]);
  const outputBytes = useMemo(() => byteSize(output), [output]);

  const runFormat = useCallback(
    (mode: 'format' | 'minify', source: string) => {
      if (source.trim() === '') {
        setOutput('');
        setError(null);
        return;
      }
      try {
        const result =
          mode === 'format'
            ? formatJson(source, { indent, sortKeys })
            : minifyJson(source, { sortKeys });
        setOutput(result);
        setError(null);
      } catch (err) {
        setError(formatJsonErrorInfo(describeJsonError(err, source)));
      }
    },
    [indent, sortKeys],
  );

  const handleFormat = useCallback(() => runFormat('format', input), [runFormat, input]);
  const handleMinify = useCallback(() => runFormat('minify', input), [runFormat, input]);

  // Debounced auto-format, small inputs only.
  useEffect(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (byteSize(input) > AUTO_FORMAT_MAX_BYTES) {
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      runFormat('format', input);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [input, runFormat]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleFormat();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_JSON);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button variant="primary" onClick={handleFormat}>
          Format
        </Button>
        <Button variant="secondary" onClick={handleMinify}>
          Minify
        </Button>
        <Select
          aria-label="Indent width"
          value={indent}
          onChange={(event) => setIndent(event.target.value as IndentOption)}
          options={INDENT_OPTIONS}
        />
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-fg)]">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={(event) => setSortKeys(event.target.checked)}
          />
          Sort keys
        </label>
        <Button variant="ghost" onClick={handleLoadSample}>
          Load sample
        </Button>
        <Button variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      </Toolbar>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title="Input"
          actions={<span className="text-xs text-[var(--color-muted)]">{inputBytes} bytes</span>}
        >
          <TextArea
            aria-label="JSON input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste JSON here…"
            className="min-h-[240px]"
          />
        </Panel>

        <Panel
          title="Output"
          actions={
            <>
              <span className="text-xs text-[var(--color-muted)]">{outputBytes} bytes</span>
              <CopyButton getText={() => output} />
            </>
          }
        >
          <TextArea
            aria-label="JSON output"
            value={output}
            readOnly
            placeholder="Formatted JSON will appear here…"
            className="min-h-[240px]"
          />
        </Panel>
      </div>
    </div>
  );
}
