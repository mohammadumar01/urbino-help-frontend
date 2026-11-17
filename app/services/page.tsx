"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  Loader2,
  PawPrint,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { getServices, Service } from "../../lib/servicesApi";

/* ----------------------------- Config & data ------------------------------ */

// Change these if your routes are different.
const ROUTES = {
  home: "/",
  bookings: "/bookings",
  becomeProvider: "/become-provider",
  service: (id: Service["id"]) => `/service/${id}`,
};

const PAGE_SIZE = 24;

type Category = {
  key: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
};

const CATEGORIES: Category[] = [
  { key: "home", label: "Home", icon: Home, keywords: ["home", "clean", "plumb", "paint", "carpent", "house"] },
  { key: "beauty", label: "Beauty", icon: Scissors, keywords: ["beauty", "salon", "groom", "makeup", "spa", "hair"] },
  { key: "health", label: "Health", icon: HeartPulse, keywords: ["health", "wellness", "nurse", "physio", "care", "doctor"] },
  { key: "fitness", label: "Fitness", icon: Dumbbell, keywords: ["fitness", "yoga", "gym", "trainer", "lifestyle"] },
  { key: "education", label: "Education", icon: GraduationCap, keywords: ["educat", "tutor", "teach", "coach", "class", "skill"] },
  { key: "professional", label: "Professional", icon: BriefcaseBusiness, keywords: ["professional", "legal", "account", "consult", "tax"] },
  { key: "moving", label: "Moving & Events", icon: Truck, keywords: ["moving", "event", "cater", "packer", "shift", "decor"] },
  { key: "pets", label: "Pet care", icon: PawPrint, keywords: ["pet", "dog", "cat", "vet"] },
  { key: "security", label: "Security", icon: ShieldCheck, keywords: ["secur", "guard", "cctv", "protect"] },
  { key: "repair", label: "Repair", icon: Wrench, keywords: ["repair", "maintenance", "ac ", "electric", "appliance", "fix"] },
];

const POPULAR = ["AC repair", "Cleaning", "Salon", "Plumber", "Electrician"];

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name (A–Z)" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

const TRUST = [
  { icon: BadgeCheck, text: "Verified professionals" },
  { icon: CalendarCheck, text: "Track every booking" },
  { icon: Wallet, text: "Clear starting prices" },
];

/* -------------------------------- Helpers --------------------------------- */

const matchesCategory = (s: Service, c: Category) => {
  const cat = String(s.category_name ?? "").toLowerCase();
  if (cat === c.label.toLowerCase()) return true;
  const haystack = `${cat} ${String(s.name ?? "").toLowerCase()} `;
  return c.keywords.some((k) => haystack.includes(k));
};

const categoryOf = (s: Service) => CATEGORIES.find((c) => matchesCategory(s, c));

const priceOf = (s: Service) => {
  const n = Number(s.base_price);
  return Number.isFinite(n) ? n : null;
};

const formatPrice = (n: number | null) =>
  n === null ? "On request" : `₹${n.toLocaleString("en-IN")}`;

/* ---------------------------------- Logo ---------------------------------- */

function UrbinoLogo({ className = "h-9 w-9" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const ring = `ring-${uid}`;
  const disc = `disc-${uid}`;

  return (
    <svg viewBox="0 0 640 640" className={className} role="img" aria-label="Urbino Help">
      <defs>
        <linearGradient id={ring} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
          <stop offset="0" stopColor="#E5402B" />
          <stop offset="0.5" stopColor="#EF7A2D" />
          <stop offset="1" stopColor="#F4B63F" />
        </linearGradient>
        <linearGradient id={disc} gradientUnits="userSpaceOnUse" x1="0" y1="89" x2="0" y2="545">
          <stop offset="0" stopColor="#F8B533" />
          <stop offset="0.5" stopColor="#F0702B" />
          <stop offset="1" stopColor="#DD3226" />
        </linearGradient>
      </defs>
      <circle cx="320" cy="320" r="316" fill="#fff" stroke={`url(#${ring})`} strokeWidth="8" />
      <circle cx="320" cy="317" r="228" fill={`url(#${disc})`} />
      <path d="M192 139V376A128 128 0 0 0 448 376V139" fill="none" stroke="#fff" strokeWidth="30" />
      <path d="M207 94V376A113 113 0 0 0 433 376V94Z" fill={`url(#${disc})`} />
      <path d="M262 60V177A58 58 0 0 0 378 177V60Z" fill="#fff" />
      <path d="M262 485V349A58 58 0 0 1 378 349V485Z" fill="#fff" />
    </svg>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortValue>("relevance");

  const [loaded, setLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);

  const load = useCallback(async (nextPage: number, term: string) => {
    const id = ++reqRef.current;
    const append = nextPage > 1;
    if (append) setLoadingMore(true);
    else setFetching(true);
    setError("");

    try {
      const data = await getServices({
        search: term || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      if (id !== reqRef.current) return;

      setServices((prev) => {
        const next = append ? [...prev, ...data.services] : data.services;
        return Array.from(new Map(next.map((s) => [s.id, s] as const)).values());
      });
      setPage(nextPage);
      setHasMore(data.services.length >= PAGE_SIZE);
      setLoaded(true);
    } catch (err) {
      if (id !== reqRef.current) return;
      console.error("Failed to fetch services:", err);
      setError("We couldn't load services. Check your connection and try again.");
    } finally {
      if (id === reqRef.current) {
        setFetching(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Initial load + debounced server search.
  useEffect(() => {
    const t = setTimeout(() => void load(1, search.trim()), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, load]);

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeCategory = CATEGORIES.find((c) => c.key === category) ?? null;

  const visible = useMemo(() => {
    const list = activeCategory ? services.filter((s) => matchesCategory(s, activeCategory)) : [...services];
    if (sort === "price-asc") list.sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity));
    else if (sort === "price-desc") list.sort((a, b) => (priceOf(b) ?? -Infinity) - (priceOf(a) ?? -Infinity));
    else if (sort === "name") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return list;
  }, [services, activeCategory, sort]);

  const hasFilters = Boolean(search.trim() || category);
  const showSkeleton = !loaded && !error;
  const title = activeCategory
    ? activeCategory.label
    : search.trim()
    ? `Results for “${search.trim()}”`
    : "All services";

  function clearFilters() {
    setSearch("");
    setCategory(null);
    setSort("relevance");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link href={ROUTES.home} className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A]">
            <UrbinoLogo className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">Urbino Help</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
            <Link
              href={ROUTES.becomeProvider}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A] sm:inline-flex"
            >
              Become a provider
            </Link>
            <Link
              href={ROUTES.bookings}
              className="inline-flex items-center gap-2 rounded-full bg-[#E8692A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D45A1F] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E8692A]/30"
            >
              My bookings
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-orange-50/70 via-white to-white">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-14 text-center sm:pt-20">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            What do you need help with?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Book trusted professionals for your home, beauty, health and everyday needs.
          </p>

          <div className="relative mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition focus-within:border-[#E8692A] focus-within:shadow-[0_4px_20px_rgba(232,105,42,0.18)] focus-within:ring-4 focus-within:ring-[#E8692A]/10 hover:border-slate-300">
              <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for AC repair, cleaning, salon…"
                aria-label="Search services"
                className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
              {fetching && loaded && <Loader2 size={18} className="shrink-0 animate-spin text-slate-400 motion-reduce:animate-none" aria-hidden="true" />}
              {search ? (
                <button
                  type="button"
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A]"
                >
                  <X size={18} />
                </button>
              ) : (
                <kbd className="hidden h-6 shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-500 sm:flex">/</kbd>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-slate-500">Popular:</span>
            {POPULAR.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSearch(p)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-slate-700 transition hover:border-[#E8692A]/40 hover:bg-orange-50 hover:text-[#C9531A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 pb-8 text-sm text-slate-600">
          {TRUST.map(({ icon: TIcon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <TIcon size={17} className="text-[#E8692A]" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section aria-label="Categories" className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <div
            role="group"
            aria-label="Filter by category"
            className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIES.map((c) => {
              const CIcon = c.icon;
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? null : c.key)}
                  className={`group flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A] ${
                    active ? "bg-orange-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                      active
                        ? "bg-[#E8692A] text-white shadow-md shadow-orange-300/50"
                        : "bg-slate-100 text-slate-700 group-hover:bg-orange-100 group-hover:text-[#C9531A]"
                    }`}
                  >
                    <CIcon size={24} strokeWidth={1.7} />
                  </span>
                  <span className={`text-xs leading-4 ${active ? "font-semibold text-[#C9531A]" : "font-medium text-slate-600"}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-500" aria-live="polite">
                {!loaded && !error ? "Loading services…" : `${visible.length} ${visible.length === 1 ? "service" : "services"}${hasMore ? "+" : ""} available`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A]"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
              <label className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span className="sr-only sm:not-sr-only">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortValue)}
                  className="rounded-full border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#E8692A] focus:ring-4 focus:ring-[#E8692A]/10"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mt-8 flex flex-col items-center rounded-2xl border border-rose-200 bg-white px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertCircle size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Something went wrong</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => void load(1, search.trim())}
                className="mt-5 rounded-full bg-[#E8692A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D45A1F] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E8692A]/30"
              >
                Try again
              </button>
            </div>
          )}

          {/* Skeleton */}
          {showSkeleton && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[236px] animate-pulse rounded-2xl border border-slate-200 bg-white p-5 motion-reduce:animate-none">
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                  <div className="mt-5 h-3 w-20 rounded bg-slate-100" />
                  <div className="mt-3 h-5 w-3/4 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {loaded && !error && visible.length === 0 && (
            <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#E8692A]">
                <Search size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">No services found</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Try a different keyword or pick another category.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A]"
                >
                  Show all services
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {loaded && visible.length > 0 && (
            <div
              className={`mt-8 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${fetching ? "opacity-60" : "opacity-100"}`}
              aria-busy={fetching}
            >
              {visible.map((service) => {
                const cat = categoryOf(service);
                const CardIcon = cat?.icon ?? Sparkles;
                return (
                  <Link
                    key={service.id}
                    href={ROUTES.service(service.id)}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A] motion-reduce:hover:translate-y-0"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#E8692A] transition group-hover:bg-[#E8692A] group-hover:text-white">
                      <CardIcon size={22} strokeWidth={1.7} />
                    </span>

                    <p className="mt-4 text-xs font-medium text-slate-500">{service.category_name}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-950">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-[1.4rem] text-slate-500">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">Starting from</p>
                        <p className="text-lg font-semibold tabular-nums text-slate-950">{formatPrice(priceOf(service))}</p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-[#E8692A] group-hover:text-white">
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {loaded && !error && hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => void load(page + 1, search.trim())}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A] disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />}
                {loadingMore ? "Loading" : "Show more services"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Provider CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div
            className="flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-[#1a110b] px-8 py-10 text-white sm:flex-row sm:items-center sm:px-12"
            style={{ backgroundImage: "radial-gradient(60% 120% at 90% 0%, rgba(238,116,48,0.4) 0%, rgba(26,17,11,0) 70%)" }}
          >
            <div className="flex items-center gap-5">
              <UrbinoLogo className="hidden h-14 w-14 shrink-0 sm:block" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Offer your skills on Urbino</h2>
                <p className="mt-1.5 max-w-lg text-sm leading-6 text-stone-300">
                  Join as a service professional and get booking requests from customers near you.
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.becomeProvider}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E8692A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#F07A3B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E8692A]/40"
            >
              Become a provider
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <UrbinoLogo className="h-7 w-7" />
            <span className="font-medium text-slate-700">Urbino Help</span>
          </div>
          <p>© {new Date().getFullYear()} Urbino Help. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}