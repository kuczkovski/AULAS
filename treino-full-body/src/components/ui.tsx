"use client";

import Link from "next/link";
import { forwardRef, useEffect, useId, useRef } from "react";
import { IconClose, IconLeft } from "./icons";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-95 active:brightness-90",
  secondary: "bg-surface-3 text-ink border border-line hover:bg-surface-2",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-ink border border-danger hover:brightness-110",
  warn: "bg-warn-soft text-ink border border-warn hover:brightness-110",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-14 px-5 text-base",
  xl: "min-h-16 px-6 text-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "lg", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition select-none disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${extra}`;
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean }
>(function Button({ variant = "primary", size = "lg", block, className = "", type = "button", ...rest }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, `${block ? "w-full" : ""} ${className}`)} {...rest} />;
});

export function LinkButton({
  href,
  variant = "primary",
  size = "lg",
  block,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, `${block ? "w-full" : ""} ${className}`)}>
      {children}
    </Link>
  );
}

export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-line bg-surface p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "accent" | "ok" | "warn" | "danger" | "info"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-surface-3 text-muted",
    accent: "bg-accent-soft text-accent",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    info: "bg-surface-3 text-info",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start gap-2 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {back && (
        <Link href={back} aria-label="Voltar" className={buttonClass("ghost", "md", "-ml-3 !px-2")}>
          <IconLeft />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-xl px-4 pb-nav ${className}`}>{children}</main>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-muted">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-faint">{hint}</p>}
      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-xl border border-line bg-surface-2 px-3 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className = "", ...rest },
  ref,
) {
  return <input ref={ref} className={`${inputClass} ${className}`} {...rest} />;
});

export function Select({ className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClass} ${className}`} {...rest} />;
}

export function TextArea({ className = "", ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-20 py-2 ${className}`} {...rest} />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition ${o.value === value ? "bg-surface-3 text-ink" : "text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line p-6 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Painel inferior modal (bottom sheet) com foco e tecla Esc. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 id={titleId} className="flex-1 text-xl font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className={buttonClass("ghost", "md", "!px-2")}>
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-bold">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-faint">{detail}</p>}
    </div>
  );
}
