import { useCallback, useEffect, useState } from 'react';
import { toolConfig } from '../tool.config';
import { Tool } from '../tool/Tool';
import {
  getEmbedState,
  listenForThemeMessages,
  postEmbedReady,
  setupEmbedResize,
  type Theme,
} from './embed';
import { ArrowUpRightIcon, GitHubIcon, MoonIcon, ShieldIcon, SunIcon } from './ui';

const THEME_STORAGE_KEY = 'mmoall-tool-theme';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Private browsing / blocked storage — fall back to system preference.
    return null;
  }
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore — this is only a per-viewer convenience.
  }
}

export default function AppShell() {
  const [embedState] = useState(() => getEmbedState());

  const [theme, setTheme] = useState<Theme>(() => {
    if (embedState.initialTheme) return embedState.initialTheme;
    if (!embedState.isEmbed) {
      const stored = readStoredTheme();
      if (stored) return stored;
    }
    return systemTheme();
  });

  // Whether `theme` should be pinned via the data-theme attribute, or the OS
  // `prefers-color-scheme` should keep driving it. Embed mode and any
  // explicit user/parent-frame choice pin it.
  const [themeIsPinned, setThemeIsPinned] = useState<boolean>(
    () => embedState.isEmbed || readStoredTheme() !== null,
  );

  useEffect(() => {
    const root = document.documentElement;
    if (themeIsPinned) {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme, themeIsPinned]);

  // Embed mode must render on a transparent background so the host page
  // shows through around the tool.
  useEffect(() => {
    if (!embedState.isEmbed) return;
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
  }, [embedState.isEmbed]);

  useEffect(
    () =>
      listenForThemeMessages((nextTheme) => {
        setTheme(nextTheme);
        setThemeIsPinned(true);
      }),
    [],
  );

  useEffect(() => {
    if (!embedState.isEmbed) return;
    postEmbedReady(toolConfig.slug);
    return setupEmbedResize(toolConfig.slug);
  }, [embedState.isEmbed]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      writeStoredTheme(next);
      return next;
    });
    setThemeIsPinned(true);
  }, []);

  if (embedState.isEmbed) {
    return (
      <div className="p-2 sm:p-3">
        <Tool />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* Soft accent glow behind the header. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-accent-soft),transparent)]"
      />

      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_80%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="https://mmoall.com/tools" className="flex min-w-0 items-center gap-2.5">
            <span className="font-code grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-fg)] shadow-sm">
              {'{}'}
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight">{toolConfig.name}</span>
            <span className="hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-muted)] sm:inline">
              {toolConfig.category}
            </span>
          </a>
          <nav className="flex items-center gap-1">
            <a
              href="https://mmoall.com/tools"
              className="hidden h-9 items-center gap-1 rounded-lg px-3 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)] sm:inline-flex"
            >
              More tools
              <ArrowUpRightIcon className="size-3.5" />
            </a>
            <a
              href={`https://github.com/techshield-tech/${toolConfig.slug}`}
              aria-label="GitHub repository"
              className="grid size-9 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)]"
            >
              <GitHubIcon />
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="grid size-9 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)]"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{toolConfig.name}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-muted)]">
                {toolConfig.description}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
              <ShieldIcon className="size-3.5" />
              Runs locally — data never leaves your browser
            </span>
          </div>
          <Tool />
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-[var(--color-muted)] sm:px-6">
          <span>
            Part of{' '}
            <a href="https://mmoall.com" className="font-medium text-[var(--color-fg)] hover:underline">
              MMOALL Developer Tools
            </a>
          </span>
          <a
            href={`https://github.com/techshield-tech/${toolConfig.slug}`}
            className="inline-flex items-center gap-1.5 hover:text-[var(--color-fg)]"
          >
            <GitHubIcon className="size-3.5" />
            Open source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
