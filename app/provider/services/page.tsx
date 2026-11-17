"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import ProviderShell, { btnPrimary, btnSecondary, Card, inputCls, Notice } from "@/components/provider/ProviderShell";
import { apiError } from "@/lib/api";
import { providerApi, type CatalogService, type MyService } from "@/lib/providerApi";

const rupee = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN")}`;

export default function ProviderServicesPage() {
  return (
    <ProviderShell title="Services & prices" subtitle="Choose what you offer. Customers pay the price you set here.">
      <ServicesManager />
    </ProviderShell>
  );
}

function ServicesManager() {
  const [mine, setMine] = useState<MyService[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});

  const [newService, setNewService] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([providerApi.myServices(), providerApi.catalog()]);
      setMine(m);
      setCatalog(c);
    } catch (e) {
      setError(apiError(e, "Could not load services."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const available = useMemo(() => {
    const taken = new Set(mine.map((s) => s.service_id));
    return catalog.filter((s) => !taken.has(s.id));
  }, [catalog, mine]);

  const grouped = useMemo(() => {
    const g: Record<string, CatalogService[]> = {};
    for (const s of available) (g[s.category_name] ||= []).push(s);
    return g;
  }, [available]);

  const selected = catalog.find((s) => String(s.id) === newService);

  async function run(id: number, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(ok);
      await load();
    } catch (e) {
      setError(apiError(e, "Something went wrong."));
    } finally {
      setBusyId(null);
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!newService) return;
    setAdding(true);
    setError("");
    setNotice("");
    try {
      await providerApi.addService(Number(newService), newPrice ? Number(newPrice) : undefined);
      setNewService("");
      setNewPrice("");
      setNotice("Service added. Customers can now book it.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not add the service."));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading services…
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      <Card>
        <h2 className="text-lg font-bold text-gray-950">Add a service</h2>
        {available.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">You already offer every service in the catalogue.</p>
        ) : (
          <form onSubmit={onAdd} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div>
              <label htmlFor="svc" className="mb-1.5 block text-sm font-semibold text-gray-800">Service</label>
              <select id="svc" value={newService} onChange={(e) => setNewService(e.target.value)} className={inputCls} required>
                <option value="">Choose a service</option>
                {Object.entries(grouped).map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (base {rupee(s.base_price)})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-semibold text-gray-800">Your price (₹)</label>
              <input
                id="price"
                type="number"
                min={1}
                inputMode="decimal"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={selected?.base_price ? String(Number(selected.base_price)) : "Price"}
                className={inputCls}
              />
            </div>
            <button type="submit" disabled={adding || !newService} className={btnPrimary}>
              {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
            </button>
          </form>
        )}
      </Card>

      <Card className="p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-950">Your services ({mine.length})</h2>
        </div>
        {mine.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            You don&apos;t offer any services yet. Add one above so customers can book you.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {mine.map((s) => {
              const editing = edits[s.service_id];
              const busy = busyId === s.service_id;
              return (
                <li key={s.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-950">
                      {s.service_name}
                      {!s.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Paused</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {s.category_name} · base price {rupee(s.base_price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">₹</span>
                      <input
                        type="number"
                        min={1}
                        aria-label={`Price for ${s.service_name}`}
                        value={editing ?? String(Number(s.price))}
                        onChange={(e) => setEdits((x) => ({ ...x, [s.service_id]: e.target.value }))}
                        className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                      {editing !== undefined && Number(editing) !== Number(s.price) && (
                        <button
                          type="button"
                          disabled={busy}
                          className={btnPrimary + " px-3 py-2"}
                          onClick={() =>
                            run(s.service_id, async () => {
                              await providerApi.updateService(s.service_id, { price: Number(editing) });
                              setEdits((x) => {
                                const n = { ...x };
                                delete n[s.service_id];
                                return n;
                              });
                            }, `${s.service_name} price updated.`)
                          }
                        >
                          Save
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          s.service_id,
                          () => providerApi.updateService(s.service_id, { is_active: !s.is_active }),
                          s.is_active ? `${s.service_name} paused. Customers can't book it until you resume.` : `${s.service_name} is live again.`
                        )
                      }
                      className={btnSecondary + " px-3 py-2"}
                    >
                      {s.is_active ? <Pause size={15} /> : <Play size={15} />} {s.is_active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Remove ${s.service_name}`}
                      onClick={() => {
                        if (window.confirm(`Stop offering ${s.service_name}? Existing bookings are not affected.`)) {
                          void run(s.service_id, () => providerApi.removeService(s.service_id), `${s.service_name} removed.`);
                        }
                      }}
                      className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
