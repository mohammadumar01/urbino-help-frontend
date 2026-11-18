"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  btnPrimary, btnSecondary, EmptyState, ErrorBanner, Icon, I, inputCls, Overlay, PageHeader, RefreshButton,
  SearchInput, SkeletonRows, Stats, Toast,
} from "@/components/admin/ui";
import { api } from "@/lib/admin/api";
import { money } from "@/lib/admin/format";
import { useApiQuery, useToast } from "@/lib/admin/hooks";

type Service = {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  category_id: number;
  category_name: string;
  providers: number;
  min_price: number | null;
  bookings: number;
  bookings_30d: number;
  revenue: number;
};
type Category = { id: number; name: string; description: string | null; is_active: boolean; services: number; active_services: number };

type Editing = { mode: "new" } | { mode: "edit"; service: Service };

export default function AdminServicesPage() {
  const svc = useApiQuery<{ services: Service[] }>("/api/admin/catalog/services");
  const cats = useApiQuery<{ categories: Category[] }>("/api/admin/catalog/categories");
  const { toast, notify, dismiss } = useToast();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const all = useMemo(() => svc.data?.services ?? [], [svc.data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (s) =>
        (!q || s.name.toLowerCase().includes(q) || s.category_name.toLowerCase().includes(q)) &&
        (!cat || String(s.category_id) === cat) &&
        (!status || (status === "active" ? s.is_active : !s.is_active))
    );
  }, [all, search, cat, status]);

  const live = all.filter((s) => s.is_active).length;
  const noPros = all.filter((s) => s.is_active && s.providers === 0).length;

  function reloadAll() {
    void svc.reload();
    void cats.reload();
  }

  async function toggle(s: Service) {
    setBusyId(s.id);
    try {
      const r = await api<{ message: string }>(`/api/admin/catalog/services/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      notify("success", `${s.name}: ${r.message}.`);
      reloadAll();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not update the service.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader section="Catalog" title="Services" subtitle="What customers can book. Hide a service instead of deleting it; past bookings stay intact." updated={svc.updated}>
        <RefreshButton busy={svc.loading || svc.refreshing} onClick={reloadAll} />
        <button type="button" className={btnSecondary} onClick={() => setCatOpen(true)}>
          Categories
        </button>
        <button type="button" className={btnPrimary} onClick={() => setEditing({ mode: "new" })}>
          <Icon d={I.plus} /> Add service
        </button>
      </PageHeader>

      <Stats
        loading={svc.loading}
        items={[
          { label: "Live services", value: String(live), caption: `${all.length - live} hidden` },
          { label: "Categories", value: String(cats.data?.categories.filter((c) => c.is_active).length ?? "–"), caption: "Shown on the home page" },
          {
            label: "No professional yet",
            value: String(noPros),
            caption: noPros ? "Customers can't book these yet" : "Every live service has a pro",
            tone: noPros ? "text-amber-700" : "text-emerald-700",
          },
          { label: "Bookings (30 days)", value: String(all.reduce((n, s) => n + s.bookings_30d, 0)), caption: "Across all services" },
        ]}
      />

      <section className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} label="Search services" placeholder="Service or category" />
          <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
            <option value="">All categories</option>
            {cats.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
            <option value="">Live and hidden</option>
            <option value="active">Live</option>
            <option value="inactive">Hidden</option>
          </select>
        </div>
        {svc.error && <ErrorBanner title="We couldn't load services" message={svc.error} onRetry={() => void svc.retry()} />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 text-right font-semibold">Starting price</th>
                <th className="px-4 py-3 text-right font-semibold">Professionals</th>
                <th className="px-4 py-3 text-right font-semibold">Bookings</th>
                <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {svc.loading && <SkeletonRows cols={7} />}
              {!svc.loading &&
                rows.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 ${s.is_active ? "" : "text-slate-500"}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.category_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(s.base_price)}
                      {s.min_price != null && s.min_price !== s.base_price && <p className="text-xs text-slate-500">pros from {money(s.min_price)}</p>}
                    </td>
                    <td className={`px-4 py-3 text-right ${s.is_active && s.providers === 0 ? "font-semibold text-amber-700" : ""}`}>{s.providers}</td>
                    <td className="px-4 py-3 text-right">
                      {s.bookings}
                      <p className="text-xs text-slate-500">{s.bookings_30d} in 30 days</p>
                    </td>
                    <td className="px-4 py-3 text-right">{money(s.revenue)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          s.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"
                        }`}
                      >
                        {s.is_active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => setEditing({ mode: "edit", service: s })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void toggle(s)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {s.is_active ? "Hide" : "Make live"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!svc.loading && !svc.error && rows.length === 0 && (
          <EmptyState title={all.length ? "No services match" : "No services yet"} text={all.length ? "Try another search or filter." : "Add your first service to start taking bookings."} />
        )}
      </section>

      {editing && (
        <ServiceDialog
          editing={editing}
          categories={cats.data?.categories ?? []}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            notify("success", msg);
            reloadAll();
          }}
        />
      )}
      {catOpen && (
        <CategoriesDialog
          categories={cats.data?.categories ?? []}
          onClose={() => setCatOpen(false)}
          onChanged={(msg) => {
            notify("success", msg);
            reloadAll();
          }}
          onError={(msg) => notify("error", msg)}
        />
      )}
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function ServiceDialog({ editing, categories, onClose, onSaved }: { editing: Editing; categories: Category[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const s = editing.mode === "edit" ? editing.service : null;
  const [name, setName] = useState(s?.name ?? "");
  const [categoryId, setCategoryId] = useState(s ? String(s.category_id) : String(categories.find((c) => c.is_active)?.id ?? ""));
  const [price, setPrice] = useState(s ? String(s.base_price) : "");
  const [description, setDescription] = useState(s?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = JSON.stringify({ name, category_id: Number(categoryId), base_price: price === "" ? "" : Number(price), description });
      if (s) await api(`/api/admin/catalog/services/${s.id}`, { method: "PUT", body });
      else await api("/api/admin/catalog/services", { method: "POST", body });
      onSaved(s ? `${name} updated.` : `${name} added. Professionals can now offer it.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the service.");
      setBusy(false);
    }
  }

  return (
    <Overlay side="center" labelledBy="svc-title" onClose={onClose} locked={busy}>
      <form onSubmit={submit}>
        <h2 id="svc-title" className="text-lg font-semibold">
          {s ? `Edit ${s.name}` : "Add a service"}
        </h2>
        <label htmlFor="svc-name" className="mt-4 block text-sm font-medium text-slate-700">Name</label>
        <input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sofa Deep Cleaning" className={`mt-1 ${inputCls()}`} required minLength={3} maxLength={120} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="svc-cat" className="block text-sm font-medium text-slate-700">Category</label>
            <select id="svc-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`mt-1 ${inputCls()}`} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="svc-price" className="block text-sm font-medium text-slate-700">Starting price (₹)</label>
            <input id="svc-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="499" className={`mt-1 ${inputCls()}`} required />
          </div>
        </div>
        <label htmlFor="svc-desc" className="mt-3 block text-sm font-medium text-slate-700">What&apos;s included</label>
        <textarea id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} placeholder="Shown on the service page" className={`mt-1 ${inputCls()}`} />
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : s ? "Save changes" : "Add service"}</button>
        </div>
      </form>
    </Overlay>
  );
}

function CategoriesDialog({
  categories,
  onClose,
  onChanged,
  onError,
}: {
  categories: Category[];
  onClose: () => void;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/catalog/categories", { method: "POST", body: JSON.stringify({ name }) });
      onChanged(`Category "${name}" added.`);
      setName("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add the category.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Category) {
    try {
      await api(`/api/admin/catalog/categories/${c.id}`, { method: "PUT", body: JSON.stringify({ is_active: !c.is_active }) });
      onChanged(c.is_active ? `${c.name} hidden from customers.` : `${c.name} is live again.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update the category.");
    }
  }

  return (
    <Overlay side="center" labelledBy="cat-title" onClose={onClose}>
      <h2 id="cat-title" className="text-lg font-semibold">Categories</h2>
      <p className="mt-1 text-sm text-slate-600">Hiding a category hides all its services from customers.</p>
      <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span>
              <span className={`font-medium ${c.is_active ? "text-slate-900" : "text-slate-400 line-through"}`}>{c.name}</span>
              <span className="ml-2 text-xs text-slate-500">{c.active_services}/{c.services} live</span>
            </span>
            <button type="button" onClick={() => void toggle(c)} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
              {c.is_active ? "Hide" : "Show"}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <label htmlFor="cat-name" className="sr-only">New category name</label>
        <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category, e.g. Pest Control" className={inputCls()} minLength={3} maxLength={80} required />
        <button type="submit" disabled={busy || name.trim().length < 3} className={btnPrimary}>Add</button>
      </form>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={btnSecondary}>Done</button>
      </div>
    </Overlay>
  );
}
