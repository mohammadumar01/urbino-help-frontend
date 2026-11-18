"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import {
  Avatar, btnPrimary, DENSITIES, DensityToggle, DetailRow, EmptyState, ErrorBanner, Icon, I,
  Overlay, Pagination, PageHeader, ProgressBar, RefreshButton, RoleBadge, SearchInput,
  SkeletonRows, SortHeader, Stats, Toast, nextSort, btnSecondary, type Density,
} from "@/components/admin/ui";
import { downloadCsv, labelize } from "@/lib/admin/format";
import { api } from "@/lib/admin/api";
import {
  useApiQuery, useDebouncedUrlSearch, useHotkeys, usePersisted, useToast, useUrlState,
} from "@/lib/admin/hooks";

type User = { id?: number | string; name?: string; email?: string; role?: string; phone?: string };
type SortKey = "name" | "email" | "role";

const PAGE_SIZES = [10, 25, 50];
const DEFAULTS = { q: "", role: "all", page: "1" };
const keyOf = (u: User) => String(u.id ?? u.email ?? "");

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersView />
    </Suspense>
  );
}

function UsersView() {
  const [url, setUrl] = useUrlState(DEFAULTS);
  const [search, setSearch] = useDebouncedUrlSearch(url.q, (q) => setUrl({ q, page: "1" }));
  const [pageSize, setPageSize] = usePersisted("users:pageSize", 10, PAGE_SIZES);
  const [density, setDensity] = usePersisted<Density>("users:density", "comfortable", DENSITIES);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<User | null>(null);
  const { toast, notify, dismiss } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const page = Math.max(1, Number(url.page) || 1);
  const qs = new URLSearchParams({ page: String(page), limit: String(pageSize), search: url.q });
  const { data, loading, refreshing, error, updated, reload, retry } = useApiQuery(`/api/admin/users?${qs}`);

  const users: User[] = Array.isArray(data?.users) ? data.users : [];
  const totalPages = Math.max(1, Number(data?.totalPages) || 1);
  const rawTotal = data?.totalUsers ?? data?.total;
  const total = rawTotal !== undefined && Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : null;

  const roles = useMemo(() => [...new Set(users.map((u) => (u.role || "user").toLowerCase()))].sort(), [users]);

  const rows = useMemo(() => {
    const list = url.role === "all" ? users : users.filter((u) => (u.role || "user").toLowerCase() === url.role);
    if (!sort) return list;
    const val = (u: User) => (sort.key === "role" ? u.role || "user" : u[sort.key] || "").toString().toLowerCase();
    return [...list].sort((a, b) => (sort.dir === "asc" ? val(a).localeCompare(val(b)) : val(b).localeCompare(val(a))));
  }, [users, url.role, sort]);

  const missingPhone = users.filter((u) => !u.phone).length;
  const drawerUser = (selectedKey != null ? users.find((u) => keyOf(u) === selectedKey) : null) ?? snapshot;
  const hasFilters = url.q !== "" || url.role !== "all";
  const cellY = density === "compact" ? "py-2" : "py-3.5";

  const closeDrawer = () => {
    setSelectedKey(null);
    setSnapshot(null);
  };
  const openUser = (u: User) => {
    setSnapshot(u);
    setSelectedKey(keyOf(u));
  };
  const resetFilters = () => {
    setSearch("");
    setUrl({ q: "", role: "all", page: "1" });
  };
  async function copy(text: string | undefined, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify("success", `${label} copied.`);
    } catch {
      notify("error", "Couldn't copy to clipboard.");
    }
  }

  useHotkeys({ "/": () => searchRef.current?.focus(), r: () => void reload() }, !selectedKey);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        section="Administration"
        title="Users"
        subtitle="Browse registered customers and review their account details."
        updated={updated}
      >
        <RefreshButton busy={loading || refreshing} onClick={() => void reload()} />
        <button
          type="button"
          disabled={rows.length === 0}
          className={btnPrimary}
          onClick={() =>
            downloadCsv(
              "urbino-users.csv",
              ["ID", "Name", "Email", "Phone", "Role"],
              rows.map((u) => [u.id, u.name, u.email, u.phone, u.role ?? "user"])
            )
          }
        >
          <Icon d={I.download} /> Export CSV
        </button>
      </PageHeader>

      <Stats
        loading={loading}
        items={[
          { label: "Total users", value: total ?? "—", caption: url.q ? "Matching your search" : "Registered accounts" },
          { label: "On this page", value: users.length, caption: "Records loaded" },
          { label: "Roles", value: roles.length, caption: "Distinct roles on this page" },
          { label: "Missing phone", value: missingPhone, caption: "Profiles on this page", tone: missingPhone ? "text-amber-700" : "" },
        ]}
      />

      <section className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ProgressBar active={refreshing} />

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              inputRef={searchRef}
              value={search}
              onChange={setSearch}
              label="Search users"
              placeholder="Search name, email or phone"
            />
            <select
              aria-label="Filter users by role"
              value={url.role}
              onChange={(e) => setUrl({ role: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {labelize(r)}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Reset filters
              </button>
            )}
          </div>
          <DensityToggle value={density} onChange={setDensity} />
        </div>

        {error && <ErrorBanner title="We couldn't load your users" message={error} onRetry={() => void retry()} />}

        <div className="overflow-x-auto">
          <table className={`w-full min-w-[760px] text-left text-sm transition-opacity ${refreshing ? "opacity-60" : ""}`}>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3"><SortHeader label="User" k="name" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} /></th>
                <th className="px-4 py-3"><SortHeader label="Email" k="email" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} /></th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3"><SortHeader label="Role" k="role" sort={sort} onSort={(k) => setSort(nextSort(sort, k))} /></th>
                <th className="w-10 px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <SkeletonRows cols={5} />}
              {!loading &&
                rows.map((u, i) => {
                  const k = keyOf(u) || String(i);
                  return (
                    <tr
                      key={k}
                      tabIndex={0}
                      onClick={() => openUser(u)}
                      onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && openUser(u)}
                      className="group cursor-pointer outline-none transition hover:bg-slate-50 focus-visible:bg-indigo-50/60"
                    >
                      <td className={`px-4 ${cellY}`}>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} seed={k} size={density === "compact" ? "sm" : "md"} />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium text-slate-900">{u.name || "Unnamed user"}</p>
                            {density === "comfortable" && <p className="text-xs text-slate-500">ID {u.id ?? "—"}</p>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 ${cellY} text-slate-600`}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{u.email || "—"}</span>
                          {u.email && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copy(u.email, "Email");
                              }}
                              aria-label={`Copy ${u.email}`}
                              className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100"
                            >
                              <Icon d={I.copy} className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 ${cellY} tabular-nums`}>
                        {u.phone ? <span className="text-slate-600">{u.phone}</span> : <span className="text-slate-400">Not provided</span>}
                      </td>
                      <td className={`px-4 ${cellY}`}><RoleBadge role={u.role} /></td>
                      <td className={`px-4 ${cellY} text-slate-300 transition group-hover:text-slate-500`}><Icon d={I.chevron} /></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title={hasFilters ? "No users match your filters" : "No users yet"}
            text={hasFilters ? "Try a different search term, or reset the filters." : "Customers will appear here once they register."}
            action={hasFilters && <button type="button" onClick={resetFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Reset filters</button>}
          />
        )}

        {!loading && users.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            first={(page - 1) * pageSize + 1}
            last={(page - 1) * pageSize + users.length}
            total={total}
            busy={refreshing}
            onPage={(p) => setUrl({ page: String(p) })}
            onPageSize={(n) => {
              setPageSize(n);
              setUrl({ page: "1" });
            }}
          />
        )}
      </section>

      {drawerUser && (
        <Overlay side="right" labelledBy="user-title" onClose={closeDrawer}>
          <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-4">
              <Avatar name={drawerUser.name} seed={keyOf(drawerUser)} size="lg" />
              <div className="min-w-0">
                <h2 id="user-title" className="truncate text-lg font-semibold">{drawerUser.name || "Unnamed user"}</h2>
                <div className="mt-1.5"><RoleBadge role={drawerUser.role} /></div>
              </div>
            </div>
            <button type="button" onClick={closeDrawer} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Icon d={I.close} className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            <div>
              <h3 className="text-sm font-semibold">Get in touch</h3>
              <div className="mt-3 flex gap-2">
                {drawerUser.phone && (
                  <a href={`tel:${drawerUser.phone}`} className={`${btnSecondary} flex-1`}><Icon d={I.phone} /> Call</a>
                )}
                {drawerUser.email && (
                  <a href={`mailto:${drawerUser.email}`} className={`${btnSecondary} flex-1`}><Icon d={I.mail} /> Email</a>
                )}
                {!drawerUser.phone && !drawerUser.email && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">No contact details on file.</p>
                )}
              </div>
              {!drawerUser.phone && drawerUser.email && (
                <p className="mt-2 text-xs text-amber-700">This user hasn&apos;t added a phone number.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Account details</h3>
              <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                <DetailRow label="Email" value={drawerUser.email} onCopy={() => void copy(drawerUser.email, "Email")} />
                <DetailRow label="Phone" value={drawerUser.phone} onCopy={() => void copy(drawerUser.phone, "Phone")} />
                <DetailRow label="User ID" value={drawerUser.id != null ? String(drawerUser.id) : undefined} onCopy={() => void copy(String(drawerUser.id), "User ID")} />
                <DetailRow label="Role" value={labelize(drawerUser.role, "user")} />
              </dl>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button type="button" onClick={closeDrawer} className={btnSecondary}>Close</button>
            {drawerUser.id != null && <ResetPassword userId={Number(drawerUser.id)} name={drawerUser.name || "this user"} onError={(m) => notify("error", m)} />}
            {drawerUser.email && <a href={`mailto:${drawerUser.email}`} className={btnPrimary}>Email user</a>}
          </footer>
        </Overlay>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
/** Phone par verify karne ke baad ek baar dikhne wala temporary password. */
function ResetPassword({ userId, name, onError }: { userId: number; name: string; onError: (m: string) => void }) {
  const [temp, setTemp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm(`Create a temporary password for ${name}? Their current password will stop working. Verify them on a call first.`)) return;
    setBusy(true);
    try {
      const r = await api<{ temporary_password: string }>(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      setTemp(r.temporary_password);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  if (temp) {
    return (
      <p className="mr-auto rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Temporary password: <b className="font-mono tracking-wider">{temp}</b>
        <span className="block text-xs text-amber-700">Tell it on the call. Shown only once; they must set a new one after login.</span>
      </p>
    );
  }
  return (
    <button type="button" disabled={busy} onClick={() => void reset()} className={`${btnSecondary} mr-auto`}>
      {busy ? "Resetting…" : "Reset password"}
    </button>
  );
}
