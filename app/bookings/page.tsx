"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, Clock3, KeyRound, Loader2, MapPin, PackageCheck, Phone,
  Plus, RefreshCw, Star, X, XCircle,
} from "lucide-react";

import api, { apiError } from "@/lib/api";
import RequireRole from "@/components/auth/RequireRole";
import Navbar from "@/components/layout/Navbar";
import JobTimeline from "@/components/booking/JobTimeline";
import GuaranteeBox from "@/components/booking/GuaranteeBox";
import LiveTracking from "@/components/maps/LiveTracking";
import PaymentActions, { PaymentBadge } from "@/components/payments/PaymentActions";
import { getSlots } from "@/lib/providerApi";
import { useLang, useT } from "@/lib/i18n";
import type { PaymentStatus } from "@/lib/paymentsApi";

interface Booking {
  id: number;
  service_name?: string;
  address?: string;
  booking_date?: string;
  booking_time?: string;
  status?: string;
  created_at?: string;
  price?: string | number | null;
  provider_id?: number;
  provider_name?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  has_review?: boolean;
  start_otp?: string | null;
  rework_of?: number | null;
  can_claim?: boolean;
  claim_status?: "requested" | "accepted" | "rejected" | "escalated" | null;
  claim_note?: string | null;
  provider_accepted_at?: string | null;
  agent_accepted_at?: string | null;
  on_the_way_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  payment_status?: PaymentStatus | null;
  payment_method?: string | null;
}

type Tab = "active" | "completed" | "cancelled";

const ACTIVE = ["pending", "provider_accepted", "agent_assigned", "agent_accepted", "on_the_way", "in_progress"];
const MANAGEABLE = ["pending", "provider_accepted"];

/** Customer ko samajh aane wali status line */
const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Waiting for confirmation", cls: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  provider_accepted: { label: "Confirmed", cls: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  agent_assigned: { label: "Professional assigned", cls: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  agent_accepted: { label: "Professional confirmed", cls: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  on_the_way: { label: "On the way", cls: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  in_progress: { label: "Work in progress", cls: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-600 ring-gray-500/20" },
};

const inr = (v?: string | number | null) => (v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`);

function time12(t?: string) {
  if (!t) return "";
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function istToday(offset = 0) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + offset * 86400000).toISOString().slice(0, 10);
}

function dayText(date: string | undefined, hi: boolean) {
  if (!date) return "";
  const d = date.slice(0, 10);
  if (d === istToday()) return hi ? "आज" : "Today";
  if (d === istToday(1)) return hi ? "कल" : "Tomorrow";
  return new Date(`${d}T00:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function BookingsPage() {
  return (
    <RequireRole roles={["customer"]}>
      <Navbar />
      <BookingsContent />
    </RequireRole>
  );
}

function BookingsContent() {
  const t = useT();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      const r = await api.get<{ bookings: Booking[] }>("/api/booking/my-bookings");
      setBookings(r.data.bookings || []);
      setError("");
    } catch (e) {
      if (!silent) setError(apiError(e, "Unable to load your bookings."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void fetchBookings(), 0);
    const timer = setInterval(() => !document.hidden && void fetchBookings(true), 15000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [fetchBookings]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const groups = useMemo(() => {
    const g: Record<Tab, Booking[]> = { active: [], completed: [], cancelled: [] };
    for (const b of bookings) {
      const s = b.status || "pending";
      if (s === "completed") g.completed.push(b);
      else if (s === "cancelled") g.cancelled.push(b);
      else if (ACTIVE.includes(s)) g.active.push(b);
    }
    // Active: sabse paas wali pehle
    g.active.sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`));
    return g;
  }, [bookings]);

  const current: Tab = tab ?? (groups.active.length || !groups.completed.length ? "active" : "completed");
  const list = groups[current];

  const notify = (tone: "ok" | "err", text: string) => setToast({ tone, text });

  async function cancel(b: Booking) {
    if (!window.confirm(t("Cancel this booking? If you paid online, the money is refunded automatically."))) return;
    try {
      const r = await api.put<{ message?: string; refund_status?: string }>(`/api/booking/cancel/${b.id}`);
      notify("ok", r.data.refund_status === "refunded" ? t("Booking cancelled. Your refund is on the way.") : t("Booking cancelled."));
      await fetchBookings(true);
    } catch (e) {
      notify("err", t(apiError(e, "Unable to cancel booking.")));
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">{t("My bookings")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("Track, reschedule, pay and rate your services in one place.")}</p>
          </div>
          <Link href="/services" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:self-auto">
            <Plus size={16} /> {t("Book a service")}
          </Link>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label={t("Booking status")} className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-200/60 p-1">
          {(
            [
              ["active", "Active"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={current === key}
              onClick={() => setTab(key)}
              className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                current === key ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t(label)}
              {!loading && (
                <span className={`rounded-full px-1.5 text-xs ${current === key ? "bg-gray-100 text-gray-700" : "text-gray-400"}`}>{groups[key].length}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {t(error)}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            [0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />)
          ) : list.length === 0 ? (
            <Empty tab={current} hasAny={bookings.length > 0} />
          ) : (
            list.map((b) =>
              current === "active" ? (
                <ActiveCard key={b.id} b={b} onReschedule={() => setRescheduling(b)} onCancel={() => void cancel(b)} onChanged={() => void fetchBookings(true)} />
              ) : (
                <PastCard key={b.id} b={b} onChanged={() => void fetchBookings(true)} notify={notify} />
              )
            )
          )}
        </div>
      </div>

      {rescheduling && (
        <RescheduleDialog
          booking={rescheduling}
          onClose={() => setRescheduling(null)}
          onDone={async (msg) => {
            setRescheduling(null);
            notify("ok", msg);
            await fetchBookings(true);
          }}
        />
      )}

      {toast && (
        <div role="status" className={`fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.tone === "ok" ? "bg-gray-950" : "bg-rose-600"}`}>
          {toast.text}
        </div>
      )}
    </main>
  );
}

function StatusPill({ status }: { status?: string }) {
  const t = useT();
  const s = STATUS[status || "pending"] ?? STATUS.pending;
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>{t(s.label)}</span>;
}

function When({ b }: { b: Booking }) {
  const hi = useLang() === "hi";
  return (
    <span className="inline-flex items-center gap-1.5">
      <CalendarDays size={15} className="text-gray-400" /> {dayText(b.booking_date, hi)}
      <span className="text-gray-300">·</span>
      <Clock3 size={15} className="text-gray-400" /> {time12(b.booking_time)}
    </span>
  );
}

function ActiveCard({ b, onReschedule, onCancel, onChanged }: { b: Booking; onReschedule: () => void; onCancel: () => void; onChanged: () => void }) {
  const t = useT();
  const manageable = MANAGEABLE.includes(b.status || "");
  const showPay = b.price != null && Number(b.price) > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400">
              {t("Booking")} #{b.id}
              {b.rework_of ? ` · ${t("Free rework")}` : ""}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-950">{b.service_name || t("Service booking")}</h2>
          </div>
          <StatusPill status={b.status} />
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-700">
          <When b={b} />
          <span className="inline-flex items-start gap-1.5">
            <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
            <span className="break-words">{b.address}</span>
          </span>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 px-3 py-4">
          <JobTimeline booking={b} />
        </div>

        {b.start_otp && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
            <div className="flex items-start gap-3">
              <KeyRound size={20} className="mt-0.5 shrink-0 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-gray-950">{t("Start code")}</p>
                <p className="text-xs text-gray-600">{t("Share only after the professional reaches your home. Never on a call.")}</p>
              </div>
            </div>
            <p className="font-mono text-3xl font-bold tracking-[0.25em] text-orange-600" aria-label={`${t("Start code")} ${b.start_otp.split("").join(" ")}`}>
              {b.start_otp}
            </p>
          </div>
        )}

        {b.status === "on_the_way" && (
          <div className="mt-4">
            <LiveTracking bookingId={b.id} />
          </div>
        )}

        {/* Kaun aa raha hai */}
        {(b.provider_name || b.agent_name) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{(b.agent_name || b.provider_name || "U")[0]}</span>
              <div className="text-sm">
                <p className="flex items-center gap-1 font-semibold text-gray-950">
                  {b.agent_name || b.provider_name} <BadgeCheck size={15} className="text-blue-600" aria-label={t("Verified")} />
                </p>
                <p className="text-xs text-gray-500">{b.agent_name ? `${t("Professional")} · ${b.provider_name ?? ""}` : t("Your service provider")}</p>
              </div>
            </div>
            {b.agent_phone && (
              <a href={`tel:${b.agent_phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
                <Phone size={14} /> {t("Call")}
              </a>
            )}
          </div>
        )}

        {showPay && (
          <div className="mt-4 rounded-xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {t("Total")} <span className="text-lg font-bold text-gray-950">{inr(b.price)}</span>
                <span className="ml-1 text-xs text-gray-400">· {t("price locked")}</span>
              </p>
              <PaymentBadge status={b.payment_status} method={b.payment_method} />
            </div>
            <PaymentActions bookingId={b.id} bookingStatus={b.status} amount={b.price ?? null} paymentStatus={b.payment_status} paymentMethod={b.payment_method} onChange={onChanged} />
          </div>
        )}
      </div>

      {manageable && (
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onReschedule} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw size={16} /> {t("Reschedule")}
          </button>
          <button type="button" onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            <XCircle size={16} /> {t("Cancel booking")}
          </button>
        </div>
      )}
    </article>
  );
}

function PastCard({ b, onChanged, notify }: { b: Booking; onChanged: () => void; notify: (tone: "ok" | "err", text: string) => void }) {
  const t = useT();
  const done = b.status === "completed";
  const needsReview = done && !b.has_review;
  const needsPay = done && b.payment_status !== "successful" && b.price != null && Number(b.price) > 0;
  const [open, setOpen] = useState(needsReview || needsPay);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-5 text-left sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400">
            {t("Booking")} #{b.id}
          </p>
          <h2 className="mt-0.5 font-bold text-gray-950">{b.service_name}</h2>
          <p className="mt-1 text-sm text-gray-600">
            <When b={b} />
          </p>
          {b.provider_name && <p className="mt-0.5 text-xs text-gray-500">{b.agent_name ? `${b.agent_name} · ${b.provider_name}` : b.provider_name}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill status={b.status} />
          <span className="text-sm font-bold text-gray-950">{inr(b.price)}</span>
          <ChevronDown size={18} className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </div>
      </button>

      {(needsReview || needsPay) && !open && (
        <p className="-mt-2 px-5 pb-4 text-xs font-semibold text-orange-600 sm:px-6">{needsPay ? t("Payment pending") : t("Rate your professional")}</p>
      )}

      {open && (
        <div className="space-y-4 border-t border-gray-100 px-5 py-5 sm:px-6">
          <p className="flex items-start gap-1.5 text-sm text-gray-700">
            <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" /> {b.address}
          </p>
          {(b.price != null || b.payment_status) && (
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{t("Payment")}</span>
                <PaymentBadge status={b.payment_status} method={b.payment_method} />
              </div>
              <PaymentActions bookingId={b.id} bookingStatus={b.status} amount={b.price ?? null} paymentStatus={b.payment_status} paymentMethod={b.payment_method} onChange={onChanged} />
            </div>
          )}
          {done && <ReviewBox b={b} onDone={onChanged} notify={notify} />}
          {(done || b.rework_of) && (
            <GuaranteeBox bookingId={b.id} canClaim={b.can_claim} claimStatus={b.claim_status} claimNote={b.claim_note} isRework={!!b.rework_of} onChange={onChanged} />
          )}
        </div>
      )}
    </article>
  );
}

function ReviewBox({ b, onDone, notify }: { b: Booking; onDone: () => void; notify: (tone: "ok" | "err", text: string) => void }) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (b.has_review) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={16} /> {t("You rated this service. Thank you!")}
      </p>
    );
  }

  async function submit() {
    setBusy(true);
    try {
      await api.post("/api/reviews", { booking_id: b.id, rating, review: text.trim() });
      notify("ok", t("Thanks! Your review helps other customers."));
      onDone();
    } catch (e) {
      notify("err", t(apiError(e, "Unable to submit your review.")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-amber-50/60 p-4">
      <p className="text-sm font-semibold text-gray-950">{t("How was your service?")}</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label={t("Rating")}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} ★`} onClick={() => setRating(s)} className="rounded p-0.5 transition hover:scale-110">
            <Star size={28} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t("What did you like? (optional)")}
            aria-label={t("Review")}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
          />
          <button type="button" disabled={busy} onClick={() => void submit()} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy && <Loader2 size={15} className="animate-spin" />} {t("Submit review")}
          </button>
        </>
      )}
    </div>
  );
}

function Empty({ tab, hasAny }: { tab: Tab; hasAny: boolean }) {
  const t = useT();
  const text =
    tab === "active"
      ? hasAny
        ? t("No upcoming bookings. Need something fixed?")
        : t("You haven't booked anything yet. Verified professionals, fixed prices, 7-day guarantee.")
      : tab === "completed"
        ? t("Completed services will show here.")
        : t("No cancelled bookings.");
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <PackageCheck size={22} />
      </span>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">{text}</p>
      {tab === "active" && (
        <Link href="/services" className="mt-5 inline-flex rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
          {t("Browse services")}
        </Link>
      )}
    </div>
  );
}

/** Reschedule: agle 7 din + provider ke free slots (booking page jaisa). */
function RescheduleDialog({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: (msg: string) => void }) {
  const t = useT();
  const hi = useLang() === "hi";
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => istToday(i)), []);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    const fallback = () => {
      const now = new Date(Date.now() + 5.5 * 3600 * 1000);
      const min = date === istToday() ? now.getUTCHours() + 2 : 8;
      return Array.from({ length: 12 }, (_, i) => 8 + i).filter((h) => h >= min).map((h) => `${String(h).padStart(2, "0")}:00`);
    };
    const load = booking.provider_id ? getSlots(booking.provider_id, date).then((r) => (r.has_schedule ? r.slots : fallback())) : Promise.resolve(fallback());
    load
      .catch(() => fallback())
      .then((list) => {
        if (cancelled) return;
        setSlots(list);
        setTime("");
      });
    return () => {
      cancelled = true;
    };
  }, [date, booking.provider_id]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.put(`/api/booking/reschedule/${booking.id}`, { booking_date: date, booking_time: time });
      onDone(t("Rescheduled to {day}, {time}.", { day: dayText(date, hi), time: time12(time) }));
    } catch (e) {
      setError(t(apiError(e, "Unable to reschedule booking.")));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-gray-950/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="resch-title">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="resch-title" className="text-lg font-bold text-gray-950">{t("Reschedule booking")}</h2>
            <p className="text-sm text-gray-500">
              {booking.service_name} · {t("now")} {dayText(booking.booking_date, hi)}, {time12(booking.booking_time)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Close")} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold text-gray-800">{t("Pick a day")}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={date === d}
              onClick={() => setDate(d)}
              className={`min-w-[78px] shrink-0 rounded-xl border-2 px-3 py-2 text-xs font-semibold ${date === d ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 text-gray-800 hover:border-gray-400"}`}
            >
              {dayText(d, hi)}
            </button>
          ))}
        </div>

        {date && (
          <>
            <p className="mt-4 text-sm font-semibold text-gray-800">{t("Pick a time")}</p>
            {slots === null ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={15} className="animate-spin" /> {t("Checking free slots…")}
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("No free slots on this day. Please pick another day.")}</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={time === s}
                    onClick={() => setTime(s)}
                    className={`rounded-xl border-2 px-2 py-2 text-sm font-semibold ${time === s ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 text-gray-800 hover:border-gray-400"}`}
                  >
                    {time12(s)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="button"
          disabled={!date || !time || busy}
          onClick={() => void submit()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} {t("Confirm new time")}
        </button>
      </div>
    </div>
  );
}
