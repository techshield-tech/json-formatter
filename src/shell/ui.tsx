// Tiny, generic UI primitives shared across the whole MMOALL dev tools
// family. Nothing in this file may reference JSON (or any other specific
// tool's domain) — sibling repos reuse this file verbatim.

import { useMemo, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  SVGProps,
  TextareaHTMLAttributes,
  UIEvent,
} from 'react';

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]';

// ---------------------------------------------------------------------------
// Icons (stroke icons, 24x24 grid, inherit currentColor)
// ---------------------------------------------------------------------------

export type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, className = 'size-4', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Icon>
);

export const GitHubIcon = ({ className = 'size-4', ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 17 17 7M7 7h10v10" />
  </Icon>
);

export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-accent-fg)] border-transparent shadow-sm hover:bg-[var(--color-accent-hover)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] shadow-[var(--shadow-card)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel)]',
  ghost:
    'bg-transparent text-[var(--color-muted)] border-transparent hover:bg-[var(--color-panel)] hover:text-[var(--color-fg)]',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-lg border font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${focusRing} ${buttonSizeClasses[size]} ${buttonVariantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

export interface CopyButtonProps {
  /** Lazily computed so the latest value is copied even if this button is memoized. */
  getText: () => string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  getText,
  label = 'Copy',
  copiedLabel = 'Copied!',
  className = '',
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — nothing else to
      // fall back to without touching the network, so fail silently.
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={`${copied ? '!text-[var(--color-success)]' : ''} ${className}`}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      spellCheck={false}
      className={`font-code scroll-thin w-full flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-[13px] leading-6 text-[var(--color-fg)] outline-none placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent)] ${className}`}
      {...props}
    />
  );
}

export interface CodeAreaProps extends Omit<TextAreaProps, 'value'> {
  value: string;
  /** Show a line-number gutter. Lines never soft-wrap so numbers stay aligned. */
  lineNumbers?: boolean;
}

/** Borderless monospace editor with an optional line-number gutter; meant to sit inside a Panel. */
export function CodeArea({
  value,
  lineNumbers = true,
  className = '',
  onScroll,
  ...props
}: CodeAreaProps) {
  const gutterRef = useRef<HTMLPreElement>(null);

  const numbers = useMemo(() => {
    if (!lineNumbers) return '';
    let count = 1;
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) === 10) count++;
    }
    let text = '1';
    for (let n = 2; n <= count; n++) text += `\n${n}`;
    return text;
  }, [value, lineNumbers]);

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(${-event.currentTarget.scrollTop}px)`;
    }
    onScroll?.(event);
  };

  return (
    <div className={`relative flex min-h-0 flex-1 overflow-hidden ${className}`}>
      {lineNumbers && (
        <div
          aria-hidden="true"
          className="relative shrink-0 overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-panel)]"
        >
          <pre
            ref={gutterRef}
            className="font-code m-0 min-w-[3.25rem] px-3 py-3 text-right text-[13px] leading-6 text-[var(--color-subtle)] will-change-transform"
          >
            {numbers}
          </pre>
        </div>
      )}
      <textarea
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
        value={value}
        onScroll={handleScroll}
        className="font-code scroll-thin min-w-0 flex-1 resize-none bg-transparent px-4 py-3 text-[13px] leading-6 whitespace-pre text-[var(--color-fg)] outline-none placeholder:text-[var(--color-subtle)]"
        {...props}
      />
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <select
        className={`h-9 appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pr-8 pl-3 text-sm text-[var(--color-fg)] shadow-[var(--shadow-card)] hover:border-[var(--color-border-strong)] ${focusRing}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[var(--color-muted)]">
        <path d="m6 9 6 6 6-6" />
      </Icon>
    </div>
  );
}

export interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props['aria-label']}
      className={`inline-flex h-9 items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0.5 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`h-full rounded-md px-2.5 text-xs font-medium transition-colors ${focusRing} ${
              selected
                ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-card)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  className?: string;
}

export function Switch({ checked, onChange, label, className = '' }: SwitchProps) {
  return (
    <label
      className={`inline-flex h-9 cursor-pointer select-none items-center gap-2 text-sm text-[var(--color-fg)] ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${focusRing} ${
          checked
            ? 'border-transparent bg-[var(--color-accent)]'
            : 'border-[var(--color-border-strong)] bg-[var(--color-panel)]'
        }`}
      >
        <span
          className={`inline-block size-3.5 rounded-full shadow-sm transition-transform ${
            checked
              ? 'translate-x-[18px] bg-[var(--color-accent-fg)]'
              : 'translate-x-[2px] bg-[var(--color-subtle)]'
          }`}
        />
      </button>
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Layout & feedback
// ---------------------------------------------------------------------------

export interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  /** Remove body padding, e.g. for an edge-to-edge CodeArea. */
  flush?: boolean;
}

export function Panel({ title, children, className = '', actions, flush = false }: PanelProps) {
  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {(title || actions) && (
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] px-4">
          {title ? (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`flex min-h-0 flex-1 flex-col ${flush ? '' : 'p-4'}`}>{children}</div>
    </section>
  );
}

export interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[var(--color-border)] sm:block" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-code inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1 text-[11px] text-[var(--color-muted)]">
      {children}
    </kbd>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]"
    >
      <Icon className="mt-0.5 size-4 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </Icon>
      <div className="font-code min-w-0 break-words text-[13px] leading-5">{children}</div>
    </div>
  );
}

export type StatusTone = 'neutral' | 'success' | 'danger';

const statusToneClasses: Record<StatusTone, { pill: string; dot: string }> = {
  neutral: {
    pill: 'border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)]',
    dot: 'bg-[var(--color-subtle)]',
  },
  success: {
    pill: 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
    dot: 'bg-[var(--color-success)]',
  },
  danger: {
    pill: 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    dot: 'bg-[var(--color-danger)]',
  },
};

export function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const classes = statusToneClasses[tone];
  return (
    <span
      role="status"
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium ${classes.pill}`}
    >
      <span className={`size-1.5 rounded-full ${classes.dot}`} />
      {children}
    </span>
  );
}
