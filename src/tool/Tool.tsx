import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  CodeArea,
  CopyButton,
  ErrorBox,
  Panel,
  SegmentedControl,
  StatusPill,
  Switch,
  Toolbar,
  ToolbarDivider,
  type StatusTone,
} from '@mmoall/tool-kit';
import { describeJsonError, formatJsonErrorInfo } from './json-error';
import { SAMPLE_JSON } from './sample';
import { formatJson, minifyJson, type IndentOption } from './json-transform';

// Above this size, formatting only happens on an explicit action (button
// click or Ctrl/Cmd+Enter) — never on a debounce timer — so we don't
// re-parse/re-stringify large documents on every keystroke.
const AUTO_FORMAT_MAX_BYTES = 200 * 1024;
const DEBOUNCE_MS = 300;

const INDENT_OPTIONS: { value: IndentOption; label: string }[] = [
  { value: '2', label: '2 sp' },
  { value: '4', label: '4 sp' },
  { value: 'tab', label: 'Tab' },
];

const SHORTCUT_HINT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘↵' : 'Ctrl↵';

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

  const status: { tone: StatusTone; label: string } = error
    ? { tone: 'danger', label: 'Invalid JSON' }
    : output
      ? { tone: 'success', label: 'Valid JSON' }
      : { tone: 'neutral', label: 'Waiting for input' };

  return (
    <div className="flex flex-col gap-3">
      <Toolbar>
        <Button variant="primary" onClick={handleFormat} title="Format (Ctrl/Cmd+Enter)">
          Format
          <span className="ml-1 hidden text-[11px] opacity-70 sm:inline">{SHORTCUT_HINT}</span>
        </Button>
        <Button variant="secondary" onClick={handleMinify}>
          Minify
        </Button>
        <ToolbarDivider />
        <SegmentedControl
          aria-label="Indent width"
          value={indent}
          onChange={setIndent}
          options={INDENT_OPTIONS}
        />
        <Switch checked={sortKeys} onChange={setSortKeys} label="Sort keys" className="px-2" />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" onClick={handleLoadSample}>
            Sample
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={!input && !output}>
            Clear
          </Button>
        </div>
      </Toolbar>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel
          flush
          className="h-[360px] lg:h-[600px]"
          title={
            <>
              Input
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </>
          }
          actions={<Stats text={input} bytes={inputBytes} />}
        >
          <CodeArea
            aria-label="JSON input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste or type JSON here…"
            autoFocus
          />
        </Panel>

        <Panel
          flush
          className="h-[360px] lg:h-[600px]"
          title="Output"
          actions={
            <>
              <Stats text={output} bytes={outputBytes} />
              <CopyButton getText={() => output} disabled={!output} />
            </>
          }
        >
          <CodeArea
            aria-label="JSON output"
            value={output}
            readOnly
            placeholder="Formatted JSON will appear here…"
            className={error ? 'opacity-50' : ''}
          />
        </Panel>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Stats({ text, bytes }: { text: string; bytes: number }) {
  if (!text) return null;
  const lines = text.split('\n').length;
  return (
    <span className="hidden text-xs tabular-nums text-[var(--color-muted)] sm:inline" title={`${bytes} bytes`}>
      {lines.toLocaleString()} {lines === 1 ? 'line' : 'lines'} · {formatBytes(bytes)}
    </span>
  );
}
