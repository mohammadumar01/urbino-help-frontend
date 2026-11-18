"use client";

import { FormEvent, useState } from "react";
import {
  btnPrimary, btnSecondary, EmptyState, ErrorBanner, Icon, I, inputCls, Overlay, PageHeader, RefreshButton,
  SkeletonRows, Stats, Toast,
} from "@/components/admin/ui";
import { api } from "@/lib/admin/api";
import { downloadCsv, formatDateTime, money } from "@/lib/admin/format";
import { useApiQuery, useToast } from "@/lib/admin/hooks";

type Row = {
  provider_id: number;
  provider_name: string;
  provider_email: string;
  provider_phone: string | null;
  online_earning: number;
  cash_fee: number;
  paid_out: number;
  received: number;
  balance: number;
  last_payout_at: string | null;
};

type Resp = { providers: Row[]; totals: { to_pay: number; to_receive: number } };

export default function AdminPayoutsPage() {
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery<Resp>("/api/payment/admin/payouts", 60_000);
  const { toast, notify, dismiss } = useToast();
  const [settling, setSettling] = useState<Row | null>(null);

  const rows = data?.providers ?? [];
  const toPay = rows.filter((r) => r.balance > 0).length;
  const toCollect = rows.filter((r) => r.balance < 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        section="Finance"
        title="Provider payouts"
        subtitle="What Urbino owes each provider for online jobs, and the commission they owe on cash jobs."
        updated={updated}
      >
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
        <button
          type="button"
          disabled={rows.length === 0}
          className={btnPrimary}
          onClick={() =>
            downloadCsv(
              "urbino-provider-payouts.csv",
              ["Provider", "Email", "Online earnings", "Commission on cash", "Paid out", "Received", "Balance"],
              rows.map((r) => [r.provider_name, r.provider_email, r.online_earning, r.cash_fee, r.paid_out, r.received, r.balance])
            )
          }
        >
          <Icon d={I.download} /> Export CSV
        </button>
      </PageHeader>

      <Stats
        loading={loading}
        items={[
          { label: "Urbino has to pay", value: money(data?.totals.to_pay), caption: `${toPay} provider${toPay === 1 ? "" : "s"}`, tone: "text-indigo-700" },
          { label: "To collect", value: money(data?.totals.to_receive), caption: `Commission on cash jobs · ${toCollect} provider${toCollect === 1 ? "" : "s"}`, tone: "text-amber-700" },
          { label: "Providers with a balance", value: String(toPay + toCollect), caption: "Settle weekly to keep partners happy" },
          { label: "Settled", value: String(rows.length - toPay - toCollect), caption: "Nothing due either way" },
        ]}
      />

      <section className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {error && <ErrorBanner title="We couldn't load payouts" message={error} onRetry={() => void retry()} />}
        <div className="overflow-x-auto">
          <table className={`w-full min-w-[860px] text-left text-sm ${refreshing ? "opacity-60" : ""}`}>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 text-right font-semibold">Online earnings</th>
                <th className="px-4 py-3 text-right font-semibold">Commission on cash</th>
                <th className="px-4 py-3 text-right font-semibold">Settled so far</th>
                <th className="px-4 py-3 text-right font-semibold">Balance</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {loading && <SkeletonRows cols={6} />}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.provider_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.provider_name}</p>
                      <p className="text-xs text-slate-500">
                        {r.provider_email}
                        {r.last_payout_at ? ` · last settled ${formatDateTime(r.last_payout_at)}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">{money(r.online_earning)}</td>
                    <td className="px-4 py-3 text-right text-slate-800">{money(r.cash_fee)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {r.paid_out > 0 && <p>Paid {money(r.paid_out)}</p>}
                      {r.received > 0 && <p>Received {money(r.received)}</p>}
                      {!r.paid_out && !r.received && "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.balance === 0 ? (
                        <span className="text-slate-500">Settled</span>
                      ) : r.balance > 0 ? (
                        <>
                          <p className="font-semibold text-indigo-700">{money(r.balance)}</p>
                          <p className="text-xs text-slate-500">Urbino pays</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-amber-700">{money(-r.balance)}</p>
                          <p className="text-xs text-slate-500">Provider pays</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.balance !== 0 && (
                        <button type="button" onClick={() => setSettling(r)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {r.balance > 0 ? "Record payout" : "Record payment"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && !error && rows.length === 0 && (
          <EmptyState title="Nothing to settle yet" text="Balances appear once customers pay for completed jobs." />
        )}
      </section>

      {settling && (
        <SettleDialog
          row={settling}
          onClose={() => setSettling(null)}
          onDone={(text) => {
            setSettling(null);
            notify("success", text);
            void reload();
          }}
          onError={(text) => notify("error", text)}
        />
      )}
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function SettleDialog({
  row,
  onClose,
  onDone,
  onError,
}: {
  row: Row;
  onClose: () => void;
  onDone: (text: string) => void;
  onError: (text: string) => void;
}) {
  const toProvider = row.balance > 0;
  const due = Math.abs(row.balance);
  const [amount, setAmount] = useState(String(due));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const n = Number(amount);
  const invalid = !Number.isFinite(n) || n <= 0 || n > due;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (invalid) return;
    setBusy(true);
    try {
      await api("/api/payment/admin/payouts", {
        method: "POST",
        body: JSON.stringify({
          provider_id: row.provider_id,
          direction: toProvider ? "to_provider" : "from_provider",
          amount: n,
          reference,
          note,
        }),
      });
      onDone(`${money(n)} ${toProvider ? "paid to" : "received from"} ${row.provider_name}. They have been notified.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not record the settlement.");
      setBusy(false);
    }
  }

  return (
    <Overlay side="center" labelledBy="settle-title" onClose={onClose} locked={busy}>
      <form onSubmit={submit}>
        <h2 id="settle-title" className="text-lg font-semibold">
          {toProvider ? `Pay ${row.provider_name}` : `Payment from ${row.provider_name}`}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          {toProvider
            ? `Send the money by bank transfer or UPI first, then record it here. Due: ${money(due)}.`
            : `Commission on cash jobs. Record it after you receive the money. Due: ${money(due)}.`}
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="settle-amount">
          Amount (₹)
        </label>
        <input id="settle-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`mt-1 ${inputCls(amount && invalid ? "x" : undefined)}`} />
        {amount && invalid && <p className="mt-1 text-xs text-red-600">Enter an amount between ₹1 and {money(due)}.</p>}
        <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="settle-ref">
          UTR / UPI reference
        </label>
        <input id="settle-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 4123 5678 9012" className={`mt-1 ${inputCls()}`} />
        <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="settle-note">
          Note (optional)
        </label>
        <input id="settle-note" value={note} onChange={(e) => setNote(e.target.value)} className={`mt-1 ${inputCls()}`} />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy || invalid} className={btnPrimary}>
            {busy ? "Saving…" : toProvider ? "Record payout" : "Record payment"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
