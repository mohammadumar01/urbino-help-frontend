"use client";

import { FormEvent, useState } from "react";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import api, { apiError } from "@/lib/api";

type Props = {
  bookingId: number;
  canClaim?: boolean;
  claimStatus?: "requested" | "accepted" | "rejected" | "escalated" | null;
  claimNote?: string | null;
  isRework?: boolean;
  onChange?: () => void;
};

const QUICK = ["Problem came back", "Work left incomplete", "Something was damaged", "Not cleaned properly"];

/** Completed booking par: 7 din ki free rework guarantee. */
export default function GuaranteeBox({ bookingId, canClaim, claimStatus, claimNote, isRework, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  if (isRework) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <ShieldCheck size={16} /> Free rework under the Urbino service guarantee.
      </p>
    );
  }

  if (sent || claimStatus === "requested") {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <RotateCcw size={16} /> {sent || "Rework requested. Your provider will schedule a free fix soon."}
      </p>
    );
  }
  if (claimStatus === "accepted") {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <ShieldCheck size={16} /> Free rework scheduled — see the new booking above.{claimNote ? ` Note: ${claimNote}` : ""}
      </p>
    );
  }
  if (claimStatus === "escalated" || claimStatus === "rejected") {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
        <ShieldCheck size={16} /> Urbino support is reviewing your request and will call you within 24 hours.
      </p>
    );
  }
  if (!canClaim) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string }>("/api/claims", { booking_id: bookingId, reason: reason.trim() });
      setSent(r.data.message);
      onChange?.();
    } catch (err) {
      setError(apiError(err, "Could not send your request."));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
      >
        <RotateCcw size={15} /> Not happy with the work? Get a free fix (7-day guarantee)
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="font-semibold text-gray-950">What went wrong?</p>
      <p className="text-xs text-gray-500">Your provider will send a professional to fix it for free.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setReason((r) => (r ? r : `${q}: `))}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-400"
          >
            {q}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={1000}
        aria-label="Describe the problem"
        placeholder="For example: AC is leaking water again since yesterday"
        className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
      />
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || reason.trim().length < 10}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 size={15} className="animate-spin" />} Request free fix
        </button>
      </div>
    </form>
  );
}
