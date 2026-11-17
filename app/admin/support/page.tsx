"use client";

import { Suspense, useState } from "react";
import {
  EmptyState, ErrorBanner, I, PageHeader, Pagination, ProgressBar, RefreshButton, SkeletonRows, Toast,
} from "@/components/admin/ui";
import { api } from "@/lib/admin/api";
import { formatDateTime, labelize, timeAgo } from "@/lib/admin/format";
import { useApiQuery, useHotkeys, usePersisted, useToast, useUrlState } from "@/lib/admin/hooks";

type Ticket = {
  id: number;
  user_id: number | null;
  name: string | null;
  phone: string | null;
  user_email: string | null;
  user_role: string | null;
  booking_id: number | null;
  category: string;
  message: string;
  chat_transcript: { role: string; content: string }[] | null;
  status: "open" | "in_progress" | "resolved";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type Resp = {
  totalTickets: number;
  totalPages: number;
  counts: { open: number; in_progress: number; resolved: number };
  tickets: Ticket[];
};

const TABS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
] as const;

const URGENT = ["safety", "refund", "payment"];
const PAGE_SIZES = [20, 50];
const DEFAULTS = { status: "open", page: "1" };

export default function AdminSupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportView />
    </Suspense>
  );
}

function SupportView() {
  const [url, setUrl] = useUrlState(DEFAULTS);
  const [pageSize, setPageSize] = usePersisted("support:pageSize", 20, PAGE_SIZES);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [openChat, setOpenChat] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const { toast, notify, dismiss } = useToast();

  const page = Math.max(1, Number(url.page) || 1);
  const qs = new URLSearchParams({ status: url.status, page: String(page), limit: String(pageSize) });
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery<Resp>(`/api/support/tickets?${qs}`, 30_000);
  useHotkeys({ r: () => void reload() });

  const tickets = data?.tickets ?? [];

  async function setStatus(t: Ticket, status: Ticket["status"]) {
    setBusy(t.id);
    try {
      await api(`/api/support/tickets/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_note: notes[t.id]?.trim() || undefined }),
      });
      notify("success", status === "resolved" ? `#${t.id} resolved. The customer has been notified.` : `#${t.id} marked ${labelize(status).toLowerCase()}.`);
      void reload();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader section="Operations" title="Support requests" subtitle="People who asked for a call back from the help chat. Call them, then resolve with a short note." updated={updated}>
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
      </PageHeader>

      <div role="tablist" aria-label="Ticket status" className="mt-6 flex w-fit flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => {
          const n = t.key === "all" ? undefined : data?.counts?.[t.key];
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={url.status === t.key}
              onClick={() => setUrl({ status: t.key, page: "1" })}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${url.status === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
              {n !== undefined && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${t.key === "open" && n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-200/70 text-slate-600"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      <section className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ProgressBar active={refreshing} />
        {error && <ErrorBanner title="We couldn't load support requests" message={error} onRetry={() => void retry()} />}
        {loading && (
          <table className="w-full">
            <tbody>
              <SkeletonRows rows={4} cols={3} />
            </tbody>
          </table>
        )}
        {!loading && !error && tickets.length === 0 && (
          <EmptyState icon={I.check} title="Nothing here" text={url.status === "open" ? "No one is waiting for a call back." : "No tickets in this list."} />
        )}

        <ul className="divide-y divide-slate-100">
          {tickets.map((t) => (
            <li key={t.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">#{t.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENT.includes(t.category) ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                    {labelize(t.category)}
                  </span>
                  {t.booking_id && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">Booking #{t.booking_id}</span>}
                  <span className="text-xs text-slate-500" title={formatDateTime(t.created_at)}>{timeAgo(t.created_at) || formatDateTime(t.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{t.message}</p>
                {t.chat_transcript && t.chat_transcript.length > 0 && (
                  <div className="mt-3">
                    <button type="button" onClick={() => setOpenChat(openChat === t.id ? null : t.id)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      {openChat === t.id ? "Hide chat" : `Show chat with assistant (${t.chat_transcript.length})`}
                    </button>
                    {openChat === t.id && (
                      <ol className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs">
                        {t.chat_transcript.map((m, i) => (
                          <li key={i}>
                            <span className="font-semibold text-slate-700">{m.role === "user" ? "Customer" : "Assistant"}:</span>{" "}
                            <span className="text-slate-600">{m.content}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
                {t.admin_note && t.status === "resolved" && <p className="mt-3 text-xs text-emerald-700">Note: {t.admin_note}</p>}
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{t.name || "Guest"}</p>
                  <p className="text-xs text-slate-500">{t.user_email || "Not logged in"}{t.user_role ? ` · ${t.user_role}` : ""}</p>
                  {t.phone && (
                    <a href={`tel:${t.phone}`} className="mt-1 inline-block text-sm font-semibold text-indigo-600 hover:underline">
                      Call {t.phone}
                    </a>
                  )}
                </div>
                {t.status !== "resolved" && (
                  <>
                    <textarea
                      value={notes[t.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                      rows={2}
                      maxLength={1000}
                      placeholder="What did you do? (sent to the customer)"
                      aria-label={`Resolution note for ticket ${t.id}`}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      {t.status === "open" && (
                        <button type="button" disabled={busy === t.id} onClick={() => void setStatus(t, "in_progress")} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                          I&apos;m on it
                        </button>
                      )}
                      <button type="button" disabled={busy === t.id} onClick={() => void setStatus(t, "resolved")} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                        Resolve
                      </button>
                    </div>
                  </>
                )}
                {t.status === "resolved" && (
                  <button type="button" disabled={busy === t.id} onClick={() => void setStatus(t, "open")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Reopen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!loading && (data?.totalTickets ?? 0) > 0 && (
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            first={(page - 1) * pageSize + 1}
            last={(page - 1) * pageSize + tickets.length}
            total={data?.totalTickets}
            busy={refreshing}
            onPage={(n) => setUrl({ page: String(n) })}
            onPageSize={(n) => {
              setPageSize(n);
              setUrl({ page: "1" });
            }}
          />
        )}
      </section>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
