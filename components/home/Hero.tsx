"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { currentPosition, rememberPoint, reversePlace } from "@/lib/geoApi";
import { BadgeCheck, CreditCard, MapPin, Search, ShieldCheck, Star } from "lucide-react";

const popular = ["AC Repair", "Home Cleaning", "Electrician", "Salon at Home", "Plumber"];

const trust = [
  { icon: BadgeCheck, label: "Verified professionals" },
  { icon: CreditCard, label: "Upfront pricing" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Star, label: "Rated by customers" },
];

export default function Hero() {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [place, setPlace] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  async function locate() {
    setLocating(true);
    try {
      const p = await currentPosition();
      rememberPoint(p);
      const r = await reversePlace(p).catch(() => null);
      setPlace(r?.city || r?.short || t("Location set"));
    } catch {
      setPlace(t("Location off"));
    } finally {
      setLocating(false);
    }
  }
  const go = (term: string) => router.push(term.trim() ? `/services?q=${encodeURIComponent(term.trim())}` : "/services");
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-14 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {t("Trusted services at your doorstep")}
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            {t("Home services,")} <span className="text-blue-600">{t("booked in minutes.")}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600">
            {t("Cleaning, repairs, beauty, wellness and more. Compare verified professionals and book at a price you see upfront.")}
          </p>

          {/* Search */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              go(q);
            }}
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-blue-100/50 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("Search services")}
                placeholder={t("Search for AC repair, cleaning, salon...")}
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void locate()}
              title={t("Use my location to show nearby professionals")}
              className="hidden max-w-[180px] items-center gap-2 border-l border-gray-100 px-4 text-sm text-gray-600 hover:text-blue-700 sm:flex"
            >
              <MapPin className={`h-4 w-4 shrink-0 ${locating ? "animate-pulse text-blue-600" : ""}`} />
              <span className="truncate">{place ?? t("Your location")}</span>
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("Search")}
            </button>
          </form>

          {/* Popular */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">{t("Popular:")}</span>
            {popular.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => go(item)}
                className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                {t(item)}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2.5 text-sm font-medium text-gray-700">
              <Icon size={18} className="text-blue-600" />
              {t(label)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}