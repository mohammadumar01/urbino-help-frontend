"use client";

import { Suspense, useRef, useState } from "react";
import {
  btnPrimary, ConfirmDialog, EmptyState, ErrorBanner, Icon, I, PageHeader, Pagination, ProgressBar,
  RefreshButton, SearchInput, SkeletonRows, Stats, Toast,
} from "@/components/admin/ui";
import { api } from "@/lib/admin/api";
import { downloadCsv, formatDateTime, money } from "@/lib/admin/format";
import { useApiQuery, useDebouncedUrlSearch, useHotkeys, usePersisted, useToast, useUrlState } from "@/lib/admin/hooks";

type PaymentRow = {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  payment_status: "pending" | "successful" | "failed" | "refund_pending" | "refunded";
  gateway: string | null;
  transaction_id: string | null;
  gateway_payment_id: string | null;
  failure_reason: string | null;
  platform_fee: number | null;
  provider_earning: number | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  provider_name: string | null;
  service_name: string;
  booking_status: string;
};

type Summary = {
  collected: number;
  platform_fees: number;
  provider_earnings: number;
  refund_pending_amount: number;
  refunded: number;
  pending_count: number;
  failed_count: number;
  refund_pending_count: number;
};

type Resp = {
  totalPayments: number;
  totalPages: number;
  summary: Summary;
  payments: PaymentRow[];
};

const PAGE_SIZES = [20, 50, 100];
const DEFAULTS = { q: "", status: "", method: "", page: "1" };

const STATUS_PILL: Record<PaymentRow["payment_status"], [string, string]> = {
  successful: ["Paid", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"],
  pending: ["Pending", "bg-amber-50 text-amber-700 ring-amber-600/20"],
  failed: ["Failed", "bg-rose-50 text-rose-700 ring-rose-600/20"],
  refund_pending: ["Refund due", "bg-violet-50 text-violet-700 ring-violet-600/20"],
  refunded: ["Refunded", "bg-slate-100 text-slate-600 ring-slate-500/20"],
};

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsView />
    </Suspense>
  );
}

function PaymentsView() {
  const [url, setUrl] = useUrlState(DEFAULTS);
  const [search, setSearch] = useDebouncedUrlSearch(url.q, (q) => setUrl({ q, page: "1" }));
  const [pageSize, setPageSize] = usePersisted("payments:pageSize", 20, PAGE_SIZES);
  const [confirm, setConfirm] = useState<PaymentRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast, notify, dismiss } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const page = Math.max(1, Number(url.page) || 1);
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    search: url.q,
    status: url.status,
    method: url.method,
  });
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery<Resp>(`/api/payment?${qs}`, 60_000);

  useHotkeys({ r: () => void reload(), "/": () => searchRef.current?.focus() });

  const rows = data?.payments ?? [];
  const s = data?.summary;
  const total = data?.totalPayments ?? 0;
  const hasFilters = url.q !== "" || url.status !== "" || url.method !== "";

  async function doRefund(p: PaymentRow) {
    setBusy(true);
    try {
      const r = await api<{ message: string }>(`/api/payment/${p.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: "Refunded by Urbino support" }),
      });
      notify("success", `${r.message} for booking #${p.booking_id}.`);
      setConfirm(null);
      void reload();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Refund failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader section="Finance" title="Payments" subtitle="Online and cash payments, commission and refunds." updated={updated}>
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
        <button
          type="button"
          disabled={rows.length === 0}
          className={btnPrimary}
          onClick={() =>
            downloadCsv(
              "urbino-payments.csv",
              ["Payment ID", "Booking", "Customer", "Provider", "Service", "Amount", "Method", "Status", "Platform fee", "Provider earning", "Transaction", "Paid at"],
              rows.map((p) => [
                p.id, p.booking_id, p.customer_name, p.provider_name, p.service_name, p.amount, p.payment_method,
                p.payment_status, p.platform_fee, p.provider_earning, p.gateway_payment_id || p.transaction_id, p.paid_at,
              ])
            )
          }
        >
          <Icon d={I.download} /> Export CSV
        </button>
      </PageHeader>

      <Stats
        loading={loading}
        items={[
          { label: "Collected", value: money(s?.collected), caption: "All successful payments", tone: "text-emerald-700" },
          { label: "Platform commission", value: money(s?.platform_fees), caption: "Urbino's share" },
          { label: "Provider earnings", value: money(s?.provider_earnings), caption: "To be paid out to providers" },
          {
            label: "Refunds due",
            value: s ? `${s.refund_pending_count}` : "—",
            caption: s && s.refund_pending_count ? `${money(s.refund_pending_amount)} to return` : "Nothing to refund",
            tone: s?.refund_pending_count ? "text-violet-700" : "",
          },
        ]}
      />

      <section className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ProgressBar active={refreshing} />

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <SearchInput inputRef={searchRef} value={search} onChange={setSearch} label="Search payments" placeholder="Customer, service, booking or txn ID" />
          <select
            aria-label="Filter by status"
            value={url.status}
            onChange={(e) => setUrl({ status: e.target.value, page: "1" })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="successful">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refund_pending">Refund due</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            aria-label="Filter by method"
            value={url.method}
            onChange={(e) => setUrl({ method: e.target.value, page: "1" })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">All methods</option>
            <option value="ONLINE">Online</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI (legacy)</option>
          </select>
          {hasFilters && (
            <button type="button" onClick={() => setUrl({ q: "", status: "", method: "", page: "1" })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Reset filters
            </button>
          )}
        </div>

        {error && <ErrorBanner title="We couldn't load payments" message={error} onRetry={() => void retry()} />}

        <div className="overflow-x-auto">
          <table className={`w-full min-w-[920px] text-left text-sm transition-opacity ${refreshing ? "opacity-60" : ""}`}>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Booking</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <SkeletonRows cols={7} />}
              {!loading &&
                rows.map((p) => {
                  const [label, pill] = STATUS_PILL[p.payment_status] ?? ["Unknown", "bg-slate-100 text-slate-600"];
                  return (
                    <tr key={p.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">#{p.booking_id} · {p.service_name}</p>
                        <p className="text-xs text-slate-500">{p.provider_name ? `Provider: ${p.provider_name}` : "No provider"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{p.customer_name || "—"}</p>
                        <p className="text-xs text-slate-500">{p.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <p className="font-semibold text-slate-900">{money(p.amount)}</p>
                        {p.platform_fee != null && (
                          <p className="text-xs text-slate-500">Fee {money(p.platform_fee)} · Provider {money(p.provider_earning ?? undefined)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{p.payment_method}</p>
                        <p className="max-w-[160px] truncate text-xs text-slate-500" title={p.gateway_payment_id || p.transaction_id || ""}>
                          {p.gateway_payment_id || p.transaction_id || p.gateway || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${pill}`}>{label}</span>
                        {p.failure_reason && <p className="mt-1 max-w-[200px] text-xs text-slate-500">{p.failure_reason}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDateTime(p.paid_at || p.created_at)}
                        {p.refunded_at && <p className="text-violet-700">Refunded {formatDateTime(p.refunded_at)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(p.payment_status === "successful" || p.payment_status === "refund_pending") && (
                          <button
                            type="button"
                            onClick={() => setConfirm(p)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {p.payment_status === "successful" ? "Refund" : "Mark refunded"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title={hasFilters ? "No payments match these filters" : "No payments yet"}
            text={hasFilters ? "Try a different status or search." : "Payments appear here once customers pay for bookings."}
          />
        )}

        {!loading && total > 0 && (
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            first={(page - 1) * pageSize + 1}
            last={(page - 1) * pageSize + rows.length}
            total={total}
            busy={refreshing}
            onPage={(n) => setUrl({ page: String(n) })}
            onPageSize={(n) => {
              setPageSize(n);
              setUrl({ page: "1" });
            }}
          />
        )}
      </section>

      {confirm && (
        <ConfirmDialog
          tone={confirm.payment_status === "successful" ? "danger" : "success"}
          title={confirm.payment_status === "successful" ? `Refund ${money(confirm.amount)}?` : "Mark this refund as done?"}
          body={
            confirm.payment_status === "successful"
              ? confirm.gateway === "razorpay" || confirm.gateway === "mock"
                ? `The money goes back to ${confirm.customer_name || "the customer"} through the original payment method. This cannot be undone.`
                : `This is a ${confirm.payment_method} payment. It will be marked "Refund due" until you return the money and mark it refunded.`
              : `Confirm you have returned ${money(confirm.amount)} to ${confirm.customer_name || "the customer"}.`
          }
          confirmLabel={confirm.payment_status === "successful" ? "Refund" : "Mark refunded"}
          busy={busy}
          onConfirm={() => void doRefund(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
