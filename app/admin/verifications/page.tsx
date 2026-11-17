"use client";

import { Suspense, useRef, useState } from "react";
import {
  Avatar, btnPrimary, btnSecondary, EmptyState, ErrorBanner, Icon, I, Overlay, PageHeader, Pagination,
  ProgressBar, RefreshButton, SearchInput, SkeletonRows, Toast,
} from "@/components/admin/ui";
import { api, API, ApiError, signOut } from "@/lib/admin/api";
import { formatDate, money, timeAgo } from "@/lib/admin/format";
import { useApiQuery, useDebouncedUrlSearch, useHotkeys, usePersisted, useToast, useUrlState } from "@/lib/admin/hooks";

type Doc = {
  id: number;
  document_type: string;
  document_number: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  has_file: boolean;
  file_name: string | null;
  legacy_url: string | null;
  created_at: string;
  verified_at: string | null;
};

type Provider = {
  provider_id: number;
  name: string;
  email: string;
  phone: string | null;
  joined_at: string;
  is_verified: boolean;
  service_area: string | null;
  experience_years: number | null;
  hourly_rate: string | null;
  bio: string | null;
  skills: string | null;
  active_services: number;
  hour_ranges: number;
  completed_jobs: number;
  rating: number | null;
  documents: Doc[];
};

type Resp = {
  totalProviders: number;
  totalPages: number;
  counts: { pending: number; verified: number; unverified: number; total: number };
  providers: Provider[];
};

const TABS = [
  { key: "pending", label: "Needs review" },
  { key: "unverified", label: "Not verified" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

const DOC_PILL: Record<Doc["status"], string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const QUICK_REASONS = [
  "Photo is blurry or unreadable",
  "Name does not match the account",
  "Document is expired",
  "Number does not match the document",
  "Wrong document uploaded",
];

const PAGE_SIZES = [10, 25, 50];
const DEFAULTS = { status: "pending", q: "", page: "1" };

export default function AdminVerificationsPage() {
  return (
    <Suspense fallback={null}>
      <VerificationsView />
    </Suspense>
  );
}

/** Private file admin token ke saath laao aur naye tab mein kholo. */
async function openDocument(id: number) {
  const token = sessionStorage.getItem("adminToken");
  if (!token) return signOut();
  const res = await fetch(`${API}/api/provider-verification/${id}/file`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) return signOut();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || "Could not open the document.", res.status);
  }
  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function VerificationsView() {
  const [url, setUrl] = useUrlState(DEFAULTS);
  const [search, setSearch] = useDebouncedUrlSearch(url.q, (q) => setUrl({ q, page: "1" }));
  const [pageSize, setPageSize] = usePersisted("verifications:pageSize", 10, PAGE_SIZES);
  const [busyDoc, setBusyDoc] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<{ doc: Doc; provider: Provider } | null>(null);
  const [reason, setReason] = useState("");
  const { toast, notify, dismiss } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const page = Math.max(1, Number(url.page) || 1);
  const qs = new URLSearchParams({ status: url.status, search: url.q, page: String(page), limit: String(pageSize) });
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery<Resp>(`/api/admin/provider-verifications?${qs}`, 60_000);

  useHotkeys({ r: () => void reload(), "/": () => searchRef.current?.focus() });

  const providers = data?.providers ?? [];
  const counts = data?.counts;

  async function approve(doc: Doc, p: Provider) {
    setBusyDoc(doc.id);
    try {
      const r = await api<{ message: string }>(`/api/admin/verification/${doc.id}/approve`, { method: "PATCH" });
      notify("success", `${p.name}: ${r.message}`);
      void reload();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not approve.");
    } finally {
      setBusyDoc(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    const { doc, provider } = rejecting;
    setBusyDoc(doc.id);
    try {
      await api(`/api/admin/verification/${doc.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejection_reason: reason.trim() }),
      });
      notify("success", `${provider.name}'s ${doc.document_type} ${doc.status === "approved" ? "revoked" : "rejected"}. They have been notified.`);
      setRejecting(null);
      setReason("");
      void reload();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not reject.");
    } finally {
      setBusyDoc(null);
    }
  }

  async function view(doc: Doc) {
    try {
      if (doc.has_file) await openDocument(doc.id);
      else if (doc.legacy_url) window.open(doc.legacy_url, "_blank", "noopener,noreferrer");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not open the document.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader section="Team" title="Provider verification" subtitle="Check each provider's KYC documents. Approving the Aadhaar gives them the Verified badge." updated={updated}>
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter providers" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => {
            const n = t.key === "pending" ? counts?.pending : t.key === "verified" ? counts?.verified : t.key === "unverified" ? counts?.unverified : t.key === "all" ? counts?.total : undefined;
            const active = url.status === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setUrl({ status: t.key, page: "1" })}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {t.label}
                {n !== undefined && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${t.key === "pending" && n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-200/70 text-slate-600"}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        <SearchInput inputRef={searchRef} value={search} onChange={setSearch} label="Search providers" placeholder="Name, email, phone or area" />
      </div>

      <section className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ProgressBar active={refreshing} />
        {error && <ErrorBanner title="We couldn't load providers" message={error} onRetry={() => void retry()} />}

        {loading && (
          <table className="w-full">
            <tbody>
              <SkeletonRows rows={4} cols={3} />
            </tbody>
          </table>
        )}

        {!loading && !error && providers.length === 0 && (
          <EmptyState
            icon={I.check}
            title={url.status === "pending" ? "All caught up" : "No providers here"}
            text={url.status === "pending" ? "There are no documents waiting for review." : "Try another tab or search."}
          />
        )}

        <ul className={`divide-y divide-slate-100 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
          {providers.map((p) => {
            const missing = [
              !p.service_area && "profile",
              p.active_services === 0 && "services",
              p.hour_ranges === 0 && "working hours",
            ].filter(Boolean) as string[];
            return (
              <li key={p.provider_id} className="grid gap-5 p-5 lg:grid-cols-[minmax(0,320px)_1fr]">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} seed={String(p.provider_id)} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
                        {p.name}
                        {p.is_verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            <Icon d={I.check} className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-slate-500">Areas</dt>
                    <dd className="truncate text-slate-900" title={p.service_area ?? ""}>{p.service_area || "—"}</dd>
                    <dt className="text-slate-500">Experience</dt>
                    <dd className="text-slate-900">{p.experience_years != null ? `${p.experience_years} yrs` : "—"}</dd>
                    <dt className="text-slate-500">Services</dt>
                    <dd className="text-slate-900">{p.active_services} active{p.hourly_rate ? ` · ${money(p.hourly_rate)}/hr` : ""}</dd>
                    <dt className="text-slate-500">Track record</dt>
                    <dd className="text-slate-900">{p.completed_jobs} jobs{p.rating ? ` · ★ ${p.rating}` : ""}</dd>
                    <dt className="text-slate-500">Joined</dt>
                    <dd className="text-slate-900">{formatDate(p.joined_at)}</dd>
                  </dl>
                  {missing.length > 0 && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Not set up yet: {missing.join(", ")}</p>
                  )}
                </div>

                <div className="min-w-0">
                  {p.documents.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No documents uploaded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {p.documents.map((d) => (
                        <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                              {d.document_type}
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${DOC_PILL[d.status]}`}>{d.status}</span>
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {d.document_number || "No number"} · uploaded {timeAgo(d.created_at) || formatDate(d.created_at)}
                              {d.legacy_url && " · external link (old upload)"}
                            </p>
                            {d.rejection_reason && <p className="mt-1 text-xs text-rose-700">Reason: {d.rejection_reason}</p>}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {(d.has_file || d.legacy_url) && (
                              <button type="button" onClick={() => void view(d)} className={btnSecondary + " px-3 py-1.5 text-xs"}>
                                <Icon d={I.eye} /> View
                              </button>
                            )}
                            {d.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyDoc === d.id}
                                  onClick={() => void approve(d, p)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  <Icon d={I.check} /> Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyDoc === d.id}
                                  onClick={() => {
                                    setReason("");
                                    setRejecting({ doc: d, provider: p });
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                >
                                  <Icon d={I.close} /> Reject
                                </button>
                              </>
                            )}
                            {d.status === "approved" && (
                              <button
                                type="button"
                                disabled={busyDoc === d.id}
                                onClick={() => {
                                  setReason("");
                                  setRejecting({ doc: d, provider: p });
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-700"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!loading && (data?.totalProviders ?? 0) > 0 && (
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            first={(page - 1) * pageSize + 1}
            last={(page - 1) * pageSize + providers.length}
            total={data?.totalProviders}
            busy={refreshing}
            onPage={(n) => setUrl({ page: String(n) })}
            onPageSize={(n) => {
              setPageSize(n);
              setUrl({ page: "1" });
            }}
          />
        )}
      </section>

      {rejecting && (
        <Overlay side="center" labelledBy="reject-title" onClose={() => setRejecting(null)} locked={busyDoc !== null}>
          <h2 id="reject-title" className="text-lg font-semibold">
            {rejecting.doc.status === "approved" ? "Revoke" : "Reject"} {rejecting.provider.name}&apos;s {rejecting.doc.document_type}?
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            The provider sees this reason and can upload a new document.
            {rejecting.doc.document_type === "Aadhaar" && rejecting.provider.is_verified && " They will lose the Verified badge."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${reason === r ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <label htmlFor="reason" className="mt-4 block text-sm font-medium text-slate-700">Reason</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setRejecting(null)} disabled={busyDoc !== null} className={btnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void reject()}
              disabled={busyDoc !== null || reason.trim().length < 5}
              className={btnPrimary + " bg-rose-600 hover:bg-rose-700"}
            >
              {busyDoc !== null ? "Working…" : rejecting.doc.status === "approved" ? "Revoke" : "Reject"}
            </button>
          </div>
        </Overlay>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
