"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, RotateCcw } from "lucide-react";
import api, { apiError } from "@/lib/api";

type Claim = {
  id: number;
  booking_id: number;
  reason: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: "requested" | "accepted" | "escalated";
  service_name: string;
  address: string;
  customer_name: string;
  customer_phone: string | null;
  agent_name: string | null;
  created_at: string;
};

/** Provider dashboard par: customer ne free rework maanga hai -> schedule karo ya mana karo. */
export default function ReworkRequests({ onScheduled }: { onScheduled?: () => void }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ claims: Claim[] }>("/api/claims/provider", { params: { status: "requested" } });
      setClaims(r.data.claims);
    } catch {
      /* panel optional hai */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (claims.length === 0 && !msg) return null;

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <h2 className="flex items-center gap-2 font-bold text-gray-950">
        <RotateCcw size={18} className="text-amber-600" /> Rework requests ({claims.length})
      </h2>
      <p className="text-sm text-gray-600">Customers covered by the 7-day guarantee. Fixing quickly protects your rating.</p>
      {msg && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${msg.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>
      )}
      <ul className="mt-4 space-y-3">
        {claims.map((c) => (
          <ClaimCard
            key={c.id}
            claim={c}
            onDone={(text, tone) => {
              setMsg({ tone, text });
              if (tone === "ok") {
                void load();
                onScheduled?.();
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function ClaimCard({ claim: c, onDone }: { claim: Claim; onDone: (text: string, tone: "ok" | "err") => void }) {
  // Date.now render mein nahi: ek baar state banate waqt
  const [{ tomorrow, today }] = useState(() => ({
    tomorrow: new Date(Date.now() + 29.5 * 3600 * 1000).toISOString().slice(0, 10),
    today: new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10),
  }));
  const [mode, setMode] = useState<"view" | "accept" | "reject">("view");
  const [date, setDate] = useState(c.preferred_date?.slice(0, 10) || tomorrow);
  const [time, setTime] = useState(c.preferred_time || "10:00");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(kind: "accept" | "reject") {
    setBusy(true);
    try {
      const r = await api.put<{ message: string }>(
        `/api/claims/${c.id}/${kind}`,
        kind === "accept" ? { booking_date: date, booking_time: time, note } : { note }
      );
      onDone(r.data.message, "ok");
    } catch (e) {
      onDone(apiError(e, "Could not update the request."), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-400">BOOKING #{c.booking_id}</p>
          <p className="font-semibold text-gray-950">{c.service_name}</p>
          <p className="text-sm text-gray-600">
            {c.customer_name}
            {c.agent_name ? ` · done by ${c.agent_name}` : ""}
          </p>
        </div>
        {c.customer_phone && (
          <a href={`tel:${c.customer_phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
            <Phone size={13} /> Call
          </a>
        )}
      </div>
      <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">“{c.reason}”</p>

      {mode === "view" && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setMode("accept")} className="flex-1 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">
            Schedule free fix
          </button>
          <button type="button" onClick={() => setMode("reject")} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">
            Decline
          </button>
        </div>
      )}

      {mode === "accept" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-gray-600">
            Date
            <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          <button type="button" disabled={busy} onClick={() => void go("accept")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy && <Loader2 size={14} className="animate-spin" />} Confirm
          </button>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the customer (optional)" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 sm:col-span-3" />
        </div>
      )}

      {mode === "reject" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Why can't you fix this? Urbino support will review it."
            aria-label="Reason for declining"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("view")} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              Back
            </button>
            <button
              type="button"
              disabled={busy || note.trim().length < 10}
              onClick={() => void go("reject")}
              className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send to Urbino support
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
