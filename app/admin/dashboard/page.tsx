"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/* ----------------------------- Types & config ----------------------------- */

type BookingStatus = "pending" | "accepted" | "completed" | "cancelled";
type Metric = "bookings" | "completed" | "cancelled" | "revenue";

type TrendPoint = {
  date: string; // YYYY-MM-DD
  bookings: number;
  completed: number;
  cancelled?: number;
  revenue?: number;
};

type RecentBooking = {
  id: string;
  customer: string;
  service: string;
  provider?: string;
  status: BookingStatus;
  amount?: number;
  createdAt: string;
};

type DashboardData = {
  totalUsers: number;
  totalBookings: number;
  pendingBookings: number;
  acceptedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  // Optional: sections fill in automatically when the API returns these.
  trend?: TrendPoint[];
  recentBookings?: RecentBooking[];
  topServices?: { name: string; count: number }[];
  topProviders?: { name: string; completed: number; rating?: number }[];
  pendingProviders?: number;
  pendingAgents?: number;
  revenueTotal?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5500";
const DASHBOARD_URL = `${API_BASE}/api/admin/dashboard`;
const REFRESH_INTERVAL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const RANGES = [7, 30, 90] as const;
const PAGE_SIZE = 6;
const SIDEBAR_KEY = "urbino:sidebarCollapsed";

const METRIC_META: Record<Metric, { label: string; color: string; money?: boolean }> = {
  bookings: { label: "Bookings", color: "#2563eb" },
  completed: { label: "Completed", color: "#10b981" },
  cancelled: { label: "Cancelled", color: "#f43f5e" },
  revenue: { label: "Revenue", color: "#7c3aed", money: true },
};

const ICONS: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  calendar:
    "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 3v4M8 3v4M3 11h18",
  shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11ZM9 12l2 2 4-4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
  layers: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  check: "m5 12 4 4L19 6",
  x: "M18 6 6 18M6 6l12 12",
  refresh:
    "M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5",
  logout: "M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  alert:
    "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  chevron: "m6 9 6 6 6-6",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  search: "m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  rupee: "M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5l7 6",
  up: "M3 17l6-6 4 4 8-8M15 7h6v6",
  down: "M3 7l6 6 4-4 8 8M15 17h6v-6",
  copy: "M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  sort: "M8 9l4-4 4 4M16 15l-4 4-4-4",
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.grid} />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    title: "Operations",
    items: [
      { label: "Overview", icon: "grid", active: true },
      { label: "Bookings", icon: "calendar", active: false, badge: "pending" },
      { label: "Users", icon: "users", active: false },
    ],
  },
  {
    title: "Verification",
    items: [
      { label: "Providers", icon: "shield", active: false },
      { label: "Agents", icon: "file", active: false },
    ],
  },
  { title: "Catalog", items: [{ label: "Services", icon: "layers", active: false }] },
  {
    title: "Finance",
    items: [
      { label: "Payments", icon: "rupee", active: false },
      { label: "Reports", icon: "pulse", active: false },
    ],
  },
  { title: "System", items: [{ label: "Settings", icon: "settings", active: false }] },
] as const;

const STATUS_STYLES: Record<BookingStatus, { label: string; pill: string; color: string }> = {
  pending: { label: "Pending", pill: "bg-amber-50 text-amber-700 ring-amber-600/20", color: "#f59e0b" },
  accepted: { label: "Accepted", pill: "bg-blue-50 text-blue-700 ring-blue-600/20", color: "#3b82f6" },
  completed: { label: "Completed", pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", color: "#10b981" },
  cancelled: { label: "Cancelled", pill: "bg-rose-50 text-rose-700 ring-rose-600/20", color: "#f43f5e" },
};

/* -------------------------------- Helpers --------------------------------- */

const formatNumber = (v: number) => Number(v || 0).toLocaleString("en-IN");
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
const formatCompact = (v: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const share = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const formatPercent = (v: number) => `${v.toFixed(v > 0 && v < 10 ? 1 : 0)}%`;
const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const formatDayLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function greetingFor(date: Date) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const metricValue = (p: TrendPoint, metric: Metric) => Number(p[metric] ?? 0);
const sumMetric = (pts: TrendPoint[], metric: Metric) => pts.reduce((s, p) => s + metricValue(p, metric), 0);
const formatMetric = (metric: Metric, v: number) =>
  METRIC_META[metric].money ? formatCurrency(v) : formatNumber(Math.round(v));

/** Monotone cubic smoothing so the line never overshoots the data. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        t[i] = tau * a * m[i];
        t[i + 1] = tau * b * m[i];
      }
    }
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

function exportCsv(rows: RecentBooking[]) {
  const head = ["Booking ID", "Customer", "Service", "Provider", "Status", "Amount", "Created at"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) => [r.id, r.customer, r.service, r.provider ?? "", r.status, r.amount ?? "", r.createdAt]);
  const csv = [head, ...body].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ Sample data ------------------------------- */

function buildSample(now: Date) {
  const DAYS = 180;
  const trend: TrendPoint[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (DAYS - 1 - i));
    const bookings = Math.round(
      18 * (1 + (i / DAYS) * 0.8) * (1 + 0.25 * Math.sin((i / 7) * 2 * Math.PI)) * (1 + 0.12 * Math.sin(i * 1.7))
    );
    const completed = Math.round(bookings * (0.72 + 0.06 * Math.sin(i / 9)));
    const cancelled = Math.round(bookings * (0.08 + 0.03 * Math.sin(i / 5)));
    const revenue = Math.round(completed * (640 + 60 * Math.sin(i / 11)));
    return { date: d.toISOString().slice(0, 10), bookings, completed, cancelled, revenue };
  });

  const customers = ["Aarav Mehta", "Riya Sharma", "Kabir Singh", "Ananya Iyer", "Vikram Rao", "Neha Kapoor", "Rohan Das", "Sneha Nair", "Arjun Verma", "Isha Gupta", "Dev Malhotra", "Pooja Reddy"];
  const services = [
    { name: "AC Repair", provider: "CoolFix Services", price: 799 },
    { name: "Deep Home Cleaning", provider: "SparkleCare", price: 2499 },
    { name: "Plumbing", provider: "Rajesh Kumar", price: 549 },
    { name: "Salon at Home", provider: "Glow Studio", price: 1299 },
    { name: "Electrician", provider: "Sunil Electricals", price: 399 },
    { name: "Pest Control", provider: "SafeHome Pest", price: 1799 },
  ];
  const statuses: BookingStatus[] = ["pending", "accepted", "completed", "completed", "cancelled", "completed", "accepted", "completed", "pending", "completed"];
  const recentBookings: RecentBooking[] = Array.from({ length: 24 }, (_, i) => {
    const s = services[i % services.length];
    return {
      id: `BK-${10482 - i}`,
      customer: customers[(i * 5) % customers.length],
      service: s.name,
      provider: s.provider,
      status: statuses[i % statuses.length],
      amount: s.price + (i % 3) * 100,
      createdAt: new Date(now.getTime() - (6 + i * i * 3 + i * 20) * 60_000).toISOString(),
    };
  });

  return {
    trend,
    recentBookings,
    topServices: [
      { name: "AC Repair", count: 412 },
      { name: "Deep Home Cleaning", count: 358 },
      { name: "Salon at Home", count: 296 },
      { name: "Plumbing", count: 241 },
      { name: "Electrician", count: 187 },
    ],
    topProviders: [
      { name: "CoolFix Services", completed: 142, rating: 4.8 },
      { name: "SparkleCare", completed: 128, rating: 4.7 },
      { name: "Glow Studio", completed: 117, rating: 4.9 },
      { name: "Rajesh Kumar", completed: 96, rating: 4.6 },
      { name: "Sunil Electricals", completed: 84, rating: 4.5 },
    ],
    pendingProviders: 7,
    pendingAgents: 3,
    revenueTotal: 1284500,
  };
}

/* ------------------------------- UI pieces -------------------------------- */

const CHART_CSS = `
@keyframes ub-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes ub-fade{from{opacity:0}to{opacity:1}}
.ub-draw{stroke-dasharray:1;stroke-dashoffset:0;animation:ub-draw .9s cubic-bezier(.22,.8,.3,1) both}
.ub-fade{animation:ub-fade .9s ease-out both}
@media (prefers-reduced-motion: reduce){.ub-draw{animation:none;stroke-dasharray:none}.ub-fade{animation:none}}
`;

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (target - from) * eased;
      fromRef.current = cur;
      setValue(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format(v)}</>;
}

function SampleTag() {
  return (
    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
      Sample
    </span>
  );
}

function Card({
  title, subtitle, action, sample, className = "", id, children,
}: {
  title: string; subtitle?: string; action?: ReactNode; sample?: boolean; className?: string; id?: string; children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {sample && <SampleTag />}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function Segmented<T extends string | number>({
  options, value, onChange, label, render,
}: {
  options: readonly T[]; value: T; onChange: (v: T) => void; label: string; render: (v: T) => string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((o) => (
        <button
          key={String(o)}
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            value === o ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 96, H = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 3 - ((v - min) / range) * (H - 6)] as [number, number]);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TrendChart({
  points, prev, metric,
}: {
  points: TrendPoint[]; prev?: TrendPoint[]; metric: Metric;
}) {
  const meta = METRIC_META[metric];
  const [hover, setHover] = useState<number | null>(null);

  const W = 840, H = 320, padL = 52, padR = 20, padT = 30, padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = points.length;

  const vals = points.map((p) => metricValue(p, metric));
  const pvals = prev?.map((p) => metricValue(p, metric));
  const max = niceMax(Math.max(1, ...vals, ...(pvals ?? [0])) * 1.1);
  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const pts = vals.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(pts);
  const area = `${line} L${x(n - 1).toFixed(1)} ${padT + innerH} L${x(0).toFixed(1)} ${padT + innerH} Z`;
  const prevLine = pvals && pvals.length === n ? smoothPath(pvals.map((v, i) => [x(i), y(v)] as [number, number])) : "";

  const total = vals.reduce((s, v) => s + v, 0);
  const avg = n ? total / n : 0;
  const peakVal = Math.max(...vals);
  const peakIdx = vals.indexOf(peakVal);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const step = Math.max(1, Math.ceil(n / 7));
  const axis = (v: number) => (meta.money ? `â‚¹${formatCompact(v)}` : formatCompact(v));

  function indexFromPointer(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = Math.min(1, Math.max(0, (px - padL) / innerW));
    return Math.round(ratio * (n - 1));
  }

  function onKeyDown(e: ReactKeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? -1) + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n) - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setHover(0); }
    else if (e.key === "End") { e.preventDefault(); setHover(n - 1); }
    else if (e.key === "Escape") setHover(null);
  }

  const hp = hover !== null ? points[hover] : null;
  const hv = hover !== null ? vals[hover] : 0;
  const hpv = hover !== null && pvals ? pvals[hover] : undefined;
  const hDelta = hpv !== undefined && hpv > 0 ? ((hv - hpv) / hpv) * 100 : null;
  const leftPct = hover !== null ? Math.min(Math.max((x(hover) / W) * 100, 16), 84) : 0;
  const peakAnchor = peakIdx < n * 0.1 ? "start" : peakIdx > n * 0.9 ? "end" : "middle";
  const gid = `trend-fill-${metric}`;

  return (
    <div className="relative">
      <style>{CHART_CSS}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        role="img"
        tabIndex={0}
        aria-label={`${meta.label} over time. Use the left and right arrow keys to inspect each day.`}
        onPointerMove={(e) => setHover(indexFromPointer(e))}
        onPointerDown={(e) => setHover(indexFromPointer(e))}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={meta.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? undefined : "3 5"} />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{axis(t)}</text>
          </g>
        ))}

        {points.map((p, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={p.date} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#94a3b8">{formatDay(p.date)}</text>
          ) : null
        )}

        <g key={`${metric}-${n}`}>
          <path d={area} fill={`url(#${gid})`} className="ub-fade" />

          {prevLine && (
            <path d={prevLine} fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeDasharray="5 5" strokeLinecap="round" className="ub-fade" />
          )}

          {avg > 0 && (
            <g className="ub-fade">
              <line x1={padL} x2={W - padR} y1={y(avg)} y2={y(avg)} stroke={meta.color} strokeOpacity="0.35" strokeDasharray="2 4" />
              <text
                x={W - padR - 4} y={y(avg) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill={meta.color}
                stroke="#fff" strokeWidth="3" style={{ paintOrder: "stroke" }}
              >
                Avg {meta.money ? `â‚¹${formatCompact(avg)}` : formatCompact(avg)}
              </text>
            </g>
          )}

          <path d={line} pathLength={1} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="ub-draw" />

          {peakVal > 0 && (
            <g className="ub-fade">
              <circle cx={x(peakIdx)} cy={y(peakVal)} r="4" fill={meta.color} stroke="#fff" strokeWidth="2" />
              <text
                x={x(peakIdx)} y={y(peakVal) - 11} textAnchor={peakAnchor} fontSize="11" fontWeight="600" fill="#334155"
                stroke="#fff" strokeWidth="3" style={{ paintOrder: "stroke" }}
              >
                Peak {meta.money ? `â‚¹${formatCompact(peakVal)}` : formatNumber(peakVal)}
              </text>
            </g>
          )}
        </g>

        {hover !== null && hp && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
            {hpv !== undefined && <circle cx={x(hover)} cy={y(hpv)} r="4" fill="#fff" stroke="#94a3b8" strokeWidth="2" />}
            <circle cx={x(hover)} cy={y(hv)} r="9" fill={meta.color} fillOpacity="0.15" />
            <circle cx={x(hover)} cy={y(hv)} r="5" fill="#fff" stroke={meta.color} strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute top-1 z-10 w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs shadow-xl"
          style={{ left: `${leftPct}%` }}
        >
          <p className="font-semibold text-slate-900">{formatDayLong(hp.date)}</p>
          <p className="mt-2 flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
            {meta.label}
            <span className="ml-auto text-sm font-semibold tabular-nums text-slate-950">{formatMetric(metric, hv)}</span>
          </p>
          {hpv !== undefined && (
            <p className="mt-1.5 flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Previous period
              <span className="ml-auto font-medium tabular-nums text-slate-700">{formatMetric(metric, hpv)}</span>
            </p>
          )}
          {hDelta !== null && (
            <p className={`mt-2 border-t border-slate-100 pt-2 font-semibold ${hDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {hDelta >= 0 ? "â–²" : "â–¼"} {Math.abs(hDelta).toFixed(1)}% vs previous period
            </p>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {hp ? `${formatDayLong(hp.date)}: ${formatMetric(metric, hv)} ${meta.label.toLowerCase()}` : ""}
      </p>
    </div>
  );
}

type Segment = { label: string; value: number; color: string };

function Donut({ segments, total, active }: { segments: Segment[]; total: number; active: string | null }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative mx-auto h-[176px] w-[176px]">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Booking status distribution">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#eef2f7" strokeWidth="16" />
        {total > 0 &&
          segments.filter((s) => s.value > 0).map((s) => {
            const len = Math.max((s.value / total) * c - 2, 0);
            const el = (
              <circle
                key={s.label} cx="80" cy="80" r={r} fill="none" stroke={s.color}
                strokeWidth={active === s.label ? 20 : 16}
                strokeOpacity={active && active !== s.label ? 0.25 : 1}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                style={{ transition: "stroke-width .15s, stroke-opacity .15s" }}
              />
            );
            offset += (s.value / total) * c;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-950">
          <CountUp value={total} format={(v) => formatNumber(Math.round(v))} />
        </span>
        <span className="mt-0.5 text-xs text-slate-500">Total bookings</span>
      </div>
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

type SortKey = "createdAt" | "amount";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [live, setLive] = useState(true);
  const [sampleOn, setSampleOn] = useState(false);

  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [metric, setMetric] = useState<Metric>("bookings");
  const [compare, setCompare] = useState(true);
  const [activeSeg, setActiveSeg] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RecentBooking | null>(null);

  const [toast, setToast] = useState("");
  const [modKey, setModKey] = useState("Ctrl");

  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem("adminToken");
    router.replace("/admin/login");
  }, [router]);

  const load = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const token = sessionStorage.getItem("adminToken");
        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(DASHBOARD_URL, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          signOut();
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.dashboard) {
          throw new Error(data.message || "The dashboard could not be loaded.");
        }

        setStats(data.dashboard);
        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        const timedOut = err instanceof DOMException && err.name === "AbortError";
        setError(
          timedOut ? "The server took too long to respond." : err instanceof Error ? err.message : "We couldn't reach the server."
        );
      } finally {
        clearTimeout(timer);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, signOut]
  );

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, live]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); } catch { /* ignore */ }
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("âŒ˜");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
        setBellOpen(false);
        setSelected(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (selected) closeRef.current?.focus();
  }, [selected]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      try { localStorage.setItem(SIDEBAR_KEY, v ? "0" : "1"); } catch { /* ignore */ }
      return !v;
    });
  }

  /* ----------------------- Merge live data + sample ----------------------- */

  const sample = useMemo(() => (sampleOn ? buildSample(new Date()) : null), [sampleOn]);

  const view = useMemo(
    () => ({
      trend: stats?.trend ?? sample?.trend,
      recent: stats?.recentBookings ?? sample?.recentBookings,
      services: stats?.topServices ?? sample?.topServices,
      providers: stats?.topProviders ?? sample?.topProviders,
      pendingProviders: stats?.pendingProviders ?? sample?.pendingProviders,
      pendingAgents: stats?.pendingAgents ?? sample?.pendingAgents,
      revenue: stats?.revenueTotal ?? sample?.revenueTotal,
      isSample: {
        trend: !stats?.trend && !!sample,
        recent: !stats?.recentBookings && !!sample,
        services: !stats?.topServices && !!sample,
        providers: !stats?.topProviders && !!sample,
        verification: stats?.pendingProviders === undefined && stats?.pendingAgents === undefined && !!sample,
        revenue: stats?.revenueTotal === undefined && !!sample,
      },
    }),
    [stats, sample]
  );

  const m = useMemo(() => {
    const total = Number(stats?.totalBookings || 0);
    const pending = Number(stats?.pendingBookings || 0);
    const accepted = Number(stats?.acceptedBookings || 0);
    const completed = Number(stats?.completedBookings || 0);
    const cancelled = Number(stats?.cancelledBookings || 0);
    const users = Number(stats?.totalUsers || 0);
    const other = Math.max(0, total - (pending + accepted + completed + cancelled));

    const segments: Segment[] = [
      { label: "Completed", value: completed, color: STATUS_STYLES.completed.color },
      { label: "Accepted", value: accepted, color: STATUS_STYLES.accepted.color },
      { label: "Pending", value: pending, color: STATUS_STYLES.pending.color },
      { label: "Cancelled", value: cancelled, color: STATUS_STYLES.cancelled.color },
    ];
    if (other > 0) segments.push({ label: "Other", value: other, color: "#94a3b8" });

    return {
      total, pending, accepted, completed, cancelled, users, segments,
      open: pending + accepted,
      completionRate: share(completed, total),
      cancellationRate: share(cancelled, total),
      acceptanceRate: share(accepted + completed, total),
      bookingsPerUser: users > 0 ? total / users : 0,
    };
  }, [stats]);

  /* ------------------------------ Trend data ------------------------------ */

  const availableMetrics = useMemo(() => {
    const list: Metric[] = ["bookings", "completed"];
    const t = view.trend;
    if (t?.some((p) => p.cancelled !== undefined)) list.push("cancelled");
    if (t?.some((p) => p.revenue !== undefined)) list.push("revenue");
    return list;
  }, [view.trend]);

  const activeMetric: Metric = availableMetrics.includes(metric) ? metric : "bookings";
  const windowed = useMemo(() => view.trend?.slice(-range), [view.trend, range]);
  const canCompare = !!view.trend && view.trend.length >= range * 2;
  const previous = useMemo(
    () => (canCompare ? view.trend!.slice(-range * 2, -range) : undefined),
    [canCompare, view.trend, range]
  );
  const showCompare = compare && canCompare;

  const trendStats = useMemo(() => {
    if (!windowed || windowed.length === 0) return null;
    const vals = windowed.map((p) => metricValue(p, activeMetric));
    const total = vals.reduce((s, v) => s + v, 0);
    const peak = Math.max(...vals);
    const peakPoint = windowed[vals.indexOf(peak)];
    const prevTotal = previous ? sumMetric(previous, activeMetric) : null;
    const delta = prevTotal && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
    return { total, avg: total / vals.length, peak, peakDate: peakPoint.date, delta };
  }, [windowed, previous, activeMetric]);

  const bookingsDelta = useMemo(() => {
    if (!windowed || !previous) return null;
    const cur = sumMetric(windowed, "bookings");
    const prev = sumMetric(previous, "bookings");
    return prev > 0 ? ((cur - prev) / prev) * 100 : null;
  }, [windowed, previous]);

  const revenueDelta = useMemo(() => {
    if (!windowed || !previous || !availableMetrics.includes("revenue")) return null;
    const cur = sumMetric(windowed, "revenue");
    const prev = sumMetric(previous, "revenue");
    return prev > 0 ? ((cur - prev) / prev) * 100 : null;
  }, [windowed, previous, availableMetrics]);

  const weekly = useMemo(() => {
    if (!windowed || windowed.length < 7) return null;
    const sums = Array(7).fill(0) as number[];
    const counts = Array(7).fill(0) as number[];
    windowed.forEach((p) => {
      const d = new Date(`${p.date}T00:00:00`).getDay();
      sums[d] += p.bookings;
      counts[d] += 1;
    });
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rows = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: names[d], avg: counts[d] ? sums[d] / counts[d] : 0 }));
    const top = Math.max(...rows.map((r) => r.avg), 1);
    const best = rows.reduce((a, b) => (b.avg > a.avg ? b : a), rows[0]);
    return { rows, top, best };
  }, [windowed]);

  /* ------------------------------ Alerts & table --------------------------- */

  const alerts = useMemo(() => {
    const list: { tone: "amber" | "rose" | "blue"; text: string }[] = [];
    if (m.pending > 0)
      list.push({ tone: "amber", text: `${formatNumber(m.pending)} ${m.pending === 1 ? "booking is" : "bookings are"} waiting for a provider to respond` });
    if ((view.pendingProviders ?? 0) > 0)
      list.push({ tone: "blue", text: `${formatNumber(view.pendingProviders!)} provider ${view.pendingProviders === 1 ? "application needs" : "applications need"} verification` });
    if ((view.pendingAgents ?? 0) > 0)
      list.push({ tone: "blue", text: `${formatNumber(view.pendingAgents!)} agent ${view.pendingAgents === 1 ? "document needs" : "documents need"} review` });
    if (m.total >= 10 && m.cancellationRate > 20)
      list.push({ tone: "rose", text: `Cancellation rate is ${formatPercent(m.cancellationRate)}, above the 20% threshold` });
    return list;
  }, [m, view.pendingProviders, view.pendingAgents]);

  const recent = view.recent ?? [];
  const statusCounts = recent.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = recent.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return !q || [r.id, r.customer, r.service, r.provider ?? ""].some((v) => v.toLowerCase().includes(q));
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) =>
      sort.key === "amount"
        ? ((a.amount ?? 0) - (b.amount ?? 0)) * dir
        : (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    );
  }, [recent, statusFilter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
    setPage(0);
  }

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      notify(`Copied ${id}`);
    } catch {
      notify("Couldn't copy to clipboard");
    }
  }

  const pendingVerifications =
    view.pendingProviders === undefined && view.pendingAgents === undefined
      ? undefined
      : (view.pendingProviders ?? 0) + (view.pendingAgents ?? 0);

  const dateLabel = now
    ? now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  const toneDot = { amber: "bg-amber-500", rose: "bg-rose-500", blue: "bg-blue-500" } as const;

  type Kpi = {
    label: string; value: ReactNode; note: string; icon: string;
    spark?: number[]; sparkColor?: string; delta?: number | null; sample?: boolean;
  };

  const kpis: Kpi[] = [
    { label: "Total users", value: <CountUp value={m.users} format={(v) => formatNumber(Math.round(v))} />, note: "Registered on the platform", icon: "users" },
    {
      label: "Total bookings",
      value: <CountUp value={m.total} format={(v) => formatNumber(Math.round(v))} />,
      note: bookingsDelta !== null ? `vs previous ${range} days` : "All time",
      icon: "calendar",
      spark: windowed?.map((p) => p.bookings), sparkColor: "#2563eb", delta: bookingsDelta,
    },
    { label: "Open bookings", value: <CountUp value={m.open} format={(v) => formatNumber(Math.round(v))} />, note: `${formatNumber(m.pending)} pending Â· ${formatNumber(m.accepted)} accepted`, icon: "pulse" },
    {
      label: "Completion rate",
      value: <CountUp value={m.completionRate} format={formatPercent} />,
      note: `${formatNumber(m.completed)} completed`,
      icon: "check",
      spark: windowed?.map((p) => p.completed), sparkColor: "#10b981",
    },
    {
      label: "Revenue",
      value: view.revenue !== undefined ? <CountUp value={view.revenue} format={(v) => formatCurrency(Math.round(v))} /> : "â€”",
      note: view.revenue !== undefined ? (revenueDelta !== null ? `vs previous ${range} days` : "From completed bookings") : "Needs revenueTotal from the API",
      icon: "rupee",
      spark: availableMetrics.includes("revenue") ? windowed?.map((p) => p.revenue ?? 0) : undefined,
      sparkColor: "#7c3aed", delta: revenueDelta, sample: view.isSample.revenue,
    },
    {
      label: "Pending verifications",
      value: pendingVerifications !== undefined ? <CountUp value={pendingVerifications} format={(v) => formatNumber(Math.round(v))} /> : "â€”",
      note: pendingVerifications !== undefined ? "Providers and agents" : "Needs verification counts from the API",
      icon: "shield", sample: view.isSample.verification,
    },
  ];

  const funnel = [
    { label: "Booked", value: m.total, pct: m.total > 0 ? 100 : 0, color: "#2563eb" },
    { label: "Accepted", value: m.accepted + m.completed, pct: m.acceptanceRate, color: "#3b82f6" },
    { label: "Completed", value: m.completed, pct: m.completionRate, color: "#10b981" },
  ];

  const sidebarW = collapsed ? "lg:w-[76px]" : "lg:w-64";
  const contentPad = collapsed ? "lg:pl-[76px]" : "lg:pl-64";
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

  /* -------------------------------- Render -------------------------------- */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {menuOpen && (
        <button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 transition-[transform,width] duration-200 motion-reduce:transition-none lg:translate-x-0 ${sidebarW} ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-16 items-center gap-3 border-b border-white/10 px-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">U</div>
          <div className={`leading-tight ${hideWhenCollapsed}`}>
            <p className="text-sm font-semibold text-white">Urbino Help</p>
            <p className="text-xs text-slate-500">Admin console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className={`mb-2 px-3 text-xs font-medium text-slate-500 ${hideWhenCollapsed}`}>{group.title}</p>
              {collapsed && <div className="mx-3 mb-2 hidden border-t border-white/10 lg:block" />}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.active ? (
                      <div
                        aria-current="page"
                        title={item.label}
                        className={`relative flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                      >
                        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-500" />
                        <Icon name={item.icon} />
                        <span className={hideWhenCollapsed}>{item.label}</span>
                      </div>
                    ) : (
                      <div
                        aria-disabled="true"
                        title={`${item.label} isn't connected yet`}
                        className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                      >
                        <Icon name={item.icon} />
                        <span className={hideWhenCollapsed}>{item.label}</span>
                        {"badge" in item && item.badge === "pending" && m.pending > 0 && (
                          <span className={`ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-400 ${hideWhenCollapsed}`}>
                            {formatNumber(m.pending)}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mb-2 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:flex ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Icon name={collapsed ? "right" : "left"} size={16} />
            <span className={hideWhenCollapsed}>Collapse</span>
          </button>
          <div className={`flex items-center gap-3 px-1 py-1 ${collapsed ? "lg:justify-center" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">A</span>
            <div className={`min-w-0 flex-1 leading-tight ${hideWhenCollapsed}`}>
              <p className="truncate text-sm font-medium text-white">Administrator</p>
              <p className="text-xs text-slate-500">Platform admin</p>
            </div>
            <button onClick={signOut} aria-label="Sign out" title="Sign out" className={`rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${hideWhenCollapsed}`}>
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 motion-reduce:transition-none ${contentPad}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden">
                <Icon name="menu" />
              </button>
              <nav aria-label="Breadcrumb" className="hidden text-sm text-slate-500 sm:block">
                Operations <span className="mx-1.5 text-slate-300">/</span>
                <span className="font-medium text-slate-900">Overview</span>
              </nav>
            </div>

            <div className="relative hidden max-w-md flex-1 md:block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><Icon name="search" size={16} /></span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") document.getElementById("recent-bookings")?.scrollIntoView({ behavior: "smooth" });
                }}
                placeholder="Search bookings, customers, services"
                aria-label="Search bookings"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/15"
              />
              <kbd className="pointer-events-none absolute inset-y-0 right-3 my-auto hidden h-5 items-center rounded border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-500 lg:flex">
                {modKey} K
              </kbd>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setLive((v) => !v)}
                aria-pressed={live}
                title={live ? "Auto-refresh is on. Click to pause." : "Auto-refresh is paused. Click to resume."}
                className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:inline-flex"
              >
                <span className="relative flex h-2 w-2">
                  {live && !error && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${error ? "bg-rose-500" : live ? "bg-emerald-500" : "bg-slate-300"}`} />
                </span>
                {error ? "Offline" : live ? (updatedLabel ? `Live Â· ${updatedLabel}` : "Live") : "Paused"}
              </button>

              <button onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-wait disabled:opacity-60">
                <span className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}><Icon name="refresh" size={16} /></span>
                <span className="hidden sm:inline">{refreshing ? "Refreshing" : "Refresh"}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
                  aria-label={`Notifications${alerts.length ? `, ${alerts.length} items` : ""}`}
                  aria-expanded={bellOpen}
                  className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Icon name="bell" size={18} />
                  {alerts.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">{alerts.length}</span>
                  )}
                </button>
                {bellOpen && (
                  <>
                    <button aria-label="Close notifications" className="fixed inset-0 z-10 cursor-default" onClick={() => setBellOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
                      <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">Notifications</p>
                      {alerts.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up.</p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {alerts.map((a) => (
                            <li key={a.text} className="flex gap-3 px-4 py-3 text-sm text-slate-700">
                              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[a.tone]}`} />
                              {a.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">A</span>
                  <span className="hidden text-sm font-medium text-slate-700 xl:inline">Administrator</span>
                  <Icon name="chevron" size={14} />
                </button>
                {profileOpen && (
                  <>
                    <button aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setProfileOpen(false)} />
                    <div role="menu" className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-700">
                        <Icon name="logout" size={16} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
          {/* Heading + sample switch */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {now ? `${greetingFor(now)}, Admin` : "Dashboard"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">{dateLabel ? `${dateLabel}. ` : ""}Here's how the platform is doing.</p>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="text-sm">
                <span className="block font-medium text-slate-800">Preview sample data</span>
                <span className="block text-xs text-slate-500">Fills sections the API doesn't send yet</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={sampleOn}
                onClick={() => setSampleOn((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${sampleOn ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${sampleOn ? "translate-x-5" : ""}`} />
              </button>
            </label>
          </div>

          {/* Error (no data) */}
          {!loading && error && !stats && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-lg bg-rose-50 p-2.5 text-rose-600"><Icon name="alert" size={20} /></span>
                <div>
                  <h2 className="font-semibold text-slate-900">Couldn't load the dashboard</h2>
                  <p className="mt-1 text-sm text-slate-500">{error}</p>
                  <button onClick={() => void load()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="space-y-6" aria-busy="true">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[128px] animate-pulse rounded-xl border border-slate-200 bg-white motion-reduce:animate-none" />
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="h-[460px] animate-pulse rounded-xl border border-slate-200 bg-white motion-reduce:animate-none" />
                <div className="h-[460px] animate-pulse rounded-xl border border-slate-200 bg-white motion-reduce:animate-none" />
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && stats && (
            <div className="space-y-6">
              {error && (
                <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <Icon name="alert" size={18} />
                  Couldn't refresh just now. Showing the last loaded data.
                </div>
              )}

              {/* KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {kpis.map((k) => (
                  <article key={k.label} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-500">{k.label}</p>
                        {k.sample && <SampleTag />}
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon name={k.icon} /></span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-950">{k.value}</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {k.delta !== null && k.delta !== undefined && (
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${k.delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            <Icon name={k.delta >= 0 ? "up" : "down"} size={12} />
                            {Math.abs(k.delta).toFixed(1)}%
                          </span>
                        )}
                        {k.note}
                      </p>
                      {k.spark && k.sparkColor && <Sparkline values={k.spark} color={k.sparkColor} />}
                    </div>
                  </article>
                ))}
              </div>

              {/* Trend + attention */}
              <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <Card
                  title="Performance trend"
                  subtitle="Hover or use arrow keys to inspect any day"
                  sample={view.isSample.trend}
                  action={
                    windowed ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Segmented options={availableMetrics} value={activeMetric} onChange={setMetric} label="Metric" render={(v) => METRIC_META[v].label} />
                        <Segmented options={RANGES} value={range} onChange={setRange} label="Date range" render={(v) => `${v}D`} />
                      </div>
                    ) : undefined
                  }
                >
                  {windowed && windowed.length > 1 && trendStats ? (
                    <>
                      <dl className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                        <div>
                          <dt className="text-xs text-slate-500">Total Â· last {range} days</dt>
                          <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-950">{formatMetric(activeMetric, trendStats.total)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Daily average</dt>
                          <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-950">{formatMetric(activeMetric, trendStats.avg)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Best day</dt>
                          <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-950">
                            {formatMetric(activeMetric, trendStats.peak)}
                            <span className="ml-1.5 text-xs font-normal text-slate-500">{formatDay(trendStats.peakDate)}</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">vs previous period</dt>
                          <dd className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${trendStats.delta === null ? "text-slate-400" : trendStats.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {trendStats.delta === null ? "â€”" : `${trendStats.delta >= 0 ? "+" : "âˆ’"}${Math.abs(trendStats.delta).toFixed(1)}%`}
                          </dd>
                        </div>
                      </dl>

                      <TrendChart points={windowed} prev={showCompare ? previous : undefined} metric={activeMetric} />

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-5">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: METRIC_META[activeMetric].color }} />
                            {METRIC_META[activeMetric].label}
                          </span>
                          {showCompare && (
                            <span className="inline-flex items-center gap-2">
                              <span className="h-0.5 w-5 rounded-full border-t-2 border-dashed border-slate-400" />
                              Previous {range} days
                            </span>
                          )}
                        </div>
                        <label className={`inline-flex items-center gap-2 ${canCompare ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`} title={canCompare ? undefined : `Needs at least ${range * 2} days of trend data`}>
                          <input
                            type="checkbox"
                            checked={showCompare}
                            disabled={!canCompare}
                            onChange={(e) => setCompare(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                          />
                          Compare with previous period
                        </label>
                      </div>
                    </>
                  ) : (
                    <EmptyState title="No trend data yet" hint="This chart fills in once the dashboard API returns a daily trend array." />
                  )}
                </Card>

                <div className="space-y-6">
                  <Card title="Needs attention" subtitle="Items that may need action today">
                    {alerts.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <Icon name="check" size={18} />
                        All clear. Nothing needs attention right now.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {alerts.map((a) => (
                          <li key={a.text} className="flex gap-3 text-sm leading-6 text-slate-700">
                            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${toneDot[a.tone]}`} />
                            {a.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  <Card title="Verification queue" subtitle="Waiting for admin review" sample={view.isSample.verification}>
                    {pendingVerifications === undefined ? (
                      <EmptyState title="No verification data" hint="Return pendingProviders and pendingAgents from the dashboard API." />
                    ) : (
                      <ul className="space-y-4">
                        {[
                          { label: "Provider applications", value: view.pendingProviders ?? 0, icon: "shield" },
                          { label: "Agent documents", value: view.pendingAgents ?? 0, icon: "file" },
                        ].map((row) => (
                          <li key={row.label} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon name={row.icon} size={17} /></span>
                            <span className="flex-1 text-sm text-slate-700">{row.label}</span>
                            <span className="text-lg font-semibold tabular-nums text-slate-950">{formatNumber(row.value)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>

              {/* Recent bookings + status */}
              <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <Card
                  id="recent-bookings"
                  title="Recent bookings"
                  subtitle="Select a row to see full details"
                  sample={view.isSample.recent}
                  action={
                    recent.length > 0 ? (
                      <button
                        onClick={() => { exportCsv(filtered); notify(`Exported ${filtered.length} ${filtered.length === 1 ? "booking" : "bookings"}`); }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <Icon name="download" size={16} />
                        Export CSV
                      </button>
                    ) : undefined
                  }
                >
                  {recent.length === 0 ? (
                    <EmptyState title="No recent bookings to show" hint="Return a recentBookings array from the dashboard API to list the latest bookings here." />
                  ) : (
                    <>
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
                          {(["all", "pending", "accepted", "completed", "cancelled"] as const).map((s) => (
                            <button
                              key={s}
                              role="tab"
                              aria-selected={statusFilter === s}
                              onClick={() => { setStatusFilter(s); setPage(0); }}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {s === "all" ? "All" : STATUS_STYLES[s].label}
                              <span className="ml-1.5 tabular-nums opacity-70">{s === "all" ? recent.length : statusCounts[s] ?? 0}</span>
                            </button>
                          ))}
                        </div>
                        <div className="relative md:hidden">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"><Icon name="search" size={16} /></span>
                          <input
                            type="search"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                            placeholder="Search bookings"
                            aria-label="Search bookings"
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                          />
                        </div>
                      </div>

                      <div className="-mx-5 overflow-x-auto sm:-mx-6">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead>
                            <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-xs font-medium text-slate-500">
                              <th className="px-5 py-2.5 font-medium sm:px-6">Booking</th>
                              <th className="px-3 py-2.5 font-medium">Customer</th>
                              <th className="px-3 py-2.5 font-medium">Service</th>
                              <th className="px-3 py-2.5 font-medium">Status</th>
                              <th className="px-3 py-2.5 text-right font-medium" aria-sort={sort.key === "amount" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                                <button onClick={() => toggleSort("amount")} className="inline-flex items-center gap-1 rounded hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                                  Amount <Icon name="sort" size={13} />
                                </button>
                              </th>
                              <th className="px-5 py-2.5 text-right font-medium sm:px-6" aria-sort={sort.key === "createdAt" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                                <button onClick={() => toggleSort("createdAt")} className="inline-flex items-center gap-1 rounded hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                                  Created <Icon name="sort" size={13} />
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pageRows.map((r) => (
                              <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer transition hover:bg-slate-50/80">
                                <td className="px-5 py-3 sm:px-6">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                                    className="rounded font-medium tabular-nums text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                  >
                                    {r.id}
                                  </button>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{initials(r.customer)}</span>
                                    <span className="text-slate-700">{r.customer}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <p className="text-slate-700">{r.service}</p>
                                  {r.provider && <p className="text-xs text-slate-500">{r.provider}</p>}
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[r.status].pill}`}>{STATUS_STYLES[r.status].label}</span>
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-900">{r.amount !== undefined ? formatCurrency(r.amount) : "â€”"}</td>
                                <td className="px-5 py-3 text-right text-xs text-slate-500 sm:px-6">{formatDateTime(r.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filtered.length === 0 && <p className="px-6 py-10 text-center text-sm text-slate-500">No bookings match your filters.</p>}
                      </div>

                      {filtered.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <p className="tabular-nums">
                            Showing {safePage * PAGE_SIZE + 1}â€“{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} aria-label="Previous page" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
                              <Icon name="left" size={14} />
                            </button>
                            <span className="px-2 tabular-nums">Page {safePage + 1} of {pageCount}</span>
                            <button onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
                              <Icon name="right" size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>

                <div className="space-y-6">
                  <Card title="Booking status" subtitle="Share of all bookings">
                    <Donut segments={m.segments} total={m.total} active={activeSeg} />
                    <ul className="mt-5 divide-y divide-slate-100">
                      {m.segments.map((s) => (
                        <li
                          key={s.label}
                          onMouseEnter={() => setActiveSeg(s.label)}
                          onMouseLeave={() => setActiveSeg(null)}
                          className="flex items-center gap-3 py-2.5 text-sm"
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="flex-1 text-slate-700">{s.label}</span>
                          <span className="font-semibold tabular-nums text-slate-900">{formatNumber(s.value)}</span>
                          <span className="w-12 text-right text-xs tabular-nums text-slate-500">{formatPercent(share(s.value, m.total))}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card title="Booking funnel" subtitle="How bookings move through the pipeline">
                    <ul className="space-y-4">
                      {funnel.map((f) => (
                        <li key={f.label}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-slate-700">{f.label}</span>
                            <span className="tabular-nums text-slate-500">
                              <span className="font-semibold text-slate-900">{formatNumber(f.value)}</span> Â· {formatPercent(f.pct)}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${Math.min(100, f.pct)}%`, backgroundColor: f.color }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <dt className="text-xs text-slate-500">Cancellation rate</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{formatPercent(m.cancellationRate)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Bookings per user</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{m.bookingsPerUser.toFixed(1)}</dd>
                      </div>
                    </dl>
                  </Card>
                </div>
              </div>

              {/* Weekly pattern, services, providers */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card title="Weekly pattern" subtitle={weekly ? `Busiest day: ${weekly.best.day}` : "Average bookings by weekday"} sample={view.isSample.trend}>
                  {weekly ? (
                    <div className="flex h-44 items-end gap-2.5" role="img" aria-label="Average bookings by weekday">
                      {weekly.rows.map((r) => {
                        const isBest = r.day === weekly.best.day;
                        return (
                          <div key={r.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-[11px] font-medium tabular-nums text-slate-500">{Math.round(r.avg)}</span>
                            <div className="flex w-full flex-1 items-end">
                              <div
                                className={`w-full rounded-md transition-[height] duration-500 motion-reduce:transition-none ${isBest ? "bg-blue-600" : "bg-slate-200"}`}
                                style={{ height: `${Math.max(4, (r.avg / weekly.top) * 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs ${isBest ? "font-semibold text-slate-900" : "text-slate-500"}`}>{r.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState title="Not enough trend data" hint="Needs at least 7 days of daily trend data." />
                  )}
                </Card>

                <Card title="Top services" subtitle="By number of bookings" sample={view.isSample.services}>
                  {!view.services || view.services.length === 0 ? (
                    <EmptyState title="No service data" hint="Return a topServices array with name and count." />
                  ) : (
                    <ul className="space-y-4">
                      {view.services.map((s) => {
                        const top = Math.max(...view.services!.map((x) => x.count), 1);
                        return (
                          <li key={s.name}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="text-slate-700">{s.name}</span>
                              <span className="font-semibold tabular-nums text-slate-900">{formatNumber(s.count)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(s.count / top) * 100}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                <Card title="Top providers" subtitle="By completed bookings" sample={view.isSample.providers}>
                  {!view.providers || view.providers.length === 0 ? (
                    <EmptyState title="No provider data" hint="Return a topProviders array with name, completed and rating." />
                  ) : (
                    <ul className="space-y-3.5">
                      {view.providers.map((p, i) => (
                        <li key={p.name} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{initials(p.name)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500">{formatNumber(p.completed)} completed</p>
                          </div>
                          {p.rating !== undefined ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-slate-700">
                              <span className="text-amber-500"><Icon name="star" size={14} /></span>
                              {p.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs tabular-nums text-slate-400">#{i + 1}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <p className="pb-4 text-xs text-slate-400">
                Totals and status counts are live{live ? " and refresh every minute while this tab is open" : " (auto-refresh is paused)"}.
                {sampleOn && " Sections tagged Sample show placeholder data for design preview only."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Booking detail drawer */}
      {selected && (
        <>
          <button aria-label="Close booking details" className="fixed inset-0 z-[60] cursor-default bg-slate-950/40" onClick={() => setSelected(null)} />
          <aside role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs text-slate-500">Booking</p>
                <h2 id="drawer-title" className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-slate-950">{selected.id}</h2>
              </div>
              <button ref={closeRef} onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${STATUS_STYLES[selected.status].pill}`}>
                {STATUS_STYLES[selected.status].label}
              </span>

              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {[
                  { k: "Customer", v: selected.customer },
                  { k: "Service", v: selected.service },
                  { k: "Provider", v: selected.provider ?? "Not assigned" },
                  { k: "Amount", v: selected.amount !== undefined ? formatCurrency(selected.amount) : "â€”" },
                  { k: "Created", v: formatDateTime(selected.createdAt) },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm">
                    <dt className="text-slate-500">{row.k}</dt>
                    <dd className="text-right font-medium text-slate-900">{row.v}</dd>
                  </div>
                ))}
              </dl>

              <p className="text-xs leading-5 text-slate-500">
                Actions like reassigning a provider or cancelling a booking will appear here once the Bookings module is connected.
              </p>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <button onClick={() => void copyId(selected.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <Icon name="copy" size={16} />
                Copy booking ID
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Toast */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[80] -translate-x-1/2">
        {toast && (
          <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>
        )}
      </div>
    </main>
  );
}
