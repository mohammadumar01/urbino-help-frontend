"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Clock3, KeyRound, Loader2, MapPin, RotateCcw, Star, Tag,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import RequireRole from "@/components/auth/RequireRole";
import PaymentActions from "@/components/payments/PaymentActions";
import api, { apiError } from "@/lib/api";
import { getSlots } from "@/lib/providerApi";
import type { Provider } from "@/lib/providersApi";
import type { Service } from "@/lib/servicesApi";

type Booking = {
  id: number;
  service_name: string;
  status?: string;
  booking_date?: string;
  booking_time?: string;
  price?: string | number | null;
};

const ADDRESS_KEY = "urbino:lastAddress";
const inr = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Aaj se aage ke 7 din (IST) */
function nextDays(n = 7) {
  const out: { iso: string; top: string; day: string }[] = [];
  const base = Date.now() + 5.5 * 3600 * 1000;
  for (let i = 0; i < n; i++) {
    const d = new Date(base + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      iso,
      top: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
      day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
    });
  }
  return out;
}

/** Provider ne hours set nahi kiye ho to 8 AM - 8 PM, aaj ke liye 1 ghante baad se */
function defaultSlots(date: string) {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000);
  const today = now.toISOString().slice(0, 10);
  const minHour = date === today ? now.getUTCHours() + 2 : 8;
  const out: string[] = [];
  for (let h = Math.max(8, minHour); h <= 19; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}

function time12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <RequireRole roles={["customer"]}>
        <Navbar />
        <BookingContent />
      </RequireRole>
    </Suspense>
  );
}

function BookingContent() {
  const sp = useSearchParams();
  const serviceId = Number(sp.get("serviceId"));
  const urlProviderId = sp.get("providerId");

  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [lastAddress, setLastAddress] = useState("");
  const [slots, setSlots] = useState<{ loading: boolean; list: string[]; fromSchedule: boolean }>({ loading: false, list: [], fromSchedule: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  const days = useMemo(() => nextDays(7), []);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastAddress(localStorage.getItem(ADDRESS_KEY) || "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setError("Please choose a service first.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          api.get<{ service: Service }>(`/api/services/${serviceId}`),
          api.get<{ providers: Provider[] }>("/api/service-discovery/providers", { params: { service_id: serviceId } }),
        ]);
        if (cancelled) return;
        setService(s.data.service);
        const list = p.data.providers || [];
        setProviders(list);
        const pre = list.find((x) => String(x.provider_id) === urlProviderId) ?? (list.length === 1 ? list[0] : null);
        if (pre) setProviderId(String(pre.provider_id));
      } catch (e) {
        if (!cancelled) setError(apiError(e, "We couldn't load this service."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, urlProviderId]);

  // Provider + din chunne par free slots
  useEffect(() => {
    if (!providerId || !date) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots((s) => ({ ...s, loading: true }));
    getSlots(Number(providerId), date)
      .then((r) => {
        if (cancelled) return;
        const list = r.has_schedule ? r.slots : defaultSlots(date);
        setSlots({ loading: false, list, fromSchedule: r.has_schedule });
        setTime((t) => (list.includes(t) ? t : ""));
      })
      .catch(() => !cancelled && setSlots({ loading: false, list: defaultSlots(date), fromSchedule: false }));
    return () => {
      cancelled = true;
    };
  }, [providerId, date]);

  const provider = providers.find((p) => String(p.provider_id) === providerId);
  const price = provider?.price ?? service?.base_price;
  const ready = !!provider && !!date && !!time && address.trim().length >= 10;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !service) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await api.post<{ booking: Booking }>("/api/booking/create", {
        service_id: service.id,
        provider_id: Number(providerId),
        address: address.trim(),
        booking_date: date,
        booking_time: time,
      });
      try {
        localStorage.setItem(ADDRESS_KEY, address.trim());
      } catch {
        /* ignore */
      }
      setDone(r.data.booking);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(apiError(err, "Could not create your booking."));
      // Slot kisi aur ne le liya ho to list taaza karo
      if (providerId && date) {
        getSlots(Number(providerId), date)
          .then((r) => setSlots({ loading: false, list: r.has_schedule ? r.slots : defaultSlots(date), fromSchedule: r.has_schedule }))
          .catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-[60vh] bg-gray-50 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-950">Something went wrong</h1>
        <p className="mt-2 text-gray-500">{error}</p>
        <Link href="/services" className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
          Browse services
        </Link>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-950">Booking requested!</h1>
          <p className="mt-2 text-sm text-gray-600">
            {done.service_name} with {provider?.provider_name} on{" "}
            {days.find((d) => d.iso === date)?.top ?? date}, {time12(time)}. You&apos;ll get an update as soon as they confirm.
          </p>
          <p className="mt-1 text-xs text-gray-400">Booking #{done.id}</p>

          {done.price != null && Number(done.price) > 0 && (
            <div className="mt-6 rounded-2xl border border-gray-200 p-5 text-left">
              <p className="text-sm font-semibold text-gray-900">Pay now or after the service</p>
              <p className="mb-4 text-xs text-gray-500">Total {inr(done.price)} · price locked</p>
              <PaymentActions bookingId={done.id} bookingStatus={done.status} amount={done.price} />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/bookings" className="flex-1 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
              Track booking
            </Link>
            <Link href="/services" className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700">
              Book something else
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Link href={`/service/${service.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft size={15} /> {service.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Book {service.name}</h1>
        <p className="mt-1 text-gray-500">Four quick steps. You can reschedule later for free.</p>

        <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-5">
            {/* 1. Professional */}
            <Step n={1} title="Choose your professional" done={!!provider}>
              {providers.length === 0 ? (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  No professionals offer this service yet. Tap <b>Help</b> at the bottom right and our team will arrange one for you.
                </div>
              ) : (
                <div role="radiogroup" aria-label="Professional" className="grid gap-3 sm:grid-cols-2">
                  {providers.map((p) => {
                    const selected = String(p.provider_id) === providerId;
                    const count = Number(p.total_reviews);
                    return (
                      <button
                        key={p.provider_id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setProviderId(String(p.provider_id))}
                        className={`rounded-2xl border-2 p-4 text-left transition ${
                          selected ? "border-gray-950 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex items-center gap-1.5 font-semibold text-gray-950">
                            {p.provider_name}
                            {p.is_verified && <BadgeCheck size={16} className="text-blue-600" aria-label="Verified" />}
                          </p>
                          <p className="font-bold text-gray-950">{inr(p.price)}</p>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                          {count > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-gray-700">
                              <Star size={12} className="fill-amber-400 text-amber-400" /> {Number(p.average_rating).toFixed(1)} ({count})
                            </span>
                          ) : (
                            <span>New</span>
                          )}
                          {p.experience_years != null && <span>· {p.experience_years} yrs</span>}
                          {p.service_area && <span className="truncate">· {p.service_area}</span>}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </Step>

            {/* 2. Date */}
            <Step n={2} title="Pick a day" done={!!date} disabled={!provider}>
              <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Day">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    role="radio"
                    aria-checked={date === d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex min-w-[76px] shrink-0 flex-col items-center rounded-2xl border-2 px-3 py-2.5 transition ${
                      date === d.iso ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-xs font-medium opacity-80">{d.top}</span>
                    <span className="text-sm font-bold">{d.day}</span>
                  </button>
                ))}
              </div>
            </Step>

            {/* 3. Time */}
            <Step n={3} title="Pick a time" done={!!time} disabled={!date}>
              {slots.loading ? (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={15} className="animate-spin" /> Checking free slots…
                </p>
              ) : slots.list.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No free slots on this day. Please pick another day.</p>
              ) : (
                <>
                  <div role="radiogroup" aria-label="Time" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.list.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={time === t}
                        onClick={() => setTime(t)}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                          time === t ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                        }`}
                      >
                        {time12(t)}
                      </button>
                    ))}
                  </div>
                  {slots.fromSchedule && <p className="mt-2 text-xs text-gray-500">Showing {provider?.provider_name}&apos;s free 1-hour slots.</p>}
                </>
              )}
            </Step>

            {/* 4. Address */}
            <Step n={4} title="Where should they come?" done={address.trim().length >= 10} disabled={!time}>
              {lastAddress && lastAddress !== address && (
                <button
                  type="button"
                  onClick={() => setAddress(lastAddress)}
                  className="mb-3 flex w-full items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-left text-sm hover:border-gray-400"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-orange-600" />
                  <span>
                    <span className="block font-semibold text-gray-900">Use previous address</span>
                    <span className="text-gray-500">{lastAddress}</span>
                  </span>
                </button>
              )}
              <label htmlFor="address" className="sr-only">
                Full address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="House / flat no., street, landmark, city"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
              />
            </Step>
          </div>

          {/* Summary */}
          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Your booking</p>
            <p className="mt-2 text-lg font-bold text-gray-950">{service.name}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row icon={BadgeCheck} label="Professional" value={provider?.provider_name ?? "Choose one"} muted={!provider} />
              <Row icon={CalendarDays} label="Day" value={date ? `${days.find((d) => d.iso === date)?.top}, ${days.find((d) => d.iso === date)?.day}` : "Pick a day"} muted={!date} />
              <Row icon={Clock3} label="Time" value={time ? time12(time) : "Pick a time"} muted={!time} />
              <Row icon={MapPin} label="Address" value={address.trim() || "Add address"} muted={!address.trim()} />
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-2xl font-bold text-gray-950">{inr(price)}</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-500">
              <li className="flex items-center gap-1.5"><Tag size={13} /> Price locked, no hidden charges</li>
              <li className="flex items-center gap-1.5"><KeyRound size={13} /> Start code for your safety</li>
              <li className="flex items-center gap-1.5"><RotateCcw size={13} /> 7-day free rework guarantee</li>
            </ul>
            {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button
              type="submit"
              disabled={!ready || submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />} Confirm booking
            </button>
            {!ready && (
              <p className="mt-2 text-center text-xs text-gray-400">
                {!provider ? "Choose a professional" : !date ? "Pick a day" : !time ? "Pick a time" : "Add your full address (10+ characters)"}
              </p>
            )}
            <p className="mt-3 text-center text-xs text-gray-400">Pay online or in cash after the service.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Step({ n, title, done, disabled, children }: { n: number; title: string; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 ${disabled ? "pointer-events-none opacity-50" : ""}`} inert={disabled}>
      <h2 className="mb-4 flex items-center gap-3 text-base font-bold text-gray-950">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-700"}`}>
          {done ? <CheckCircle2 size={15} /> : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, value, muted }: { icon: typeof MapPin; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className={`break-words ${muted ? "text-gray-400" : "font-medium text-gray-900"}`}>{value}</dd>
      </div>
    </div>
  );
}
