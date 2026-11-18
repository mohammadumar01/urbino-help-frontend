"use client";

import { useMemo, useState } from "react";
import { btnPrimary, ErrorBanner, Icon, I, PageHeader, RefreshButton, Stats } from "@/components/admin/ui";
import { downloadCsv, money } from "@/lib/admin/format";
import { useApiQuery } from "@/lib/admin/hooks";

type Day = { day: string; bookings: number; completed: number; revenue: number };
type Report = {
  range: { from: string; to: string; days: number };
  totals: {
    bookings: number; completed: number; cancelled: number; revenue: number; commission: number; paid_orders: number;
    refunds: number; new_customers: number; new_providers: number; active_providers: number; avg_rating: number | null;
    reviews: number; guarantee_claims: number; support_tickets: number; completion_rate: number; cancel_rate: number; avg_order_value: number;
  };
  speed: { accept_minutes: number | null; travel_minutes: number | null; job_minutes: number | null };
  daily: Day[];
  by_status: { status: string; count: number }[];
  top_services: { name: string; bookings: number; completed: number; revenue: number }[];
  top_providers: { id: number; name: string; bookings: number; completed: number; cancelled: number; earnings: number; rating: number | null }[];
  payment_methods: { method: string; count: number; amount: number }[];
};

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
];

function istDate(offsetDays: number) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10);
}
const shortDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const mins = (m: number | null) => (m == null ? "—" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);

export default function AdminReportsPage() {
  const [range, setRange] = useState("30");
  const from = istDate(-(Number(range) - 1));
  const to = istDate(0);
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery<Report>(`/api/admin/reports?from=${from}&to=${to}`);
  const t = data?.totals;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader section="Finance" title="Reports" subtitle="How the business is doing: bookings, revenue, speed of service and top performers." updated={updated}>
        <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${range === r.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
        <button
          type="button"
          disabled={!data}
          className={btnPrimary}
          onClick={() =>
            data &&
            downloadCsv(
              `urbino-report-${data.range.from}-to-${data.range.to}.csv`,
              ["Date", "Bookings", "Completed", "Revenue"],
              data.daily.map((d) => [d.day, d.bookings, d.completed, d.revenue])
            )
          }
        >
          <Icon d={I.download} /> Export CSV
        </button>
      </PageHeader>

      {error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ErrorBanner title="We couldn't load the report" message={error} onRetry={() => void retry()} />
        </div>
      )}

      <Stats
        loading={loading}
        items={[
          { label: "Revenue collected", value: money(t?.revenue), caption: `${t?.paid_orders ?? 0} paid orders · avg ${money(t?.avg_order_value)}` },
          { label: "Urbino commission", value: money(t?.commission), caption: t?.refunds ? `${money(t.refunds)} refunded` : "No refunds", tone: "text-indigo-700" },
          { label: "Bookings", value: String(t?.bookings ?? "–"), caption: `${t?.completion_rate ?? 0}% completed · ${t?.cancel_rate ?? 0}% cancelled` },
          { label: "Customer rating", value: t?.avg_rating ? `${t.avg_rating} ★` : "—", caption: `${t?.reviews ?? 0} reviews · ${t?.guarantee_claims ?? 0} rework claims` },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Bookings per day" days={data?.daily} value={(d) => d.bookings} format={(v) => `${v} booking${v === 1 ? "" : "s"}`} loading={loading} />
        <ChartCard title="Revenue per day" days={data?.daily} value={(d) => d.revenue} format={(v) => money(v)} loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Speed of service">
          <dl className="space-y-3 text-sm">
            <Line label="Provider accepts a booking in" value={mins(data?.speed.accept_minutes ?? null)} />
            <Line label="Professional travel time" value={mins(data?.speed.travel_minutes ?? null)} />
            <Line label="Average job length" value={mins(data?.speed.job_minutes ?? null)} />
          </dl>
        </Panel>
        <Panel title="Growth">
          <dl className="space-y-3 text-sm">
            <Line label="New customers" value={String(t?.new_customers ?? "—")} />
            <Line label="New providers" value={String(t?.new_providers ?? "—")} />
            <Line label="Providers with bookings" value={String(t?.active_providers ?? "—")} />
            <Line label="Support tickets" value={String(t?.support_tickets ?? "—")} />
          </dl>
        </Panel>
        <Panel title="How customers pay">
          {data?.payment_methods.length ? (
            <ul className="space-y-3 text-sm">
              {data.payment_methods.map((m) => {
                const total = data.payment_methods.reduce((n, x) => n + x.amount, 0) || 1;
                const pct = Math.round((m.amount / total) * 100);
                return (
                  <li key={m.method}>
                    <div className="flex justify-between">
                      <span className="text-slate-700">{m.method} · {m.count}</span>
                      <span className="font-medium tabular-nums text-slate-900">{money(m.amount)} <span className="text-slate-500">({pct}%)</span></span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No payments in this period.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top services" pad={false}>
          <Table
            head={["Service", "Bookings", "Done", "Revenue"]}
            rows={(data?.top_services ?? []).map((s) => [s.name, s.bookings, s.completed, money(s.revenue)])}
            empty="No bookings in this period."
          />
        </Panel>
        <Panel title="Top providers" pad={false}>
          <Table
            head={["Provider", "Bookings", "Done", "Rating", "Earned"]}
            rows={(data?.top_providers ?? []).map((p) => [p.name, p.bookings, p.completed, p.rating ? `${p.rating} ★` : "—", money(p.earnings)])}
            empty="No provider activity in this period."
          />
        </Panel>
      </div>
    </div>
  );
}

/** Ek series ka bar chart (har din ek bar) + hover tooltip. Do alag measures = do alag charts (dual axis nahi). */
function ChartCard({ title, days, value, format, loading }: { title: string; days?: Day[]; value: (d: Day) => number; format: (v: number) => string; loading: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const vals = useMemo(() => (days ?? []).map(value), [days, value]);
  const max = Math.max(1, ...vals);
  const total = vals.reduce((a, b) => a + b, 0);
  const n = vals.length || 1;
  const W = 600;
  const H = 180;
  const gap = n > 45 ? 1 : 2;
  const bw = Math.max(1, W / n - gap);
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{loading ? "–" : format(total)}</p>
        </div>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {showTable ? (
        <div className="mt-3 max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {(days ?? []).map((d, i) => (
                <tr key={d.day}>
                  <td className="py-1.5 text-slate-600">{shortDay(d.day)}</td>
                  <td className="py-1.5 text-right text-slate-900">{format(vals[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${W + 40} ${H + 24}`} className="h-52 w-full" role="img" aria-label={`${title}: ${format(total)} in total`} onMouseLeave={() => setHover(null)}>
            {ticks.map((tk) => {
              const y = H - (tk / max) * H;
              return (
                <g key={tk}>
                  <line x1={40} x2={W + 40} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />
                  <text x={34} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">{tk >= 1000 ? `${Math.round(tk / 100) / 10}k` : tk}</text>
                </g>
              );
            })}
            {vals.map((v, i) => {
              const h = (v / max) * H;
              const x = 40 + i * (W / n) + gap / 2;
              return (
                <g key={i} onMouseEnter={() => setHover(i)}>
                  {/* bada hit area, patla bar */}
                  <rect x={40 + i * (W / n)} y={0} width={W / n} height={H} fill="transparent" />
                  {v > 0 && (
                    <path
                      d={`M${x},${H} V${H - h + Math.min(4, h)} q0,-${Math.min(4, h)} ${Math.min(4, bw / 2)},-${Math.min(4, h)} H${x + bw - Math.min(4, bw / 2)} q${Math.min(4, bw / 2)},0 ${Math.min(4, bw / 2)},${Math.min(4, h)} V${H} Z`}
                      fill={hover === i ? "#3730a3" : "#4f46e5"}
                    />
                  )}
                </g>
              );
            })}
            <line x1={40} x2={W + 40} y1={H} y2={H} stroke="#94a3b8" strokeWidth={1} />
            {days && days.length > 0 && (
              <>
                <text x={40} y={H + 18} fontSize={11} fill="#64748b">{shortDay(days[0].day)}</text>
                <text x={W + 40} y={H + 18} fontSize={11} fill="#64748b" textAnchor="end">{shortDay(days[days.length - 1].day)}</text>
              </>
            )}
          </svg>
          {hover != null && days?.[hover] && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: `${((40 + (hover + 0.5) * (W / n)) / (W + 40)) * 100}%` }}
            >
              <p className="font-semibold">{shortDay(days[hover].day)}</p>
              <p className="tabular-nums">{format(vals[hover])}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Panel({ title, children, pad = true }: { title: string; children: React.ReactNode; pad?: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">{title}</h2>
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: (string | number)[][]; empty: string }) {
  if (!rows.length) return <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          {head.map((h, i) => (
            <th key={h} className={`px-5 py-2.5 font-semibold ${i ? "text-right" : "text-left"}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 tabular-nums">
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={`px-5 py-2.5 ${j ? "text-right text-slate-700" : "font-medium text-slate-900"}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
