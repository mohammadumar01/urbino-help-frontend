"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, CalendarCheck2, ChevronDown, Clock3, KeyRound, Loader2, MapPin, MessageCircle,
  RotateCcw, ShieldCheck, Star, Tag, Wallet, Wrench,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getServiceById, type Service } from "@/lib/servicesApi";
import { getProvidersByService, type Provider } from "@/lib/providersApi";
import { getProviderReviews, type ProviderReview } from "@/lib/reviewsApi";
import { apiError } from "@/lib/api";

const inr = (v: string | number | null | undefined) =>
  v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const PROMISES = [
  { icon: Tag, title: "Price locked at booking", text: "The price you see is the price you pay. No surprise charges." },
  { icon: BadgeCheck, title: "Verified professionals", text: "Aadhaar-checked providers and trained, rated professionals." },
  { icon: KeyRound, title: "Start code for safety", text: "Work starts only when you share your 4-digit code at home." },
  { icon: RotateCcw, title: "7-day service guarantee", text: "Not happy? Ask for a free fix within 7 days of completion." },
];

const STEPS = [
  { icon: CalendarCheck2, title: "Pick a pro and a slot", text: "Compare ratings and prices, then choose a free time." },
  { icon: ShieldCheck, title: "Pro confirmed", text: "You get their name and a start code. Track them on the way." },
  { icon: Wrench, title: "Work done at home", text: "Share the code when they arrive. Watch the progress live." },
  { icon: Wallet, title: "Pay and rate", text: "Pay online or cash after the service. Rate your experience." },
];

const FAQ = [
  { q: "Can I reschedule or cancel?", a: "Yes, from My Bookings while the booking is pending or confirmed. Paid bookings are refunded automatically on cancel." },
  { q: "When do I pay?", a: "Pay online right after booking or choose cash and pay the professional after the service." },
  { q: "What if the work isn't right?", a: "Use the 7-day service guarantee from My Bookings. Your provider schedules a free fix, or our team steps in." },
];

export default function ServiceDetailsPage() {
  const params = useParams();
  const serviceId = Number(params.id);

  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setError("This service link is not valid.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getServiceById(serviceId), getProvidersByService(serviceId).catch(() => ({ providers: [] as Provider[] }))])
      .then(([s, p]) => {
        if (cancelled) return;
        setService(s.service);
        setProviders(p.providers || []);
      })
      .catch((e) => !cancelled && setError(apiError(e, "We couldn't load this service.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const stats = useMemo(() => {
    if (!providers.length) return null;
    const prices = providers.map((p) => Number(p.price)).filter(Number.isFinite);
    const rated = providers.filter((p) => Number(p.total_reviews) > 0);
    const reviews = rated.reduce((s, p) => s + Number(p.total_reviews), 0);
    const avg = reviews ? rated.reduce((s, p) => s + Number(p.average_rating) * Number(p.total_reviews), 0) / reviews : 0;
    return { from: Math.min(...prices), avg, reviews, count: providers.length };
  }, [providers]);

  return (
    <>
      <Navbar />
      <main className="bg-gray-50">
        {loading ? (
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-24 text-gray-500">
            <Loader2 className="animate-spin" size={18} /> Loading service…
          </div>
        ) : error || !service ? (
          <div className="mx-auto max-w-xl px-6 py-24 text-center">
            <h1 className="text-2xl font-bold text-gray-950">Service not available</h1>
            <p className="mt-2 text-gray-500">{error || "We couldn't find this service."}</p>
            <Link href="/services" className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
              Browse all services
            </Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <section className="border-b border-gray-200 bg-white">
              <div className="mx-auto max-w-6xl px-6 py-8 lg:py-12">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
                  <Link href="/services" className="inline-flex items-center gap-1.5 hover:text-gray-900">
                    <ArrowLeft size={15} /> Services
                  </Link>
                  <span className="text-gray-300">/</span>
                  <span>{service.category_name}</span>
                </nav>

                <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
                  <div>
                    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{service.category_name}</span>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">{service.name}</h1>
                    <p className="mt-3 max-w-xl text-lg leading-8 text-gray-600">{service.description || "Trusted professionals at your doorstep."}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                      <p>
                        <span className="text-gray-500">Starts at </span>
                        <span className="text-2xl font-bold text-gray-950">{inr(stats?.from ?? service.base_price)}</span>
                      </p>
                      {stats && stats.reviews > 0 && (
                        <p className="flex items-center gap-1.5 text-gray-700">
                          <Star size={16} className="fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{stats.avg.toFixed(1)}</span>
                          <span className="text-gray-500">({stats.reviews} reviews)</span>
                        </p>
                      )}
                      {stats && (
                        <p className="text-gray-600">
                          {stats.count} professional{stats.count > 1 ? "s" : ""} available
                        </p>
                      )}
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={providers.length ? "#professionals" : `/booking?serviceId=${service.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        {providers.length ? "Choose a professional" : "Request this service"}
                      </a>
                      <Link
                        href={`/booking?serviceId=${service.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <Clock3 size={16} /> See free slots
                      </Link>
                    </div>
                  </div>

                  {/* Kaise kaam karta hai */}
                  <aside className="rounded-3xl bg-gray-950 p-6 text-white sm:p-7">
                    <p className="text-sm font-semibold text-orange-300">How it works</p>
                    <ol className="mt-5 space-y-5">
                      {STEPS.map(({ icon: Icon, title, text }, i) => (
                        <li key={title} className="flex gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                            <Icon size={19} />
                          </span>
                          <div>
                            <p className="font-semibold">
                              {i + 1}. {title}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-400">{text}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </aside>
                </div>
              </div>
            </section>

            {/* Promises */}
            <section className="mx-auto max-w-6xl px-6 py-10">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PROMISES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <Icon size={20} className="text-orange-600" />
                    <p className="mt-3 font-semibold text-gray-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Professionals */}
            <section id="professionals" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-12">
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">Choose your professional</h2>
              <p className="mt-1 text-sm text-gray-500">Sorted by rating. Prices are fixed when you book.</p>

              {providers.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <p className="font-semibold text-gray-950">No professionals for this service yet</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                    We&apos;re adding new professionals every week. Ask us in Help and we&apos;ll arrange one for you, or browse similar services.
                  </p>
                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/services" className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white">
                      Browse services
                    </Link>
                    <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700">
                      <MessageCircle size={16} /> Tap Help (bottom right)
                    </span>
                  </div>
                </div>
              ) : (
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {providers.map((p) => (
                    <ProviderCard key={p.provider_id} provider={p} serviceId={service.id} />
                  ))}
                </ul>
              )}
            </section>

            {/* FAQ */}
            <section className="border-t border-gray-200 bg-white">
              <div className="mx-auto max-w-3xl px-6 py-12">
                <h2 className="text-2xl font-bold tracking-tight text-gray-950">Questions</h2>
                <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200">
                  {FAQ.map((f) => (
                    <details key={f.q} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-gray-900">
                        {f.q}
                        <ChevronDown size={18} className="text-gray-400 transition group-open:rotate-180" />
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function ProviderCard({ provider: p, serviceId }: { provider: Provider; serviceId: number }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ProviderReview[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const rating = Number(p.average_rating);
  const count = Number(p.total_reviews);

  async function toggleReviews() {
    setOpen((o) => !o);
    if (reviews || loadingReviews) return;
    setLoadingReviews(true);
    try {
      const r = await getProviderReviews(p.provider_id);
      setReviews(r.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  return (
    <li className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl font-bold text-orange-700">
          {(p.provider_name || "P")[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-gray-950">
            {p.provider_name}
            {p.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            {count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)} ({count})
              </span>
            ) : (
              <span className="text-gray-500">New on Urbino</span>
            )}
            {p.experience_years != null && <span>{p.experience_years} yrs experience</span>}
          </p>
          {p.service_area && (
            <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
              <MapPin size={13} className="mt-0.5 shrink-0" /> {p.service_area}
            </p>
          )}
        </div>
        <p className="text-right">
          <span className="block text-xl font-bold text-gray-950">{inr(p.price)}</span>
          <span className="text-xs text-gray-500">fixed price</span>
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          href={`/booking?serviceId=${serviceId}&providerId=${p.provider_id}`}
          className="flex-1 rounded-xl bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
        >
          Book {p.provider_name.split(" ")[0]}
        </Link>
        <button
          type="button"
          onClick={() => void toggleReviews()}
          aria-expanded={open}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Reviews
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {loadingReviews ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Loading reviews…
            </p>
          ) : !reviews?.length ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    {r.customer_name}
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {r.rating}
                    </span>
                  </p>
                  {r.review && <p className="mt-0.5 text-gray-600">{r.review}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
