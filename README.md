# JSON Formatter

Format, validate, minify, and sort keys in JSON — fast, free, and 100% client-side. Your input is never sent over the network; everything runs in your browser.

**Live:** https://techshield-tech.github.io/json-formatter/

Part of [MMOALL Developer Tools](https://mmoall.com/tools).

## Features

- Format (pretty-print) with a choice of 2-space, 4-space, or tab indentation.
- Minify.
- Recursively sort object keys (toggle applies to both format and minify).
- Copy output to clipboard.
- Clear input/output, or load a representative sample JSON.
- Clear parse-error messages with line/column, computed from the position the
  browser's `JSON.parse` reports (falls back to the raw message on engines
  whose error doesn't include a position).
- Input/output byte sizes shown using UTF-8 byte length, not character count.
- Large-input friendly: auto-format only debounces (300ms) for input under
  ~200KB. Above that, use the Format button or Ctrl/Cmd+Enter.
- Responsive down to 360px viewport width.

## Embedding

This tool can be embedded in an iframe, e.g. on mmoall.com. In embed mode it
renders only the tool itself (no header/footer) on a transparent background.

```html
<iframe
  id="json-formatter"
  src="https://techshield-tech.github.io/json-formatter/?embed=1&theme=dark"
  style="width: 100%; border: 0;"
  title="JSON Formatter"
></iframe>

<script>
  const iframe = document.getElementById('json-formatter');

  // Resize the iframe to fit its content.
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.type === 'mmoall-tool:height' && data.slug === 'json-formatter') {
      iframe.style.height = `${data.height}px`;
    }
    if (data && data.type === 'mmoall-tool:ready' && data.slug === 'json-formatter') {
      // The tool has mounted and is ready.
    }
  });

  // Push a theme change into the iframe (only accepted from an allowed origin).
  iframe.contentWindow.postMessage({ type: 'mmoall-tool:theme', theme: 'dark' }, '*');
</script>
```

### Contract

- `?embed=1` in the URL renders only the tool (no chrome), transparent
  background.
- `?theme=light` / `?theme=dark` sets the initial theme; otherwise it follows
  `prefers-color-scheme`.
- The page listens for `window.postMessage({type:'mmoall-tool:theme', theme})`
  from the parent frame to change theme at runtime. Only messages whose
  `event.origin` is `https://mmoall.com`, `https://www.mmoall.com`, or
  `http://localhost:3000` are accepted.
- On mount (embed mode only), the page posts
  `{type:'mmoall-tool:ready', slug:'json-formatter'}` to `window.parent`.
- Whenever its rendered height changes (embed mode only), the page posts
  `{type:'mmoall-tool:height', slug:'json-formatter', height}` to
  `window.parent`.

## Local development

```bash
bun install
bun dev
```

Build for production:

```bash
bun run build
```

Deployment to GitHub Pages happens automatically via
`.github/workflows/deploy.yml` on every push to `main`.

## License

MIT — see [LICENSE](./LICENSE).
