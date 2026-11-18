"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing, CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Navigation, Phone, PlayCircle,
  RefreshCw, Search, Star, Wrench, X,
} from "lucide-react";
import AgentShell from "@/components/agent/AgentShell";
import JobTimeline from "@/components/booking/JobTimeline";
import InviteBanner from "@/components/agent/InviteBanner";
import { CashCollect } from "@/components/payments/PaymentActions";
import { apiError } from "@/lib/api";
import { agentApi, type AgentJob, type AgentSummary, type JobGroup } from "@/lib/agentApi";
import { useAuth } from "@/lib/auth";
import { useLang, useT, type Lang } from "@/lib/i18n";

const TABS: { key: JobGroup; label: string; empty: string }[] = [
  { key: "new", label: "New requests", empty: "No new requests. We'll show them here as soon as your provider assigns one." },
  { key: "active", label: "In progress", empty: "Nothing in progress. Accept a new request to get started." },
  { key: "done", label: "Completed", empty: "Completed jobs will appear here." },
];

const DECLINE_REASONS = ["Too far from my area", "Not available at this time", "I don't have the right tools", "Feeling unwell"];

function dayLabel(date: string, lang: Lang = "en") {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 29.5 * 3600 * 1000).toISOString().slice(0, 10);
  if (date === today) return lang === "hi" ? "आज" : "Today";
  if (date === tomorrow) return lang === "hi" ? "कल" : "Tomorrow";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function time12(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Agle step ka ek hi bada button */
function nextAction(status: AgentJob["status"]) {
  switch (status) {
    case "agent_assigned":
      return { key: "accept", label: "Accept job", icon: CheckCircle2, hint: "Accept to confirm you'll do this job." };
    case "agent_accepted":
      return { key: "otw", label: "I'm on my way", icon: Navigation, hint: "Tap when you leave. The customer gets notified." };
    case "on_the_way":
      return { key: "start", label: "Enter start code", icon: PlayCircle, hint: "Ask the customer for the 4-digit code when you arrive." };
    case "in_progress":
      return { key: "complete", label: "Mark job complete", icon: CheckCircle2, hint: "Tap only after the work is fully done." };
    default:
      return null;
  }
}

export default function AgentJobsPage() {
  return (
    <AgentShell>
      <AgentJobs />
    </AgentShell>
  );
}

function AgentJobs() {
  const user = useAuth();
  const t = useT();
  const [tab, setTab] = useState<JobGroup>("new");
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [summary, setSummary] = useState<AgentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [otpFor, setOtpFor] = useState<AgentJob | null>(null);
  const [declineFor, setDeclineFor] = useState<AgentJob | null>(null);
  const autoTabbed = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      try {
        const [s, j] = await Promise.all([agentApi.summary(), agentApi.jobs(tab, search.trim())]);
        setSummary(s);
        setJobs(j.jobs);
        setError("");
        // Pehli baar: koi naya request nahi par active hai to seedha "In progress"
        if (!autoTabbed.current) {
          autoTabbed.current = true;
          if (s.new === 0 && s.active > 0 && tab === "new") setTab("active");
        }
      } catch (e) {
        setError(t(apiError(e, "Could not load your jobs.")));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, search, t]
  );

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // Har 30 second naye jobs check karo (tab chhupa ho to nahi)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void load(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function run(job: AgentJob, fn: () => Promise<{ message: string }>, moveTo?: JobGroup) {
    setBusyId(job.id);
    try {
      const r = await fn();
      setToast({ tone: "ok", text: t(r.message) });
      if (moveTo && moveTo !== tab) setTab(moveTo);
      else await load(true);
      return true;
    } catch (e) {
      setToast({ tone: "err", text: t(apiError(e, "Something went wrong.")) });
      await load(true);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function onPrimary(job: AgentJob) {
    const a = nextAction(job.status);
    if (!a) return;
    if (a.key === "accept") void run(job, () => agentApi.accept(job.id), "active");
    if (a.key === "otw") void run(job, () => agentApi.onTheWay(job.id));
    if (a.key === "start") setOtpFor(job);
    if (a.key === "complete") {
      if (window.confirm(t("Is the work fully done? The customer will be asked to pay and rate you."))) {
        void run(job, () => agentApi.complete(job.id));
      }
    }
  }

  const firstName = useMemo(() => (user?.name || "").split(" ")[0], [user]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-gray-500">{t("Namaste")}{firstName ? `, ${firstName}` : ""} 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{t("Your jobs")}</h1>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> {t("Refresh")}
        </button>
      </section>

      <InviteBanner onJoined={() => void load(true)} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Summary">
        {[
          { label: "New requests", value: summary?.new, icon: BellRing, tone: summary?.new ? "text-orange-600" : "text-gray-950" },
          { label: "In progress", value: summary?.active, icon: Wrench, tone: "text-gray-950" },
          { label: "Done today", value: summary?.completed_today, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Rating", value: summary?.rating ?? "—", icon: Star, tone: "text-gray-950" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Icon size={14} /> {t(label)}
            </p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value ?? "–"}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Job status" className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
          {TABS.map((tb) => {
            const n = tb.key === "new" ? summary?.new : tb.key === "active" ? summary?.active : undefined;
            return (
              <button
                key={tb.key}
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  tab === tb.key ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t(tb.label)}
                {!!n && (
                  <span className={`rounded-full px-1.5 text-xs ${tb.key === "new" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">{t("Search jobs")}</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Customer, service or area")}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400"
          />
        </label>
      </section>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <ClipboardEmpty />
          <p className="mt-3 text-sm text-gray-500">{t(TABS.find((tb) => tb.key === tab)?.empty ?? "")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              busy={busyId === job.id}
              onPrimary={() => onPrimary(job)}
              onDecline={() => setDeclineFor(job)}
              onChanged={() => void load(true)}
            />
          ))}
        </ul>
      )}

      {otpFor && (
        <OtpDialog
          job={otpFor}
          onClose={() => setOtpFor(null)}
          onSubmit={async (otp) => {
            const ok = await run(otpFor, () => agentApi.start(otpFor.id, otp));
            if (ok) setOtpFor(null);
            return ok;
          }}
        />
      )}

      {declineFor && (
        <DeclineDialog
          job={declineFor}
          onClose={() => setDeclineFor(null)}
          onSubmit={async (reason) => {
            const ok = await run(declineFor, () => agentApi.decline(declineFor.id, reason));
            if (ok) setDeclineFor(null);
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg sm:bottom-6 ${
            toast.tone === "ok" ? "bg-gray-950" : "bg-rose-600"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function ClipboardEmpty() {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
      <CalendarDays size={22} />
    </span>
  );
}

function JobCard({
  job,
  busy,
  onPrimary,
  onDecline,
  onChanged,
}: {
  job: AgentJob;
  busy: boolean;
  onPrimary: () => void;
  onDecline: () => void;
  onChanged: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const action = nextAction(job.status);
  const isNew = job.status === "agent_assigned";
  const canDecline = job.status === "agent_assigned" || job.status === "agent_accepted";
  const showCash = job.status === "in_progress" || job.status === "completed";

  return (
    <li className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isNew ? "border-orange-300 ring-2 ring-orange-100" : "border-gray-200"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400">{t("BOOKING")} #{job.id}</p>
            <h2 className="mt-0.5 text-lg font-bold text-gray-950">{job.service_name}</h2>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-gray-950">
              <Clock3 size={15} /> {time12(job.booking_time)}
            </p>
            <p className={`text-sm font-semibold ${dayLabel(job.booking_date) === "Today" ? "text-orange-600" : "text-gray-500"}`}>
              {dayLabel(job.booking_date, lang)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={mapsUrl(job.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 rounded-xl bg-gray-50 p-3 text-sm text-gray-800 hover:bg-gray-100"
          >
            <MapPin size={18} className="mt-0.5 shrink-0 text-orange-600" />
            <span className="min-w-0">
              <span className="block break-words font-medium">{job.address}</span>
              <span className="text-xs font-semibold text-blue-600">{t("Open in Google Maps")}</span>
            </span>
          </a>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{job.customer_name}</p>
              <p className="text-xs text-gray-500">{t("Customer")}{job.provider_name ? ` · ${t("via")} ${job.provider_name}` : ""}</p>
            </div>
            {job.customer_phone && job.status !== "completed" && (
              <a
                href={`tel:${job.customer_phone}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-100"
              >
                <Phone size={14} /> {t("Call")}
              </a>
            )}
          </div>
        </div>

        <div className="mt-5">
          <JobTimeline booking={{ ...job, status: job.status }} />
        </div>

        {showCash && (
          <CashCollect
            bookingId={job.id}
            bookingStatus={job.status}
            amount={job.price}
            paymentStatus={job.payment_status}
            paymentMethod={job.payment_method}
            onChange={onChanged}
          />
        )}
      </div>

      {action && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-4">
          <p className="mb-2 text-xs text-gray-500">{t(action.hint)}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onPrimary}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <action.icon size={18} />} {t(action.label)}
            </button>
            {canDecline && (
              <button
                type="button"
                onClick={onDecline}
                disabled={busy}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                {t("Can't do it")}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-950">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t("Close")} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OtpDialog({ job, onClose, onSubmit }: { job: AgentJob; onClose: () => void; onSubmit: (otp: string) => Promise<boolean> }) {
  // Ek hi input (4 boxes jaisa dikhta hai): fast typing ya paste mein digits aage-peeche nahi hote
  const t = useT();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  async function submit() {
    if (code.length !== 4 || busy) return;
    setBusy(true);
    const ok = await onSubmit(code);
    setBusy(false);
    if (!ok) {
      setCode("");
      inputRef.current?.focus();
    }
  }

  return (
    <Modal title={t("Enter start code")} onClose={onClose}>
      <p className="mt-1 text-sm text-gray-600">
        {t("Ask {name} for the 4-digit code shown in their Urbino app. This confirms you have reached.", { name: job.customer_name.split(" ")[0] })}
      </p>
      <div className="relative mx-auto mt-5 w-fit" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          aria-label={t("4-digit start code")}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div aria-hidden className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 bg-white text-2xl font-bold text-gray-950 ${
                i === Math.min(code.length, 3) ? "border-orange-500" : "border-gray-200"
              }`}
            >
              {code[i] ?? ""}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || code.length !== 4}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {busy && <Loader2 size={16} className="animate-spin" />} {t("Start work")}
      </button>
    </Modal>
  );
}

function DeclineDialog({ job, onClose, onSubmit }: { job: AgentJob; onClose: () => void; onSubmit: (reason: string) => Promise<void> }) {
  const t = useT();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={t("Can't do booking #{id}?", { id: job.id })} onClose={onClose}>
      <p className="mt-1 text-sm text-gray-600">{t("Your provider will assign someone else. Tell them why.")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {DECLINE_REASONS.map((r) => t(r)).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${reason === r ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={300}
        placeholder={t("Or write your reason")}
        aria-label={t("Reason")}
        className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
      />
      <button
        type="button"
        disabled={busy || reason.trim().length < 3}
        onClick={async () => {
          setBusy(true);
          await onSubmit(reason.trim());
          setBusy(false);
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {busy && <Loader2 size={16} className="animate-spin" />} {t("Decline job")}
      </button>
    </Modal>
  );
}
