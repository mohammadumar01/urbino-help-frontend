"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { initialsOf, labelize, toneFor } from "@/lib/admin/format";
import type { ToastState } from "@/lib/admin/hooks";

/* ----------------------------- Icons ----------------------------- */

export function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const I = {
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
  download: "M12 4v12m0 0l-4-4m4 4l4-4M5 20h14",
  copy: "M9 9h10v10H9zM5 15V5h10",
  up: "M6 14l6-6 6 6",
  down: "M6 10l6 6 6-6",
  chevron: "M9 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  alert: "M12 8v5m0 3h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 19v-1a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8",
  user: "M20 21v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M12 12a4 4 0 100-8 4 4 0 000 8z",
  calendar: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M3 3l18 18M10.6 6.2A9.7 9.7 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.9M6.3 7.6A17 17 0 002 12s4 7 10 7c1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 004.2 4.2",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  inbox: "M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5",
  menu: "M4 6h16M4 12h16M4 18h16",
  logout: "M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11",
};

/* ----------------------------- Styles ----------------------------- */

export const KEYFRAMES = `
  @keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes popIn { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes sweep { from { transform: translateX(-100%) } to { transform: translateX(250%) } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
`;

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-200`;
export const btnSecondary = `${btn} border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-indigo-100`;
export const btnDanger = `${btn} border border-red-200 bg-white font-medium text-red-600 hover:bg-red-50 focus-visible:ring-red-100`;

export const inputCls = (err?: string) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

/* ----------------------------- Small pieces ----------------------------- */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-500">
      {children}
    </kbd>
  );
}

const AV = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-14 w-14 text-base" };

export function Avatar({
  name,
  seed,
  size = "md",
  single,
}: {
  name?: string;
  seed: string;
  size?: keyof typeof AV;
  single?: boolean;
}) {
  const text = single ? (name || "C").trim().charAt(0).toUpperCase() : initialsOf(name);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${toneFor(name || seed)} ${AV[size]}`}
    >
      {text}
    </div>
  );
}

function roleTone(role?: string) {
  switch ((role || "user").toLowerCase()) {
    case "admin":
    case "super_admin":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";
    case "agent":
      return "bg-teal-50 text-teal-700 ring-teal-600/20";
    case "manager":
    case "supervisor":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    case "provider":
      return "bg-sky-50 text-sky-700 ring-sky-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

export function RoleBadge({ role, fallback = "user" }: { role?: string; fallback?: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleTone(
        role || fallback
      )}`}
    >
      {labelize(role, fallback)}
    </span>
  );
}

export function PageHeader({
  section,
  title,
  subtitle,
  updated,
  children,
}: {
  section: string;
  title: string;
  subtitle: string;
  updated?: Date | null;
  children?: ReactNode;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        Admin <span className="mx-1.5 text-slate-300">/</span> {section}{" "}
        <span className="mx-1.5 text-slate-300">/</span>
        <span className="font-medium text-slate-700">{title}</span>
      </nav>
      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {updated && (
            <span className="hidden text-xs text-slate-500 md:inline">
              Updated {updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          {children}
        </div>
      </header>
    </>
  );
}

export type StatItem = { label: string; value: ReactNode; caption: string; tone?: string };

export function Stats({
  items,
  loading,
  children,
}: {
  items: StatItem[];
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <dl className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="bg-white px-5 py-4">
            <dt className="text-xs font-medium text-slate-500">{s.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone ?? ""}`}>{loading ? "–" : s.value}</dd>
            <p className="mt-0.5 text-xs text-slate-400">{s.caption}</p>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}

export function RefreshButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className={btnSecondary}>
      <Icon d={I.refresh} className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      Refresh
      <span className="hidden sm:inline">
        <Kbd>R</Kbd>
      </span>
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon d={I.search} />
      </span>
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
      {!value && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <Kbd>/</Kbd>
        </span>
      )}
    </div>
  );
}

export type Density = "comfortable" | "compact";
export const DENSITIES: Density[] = ["comfortable", "compact"];

export function DensityToggle({ value, onChange }: { value: Density; onChange: (d: Density) => void }) {
  return (
    <div
      role="group"
      aria-label="Row density"
      className="inline-flex self-start rounded-lg border border-slate-300 bg-white p-0.5 text-sm lg:self-auto"
    >
      {DENSITIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-pressed={value === d}
          className={`rounded-md px-3 py-2 font-medium capitalize transition ${
            value === d ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

export function SortHeader<K extends string>({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: K;
  sort: { key: K; dir: "asc" | "desc" } | null;
  onSort: (k: K) => void;
}) {
  const active = sort?.key === k;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={`inline-flex items-center gap-1 font-semibold transition hover:text-slate-900 ${
        active ? "text-slate-900" : ""
      }`}
    >
      {label}
      <Icon d={active && sort?.dir === "desc" ? I.down : I.up} className={`h-3.5 w-3.5 ${active ? "" : "opacity-30"}`} />
    </button>
  );
}

export function nextSort<K extends string>(s: { key: K; dir: "asc" | "desc" } | null, key: K) {
  if (!s || s.key !== key) return { key, dir: "asc" as const };
  return s.dir === "asc" ? { key, dir: "desc" as const } : null;
}

export function ProgressBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-indigo-100">
      <div className="h-full w-1/3 bg-indigo-600" style={{ animation: "sweep 1s linear infinite" }} />
    </div>
  );
}

export function SkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  const widths = [120, 170, 100, 70, 90, 60];
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3.5 animate-pulse rounded bg-slate-100" style={{ width: widths[(i + j) % widths.length] }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ErrorBanner({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <Icon d={I.alert} className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-red-700">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2 hover:text-red-900">
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  icon = I.users,
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon d={icon} className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  pageSizes,
  first,
  last,
  total,
  busy,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizes: number[];
  first: number;
  last: number;
  total?: number | null;
  busy?: boolean;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const b = "font-medium text-slate-900";
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <p>
        Showing <span className={b}>{first}</span>–<span className={b}>{last}</span>
        {total != null && (
          <>
            {" "}
            of <span className={b}>{total}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            {pageSizes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || busy}
            onClick={() => onPage(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-1 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || busy}
            onClick={() => onPage(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  children,
  onCopy,
  extra,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  onCopy?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{children ?? (value || "—")}</dd>
      </div>
      <div className="flex shrink-0 gap-1">
        {extra}
        {onCopy && value && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon d={I.copy} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Overlay (drawer / modal) ----------------------------- */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Focus trap + Esc + scroll lock + focus restore. Parent isko conditionally render karta hai. */
export function Overlay({
  side,
  onClose,
  labelledBy,
  locked,
  role = "dialog",
  children,
}: {
  side: "right" | "center";
  onClose: () => void;
  labelledBy: string;
  locked?: boolean;
  role?: "dialog" | "alertdialog";
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const lockedRef = useRef(locked);
  const closeRef = useRef(onClose);
  lockedRef.current = locked;
  closeRef.current = onClose;

  useEffect(() => {
    const panel = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!panel.contains(document.activeElement)) (focusables()[0] ?? panel).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!lockedRef.current) closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const firstEl = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    panel.addEventListener("keydown", onKey);
    return () => {
      panel.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  const right = side === "right";
  return (
    <div className={`fixed inset-0 flex ${right ? "z-40 justify-end" : "z-50 items-center justify-center p-4"}`}>
      <div
        className="absolute inset-0 bg-slate-900/40"
        style={{ animation: "fadeIn .15s ease-out" }}
        onMouseDown={() => !locked && onClose()}
      />
      <section
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={
          right
            ? "relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none"
            : "relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
        }
        style={{ animation: right ? "slideIn .2s ease-out" : "popIn .18s ease-out" }}
      >
        {children}
      </section>
    </div>
  );
}

const TONES = {
  danger: { icon: "bg-red-100 text-red-600", btn: "bg-red-600 hover:bg-red-700", d: I.alert },
  success: { icon: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700", d: I.check },
  primary: { icon: "bg-indigo-100 text-indigo-700", btn: "bg-indigo-600 hover:bg-indigo-700", d: I.alert },
};

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: keyof typeof TONES;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = TONES[tone];
  return (
    <Overlay side="center" role="alertdialog" labelledBy="confirm-title" onClose={onCancel} locked={busy}>
      <div className="flex gap-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.icon}`}>
          <Icon d={t.d} className="h-5 w-5" />
        </span>
        <div>
          <h2 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">{body}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus disabled={busy} onClick={onCancel} className={btnSecondary}>
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${t.btn}`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}

export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-lg ${
        ok ? "border-emerald-200" : "border-red-200"
      }`}
      style={{ animation: "popIn .2s ease-out" }}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
        }`}
      >
        <Icon d={ok ? I.check : I.alert} className="h-3 w-3" />
      </span>
      <p className="flex-1 text-slate-700">{toast.text}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-slate-400 hover:text-slate-700">
        <Icon d={I.close} className="h-4 w-4" />
      </button>
    </div>
  );
}