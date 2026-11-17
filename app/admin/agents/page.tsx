"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
const PAGE_SIZE = 10;

/* ----------------------------- Types ----------------------------- */

type Agent = {
  id?: number | string;
  agent_id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
};

type FormState = { name: string; email: string; phone: string; password: string };
type SortKey = "name" | "email" | "role";
type ToastState = { type: "success" | "error"; text: string } | null;
type DrawerState = { mode: "create" } | { mode: "edit"; agent: Agent } | null;

const emptyForm: FormState = { name: "", email: "", phone: "", password: "" };

/* ----------------------------- Helpers ----------------------------- */

const getAgentId = (a: Agent) => a.id ?? a.agent_id;
const keyOf = (a: Agent) => String(getAgentId(a) ?? a.email ?? "");

async function api(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("adminToken");
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function toneFor(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function initialsOf(name?: string) {
  return (name || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function validate(f: FormState, withPassword: boolean) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (f.name.trim().length < 3) errors.name = "Enter at least 3 characters.";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errors.email = "Enter a valid email address.";
  const digits = f.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) errors.phone = "Enter a valid phone number.";
  if (withPassword && f.password.length < 6) errors.password = "Use at least 6 characters.";
  return errors;
}

/* ----------------------------- Icons ----------------------------- */

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const I = {
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
  download: "M12 4v12m0 0l-4-4m4 4l4-4M5 20h14",
  copy: "M9 9h10v10H9zM5 15V5h10",
  up: "M6 14l6-6 6 6",
  down: "M6 10l6 6 6-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M3 3l18 18M10.6 6.2A9.7 9.7 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.9M6.3 7.6A17 17 0 002 12s4 7 10 7c1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 004.2 4.2",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 19v-1a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8",
  check: "M5 13l4 4L19 7",
  alert: "M12 8v5m0 3h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z",
};

/* ----------------------------- Small UI ----------------------------- */

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "active").toLowerCase();
  const active = s === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {s}
    </span>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </label>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    err
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

function SortHeader({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={`inline-flex items-center gap-1 font-semibold transition hover:text-slate-900 ${
        active ? "text-slate-900" : ""
      }`}
    >
      {label}
      <Icon d={active && sort.dir === "desc" ? I.down : I.up} className={`h-3.5 w-3.5 ${active ? "" : "opacity-30"}`} />
    </button>
  );
}

/* ----------------------------- Page ----------------------------- */

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showErrors, setShowErrors] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTargets, setDeleteTargets] = useState<Agent[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Data ---------- */

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api("/api/admin/agents");
      const list = Array.isArray(data.agents)
        ? data.agents
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.users)
            ? data.users
            : [];
      setAgents(list);
      setSelected(new Set());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  /* ---------- Derived ---------- */

  const roles = useMemo(
    () => Array.from(new Set(agents.map((a) => (a.role || "agent").toLowerCase()))),
    [agents]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const list = agents.filter((a) => {
      const role = (a.role || "agent").toLowerCase();
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (!term) return true;
      return (
        (a.name ?? "").toLowerCase().includes(term) ||
        (a.email ?? "").toLowerCase().includes(term) ||
        (a.phone ?? "").toLowerCase().includes(term) ||
        role.includes(term) ||
        String(getAgentId(a) ?? "").includes(term)
      );
    });

    const val = (a: Agent) =>
      (sort.key === "role" ? a.role || "agent" : a[sort.key] || "").toString().toLowerCase();

    return [...list].sort((a, b) =>
      sort.dir === "asc" ? val(a).localeCompare(val(b)) : val(b).localeCompare(val(a))
    );
  }, [agents, search, roleFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(keyOf(r)));
  const selectedAgents = agents.filter((a) => selected.has(keyOf(a)));

  /* ---------- Handlers ---------- */

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function toggleRow(a: Agent) {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(a);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((r) => next.delete(keyOf(r)));
      else rows.forEach((r) => next.add(keyOf(r)));
      return next;
    });
  }

  function openCreate() {
    setForm(emptyForm);
    setShowErrors(false);
    setShowPassword(false);
    setDrawer({ mode: "create" });
  }

  function openEdit(agent: Agent) {
    setForm({
      name: agent.name ?? "",
      email: agent.email ?? "",
      phone: agent.phone ?? "",
      password: "",
    });
    setShowErrors(false);
    setDrawer({ mode: "edit", agent });
  }

  const closeDrawer = useCallback(() => {
    if (!saving) setDrawer(null);
  }, [saving]);

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!drawer) return;

    const isCreate = drawer.mode === "create";
    setShowErrors(true);
    if (Object.keys(validate(form, isCreate)).length > 0) return;

    setSaving(true);
    try {
      if (isCreate) {
        const data = await api("/api/admin/agents", {
          method: "POST",
          body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim() }),
        });
        notify("success", data.message || "Agent created.");
      } else {
        const id = getAgentId(drawer.agent);
        if (id == null) throw new Error("This agent has no ID, so it can't be updated.");
        const { name, email, phone } = form;
        const data = await api(`/api/admin/agents/${id}`, {
          method: "PUT",
          body: JSON.stringify({ name: name.trim(), email: email.trim(), phone }),
        });
        notify("success", data.message || "Changes saved.");
      }
      setDrawer(null);
      await loadAgents();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargets) return;
    setDeleting(true);

    const results = await Promise.allSettled(
      deleteTargets.map((a) => {
        const id = getAgentId(a);
        if (id == null) return Promise.reject(new Error("Missing ID"));
        return api(`/api/admin/agents/${id}`, { method: "DELETE" });
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;

    if (failed === 0) {
      notify("success", ok === 1 ? "Agent deleted." : `${ok} agents deleted.`);
    } else {
      notify("error", `${ok} deleted, ${failed} failed. Please try again.`);
    }

    setDeleting(false);
    setDeleteTargets(null);
    await loadAgents();
  }

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["ID", "Name", "Email", "Phone", "Role", "Status"];
    const lines = filtered.map((a) =>
      [getAgentId(a), a.name, a.email, a.phone, a.role || "agent", a.status || "active"].map(esc).join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agents.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyEmail(email?: string) {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      notify("success", "Email copied.");
    } catch {
      notify("error", "Couldn't copy to clipboard.");
    }
  }

  // Close overlays with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTargets && !deleting) setDeleteTargets(null);
      else if (drawer) closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, deleteTargets, deleting, closeDrawer]);

  const errors = showErrors && drawer ? validate(form, drawer.mode === "create") : {};
  const hasFilters = search.trim() !== "" || roleFilter !== "all";

  /* ----------------------------- Render ----------------------------- */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @keyframes slideIn { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important } }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          Admin <span className="mx-1.5 text-slate-300">/</span> Team{" "}
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-slate-700">Agents</span>
        </nav>

        <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Create and manage the accounts your field team uses to sign in. Changes apply immediately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAgents()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50"
            >
              <Icon d={I.refresh} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              <Icon d={I.plus} />
              Add agent
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <dl className="mt-6 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
          {[
            { label: "Total agents", value: agents.length },
            { label: "Matching filters", value: filtered.length },
            { label: "Selected", value: selected.size },
          ].map((s) => (
            <div key={s.label} className="px-5 py-4">
              <dt className="text-xs font-medium text-slate-500">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "–" : s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Table card */}
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            {selected.size > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">{selected.size} selected</span>
                <button
                  type="button"
                  onClick={() => setDeleteTargets(selectedAgents)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Icon d={I.trash} /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon d={I.search} />
                  </span>
                  <input
                    type="search"
                    aria-label="Search agents"
                    placeholder="Search by name, email, phone or ID"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="all">All roles</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("all");
                      setPage(1);
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <Icon d={I.download} /> Export CSV
            </button>
          </div>

          {/* Load error */}
          {loadError && (
            <div role="alert" className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <Icon d={I.alert} className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">We couldn&apos;t load your agents</p>
                <p className="mt-0.5 text-red-700">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadAgents()}
                className="font-medium underline underline-offset-2 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all agents on this page"
                      checked={allOnPageSelected}
                      onChange={togglePage}
                      disabled={rows.length === 0}
                      className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <SortHeader label="Agent" k="name" sort={sort} onSort={toggleSort} />
                  </th>
                  <th className="px-4 py-3">
                    <SortHeader label="Email" k="email" sort={sort} onSort={toggleSort} />
                  </th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3">
                    <SortHeader label="Role" k="role" sort={sort} onSort={toggleSort} />
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4"><div className="h-4 w-4 animate-pulse rounded bg-slate-100" /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                          <div className="space-y-2">
                            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
                            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      </td>
                      {[40, 28, 16, 16].map((w, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3.5 animate-pulse rounded bg-slate-100" style={{ width: `${w * 4}px` }} />
                        </td>
                      ))}
                      <td />
                    </tr>
                  ))}

                {!loading &&
                  rows.map((agent) => {
                    const id = getAgentId(agent);
                    const k = keyOf(agent);
                    const isSel = selected.has(k);
                    return (
                      <tr key={k} className={`group transition ${isSel ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}>
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            aria-label={`Select ${agent.name ?? "agent"}`}
                            checked={isSel}
                            onChange={() => toggleRow(agent)}
                            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${toneFor(
                                agent.name || k
                              )}`}
                            >
                              {initialsOf(agent.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{agent.name || "Unnamed agent"}</p>
                              <p className="text-xs text-slate-500">ID {id ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{agent.email || "—"}</span>
                            {agent.email && (
                              <button
                                type="button"
                                onClick={() => void copyEmail(agent.email)}
                                aria-label={`Copy ${agent.email}`}
                                title="Copy email"
                                className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100"
                              >
                                <Icon d={I.copy} className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums text-slate-600">{agent.phone || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                            {agent.role || "Agent"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={agent.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={id == null}
                              onClick={() => openEdit(agent)}
                              aria-label={`Edit ${agent.name ?? "agent"}`}
                              title="Edit"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-40"
                            >
                              <Icon d={I.edit} />
                            </button>
                            <button
                              type="button"
                              disabled={id == null}
                              onClick={() => setDeleteTargets([agent])}
                              aria-label={`Delete ${agent.name ?? "agent"}`}
                              title="Delete"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Icon d={I.trash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!loading && !loadError && rows.length === 0 && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon d={I.users} className="h-6 w-6" />
              </span>
              {hasFilters ? (
                <>
                  <p className="mt-4 font-semibold">No agents match your filters</p>
                  <p className="mt-1 text-sm text-slate-500">Try a different search term or reset the filters.</p>
                </>
              ) : (
                <>
                  <p className="mt-4 font-semibold">No agents yet</p>
                  <p className="mt-1 text-sm text-slate-500">Add your first agent to give them access.</p>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Icon d={I.plus} /> Add agent
                  </button>
                </>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
              <p>
                Showing <span className="font-medium text-slate-900">{(safePage - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-medium text-slate-900">
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="font-medium text-slate-900">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-1 tabular-nums">
                  Page {safePage} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ------------------ Create / Edit drawer ------------------ */}
      {drawer && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40"
            style={{ animation: "fadeIn .15s ease-out" }}
            onMouseDown={closeDrawer}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            style={{ animation: "slideIn .2s ease-out" }}
          >
            <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 id="drawer-title" className="text-lg font-semibold">
                  {drawer.mode === "create" ? "Add agent" : "Edit agent"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {drawer.mode === "create"
                    ? "They'll use these details to sign in."
                    : "Update this agent's contact details."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <Icon d={I.close} className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={submitForm} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <Field label="Full name" error={errors.name}>
                  <input
                    autoFocus
                    className={inputCls(errors.name)}
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>

                <Field label="Email address" error={errors.email}>
                  <input
                    type="email"
                    className={inputCls(errors.email)}
                    placeholder="rahul@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>

                <Field label="Phone number" error={errors.phone}>
                  <input
                    type="tel"
                    className={inputCls(errors.phone)}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>

                {drawer.mode === "create" && (
                  <Field
                    label="Temporary password"
                    error={errors.password}
                    hint="Share it securely. The agent should change it after first sign-in."
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`${inputCls(errors.password)} pr-10`}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700"
                        >
                          <Icon d={showPassword ? I.eyeOff : I.eye} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, password: generatePassword() });
                          setShowPassword(true);
                        }}
                        className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Generate
                      </button>
                    </div>
                  </Field>
                )}
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDrawer}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : drawer.mode === "create" ? "Create agent" : "Save changes"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ------------------ Delete confirmation ------------------ */}
      {deleteTargets && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          style={{ animation: "fadeIn .15s ease-out" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTargets(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            style={{ animation: "popIn .18s ease-out" }}
          >
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Icon d={I.alert} className="h-5 w-5" />
              </span>
              <div>
                <h2 id="delete-title" className="text-lg font-semibold">
                  {deleteTargets.length === 1
                    ? `Delete ${deleteTargets[0].name ?? "this agent"}?`
                    : `Delete ${deleteTargets.length} agents?`}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  {deleteTargets.length === 1
                    ? "This agent will lose access right away. This can't be undone."
                    : "These agents will lose access right away. This can't be undone."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={deleting}
                onClick={() => setDeleteTargets(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ------------------ Toast ------------------ */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-lg ${
            toast.type === "success" ? "border-emerald-200" : "border-red-200"
          }`}
          style={{ animation: "popIn .2s ease-out" }}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
            }`}
          >
            <Icon d={toast.type === "success" ? I.check : I.alert} className="h-3 w-3" />
          </span>
          <p className="flex-1 text-slate-700">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="text-slate-400 hover:text-slate-700"
          >
            <Icon d={I.close} className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}