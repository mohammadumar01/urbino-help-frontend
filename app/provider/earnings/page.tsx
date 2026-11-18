"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Info, Loader2 } from "lucide-react";
import ProviderShell, { Card, Notice } from "@/components/provider/ProviderShell";
import api, { apiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

type Summary = {
  paid_jobs: number;
  gross: number;
  commission: number;
  net: number;
  net_today: number;
  net_7d: number;
  net_30d: number;
  cash_collected: number;
  online_collected: number;
};
type Payment = {
  id: number;
  booking_id: number;
  service_name: string;
  customer_name: string | null;
  agent_name: string | null;
  payment_method: string;
  amount: number;
  platform_fee: number;
  provider_earning: number;
  paid_at: string | null;
};
type Payout = { id: number; direction: "to_provider" | "from_provider"; amount: number; reference: string | null; note: string | null; created_at: string };
type Balance = { online_earning: number; cash_fee: number; paid_out: number; received: number; balance: number };
type Resp = { summary: Summary; payments: Payment[]; payouts: Payout[]; balance: Balance | null };

const inr = (n: number | undefined) => {
  const v = Number(n ?? 0);
  const d = Number.isInteger(v) ? 0 : 2;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
const day = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

export default function ProviderEarningsPage() {
  return (
    <ProviderShell title="Earnings" subtitle="What you earned, Urbino's commission, and your settlement balance.">
      <Earnings />
    </ProviderShell>
  );
}

function Earnings() {
  const t = useT();
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Resp>("/api/payment/provider/earnings")
      .then((r) => setData(r.data))
      .catch((e) => setError(apiError(e, "Could not load your earnings.")));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data)
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={15} className="animate-spin" /> Loading…
      </p>
    );

  const s = data.summary;
  const bal = data.balance?.balance ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("Today")} value={inr(s.net_today)} />
        <Stat label={t("Last 7 days")} value={inr(s.net_7d)} />
        <Stat label={t("Last 30 days")} value={inr(s.net_30d)} />
        <Stat label={t("All time")} value={inr(s.net)} caption={t("{n} paid jobs", { n: s.paid_jobs })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-950">{t("Paid jobs")}</h2>
            <p className="text-sm text-gray-500">
              {t("Customers paid")} {inr(s.gross)} · {t("Urbino commission")} {inr(s.commission)} · {t("You earned")} <b className="text-gray-900">{inr(s.net)}</b>
            </p>
          </div>
          {data.payments.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">{t("No paid jobs yet. Earnings show up here once customers pay.")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.payments.map((p) => {
                const cash = p.payment_method === "CASH";
                return (
                  <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cash ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {cash ? <Banknote size={17} /> : <CreditCard size={17} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {p.service_name} <span className="font-normal text-gray-400">#{p.booking_id}</span>
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {day(p.paid_at)} · {t(cash ? "Cash" : "Online")}
                          {p.customer_name ? ` · ${p.customer_name}` : ""}
                          {p.agent_name ? ` · ${t("by")} ${p.agent_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p className="font-bold text-gray-950">{inr(p.provider_earning)}</p>
                      <p className="text-xs text-gray-500">
                        {t("of")} {inr(p.amount)} · {t("fee")} {inr(p.platform_fee)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold text-gray-500">{t("Settlement balance")}</p>
            {bal === 0 ? (
              <>
                <p className="mt-1 text-3xl font-bold text-gray-950">{t("All settled")}</p>
                <p className="mt-1 text-sm text-gray-500">{t("Nothing due either way.")}</p>
              </>
            ) : bal > 0 ? (
              <>
                <p className="mt-1 text-3xl font-bold text-emerald-700">{inr(bal)}</p>
                <p className="mt-1 text-sm text-gray-600">{t("Urbino will pay this to your bank account in the next weekly payout.")}</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-3xl font-bold text-amber-700">{inr(-bal)}</p>
                <p className="mt-1 text-sm text-gray-600">{t("Commission due on cash jobs. Pay Urbino by UPI; it is recorded within a day.")}</p>
              </>
            )}
            <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <Line label={t("Earned on online jobs")} value={inr(data.balance?.online_earning)} />
              <Line label={t("Commission on cash jobs")} value={`− ${inr(data.balance?.cash_fee)}`} />
              <Line label={t("Already paid to you")} value={`− ${inr(data.balance?.paid_out)}`} />
              <Line label={t("Already paid by you")} value={`+ ${inr(data.balance?.received)}`} />
            </dl>
            <p className="mt-4 flex gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <Info size={14} className="mt-0.5 shrink-0" />
              {t("Online payments reach Urbino first, so we send you your share. With cash, you already hold the money, so only Urbino\'s commission is due.")}
            </p>
          </Card>

          <Card className="p-0">
            <h2 className="border-b border-gray-100 px-6 py-4 text-lg font-bold text-gray-950">{t("Settlements")}</h2>
            {data.payouts.length === 0 ? (
              <p className="px-6 py-6 text-sm text-gray-500">{t("No settlements yet.")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      {p.direction === "to_provider" ? (
                        <ArrowDownLeft size={17} className="text-emerald-600" aria-hidden />
                      ) : (
                        <ArrowUpRight size={17} className="text-amber-600" aria-hidden />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t(p.direction === "to_provider" ? "Received from Urbino" : "Paid to Urbino")}</p>
                        <p className="text-xs text-gray-500">
                          {day(p.created_at)}
                          {p.reference ? ` · Ref ${p.reference}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold tabular-nums text-gray-950">{inr(p.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-950">{value}</p>
      {caption && <p className="text-xs text-gray-500">{caption}</p>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium tabular-nums text-gray-900">{value}</dd>
    </div>
  );
}
