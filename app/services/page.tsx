"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Search,
  MapPin,
  Home,
  Scissors,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  BriefcaseBusiness,
  Truck,
  PawPrint,
  ShieldCheck,
  Wrench,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  getServices,
  Service,
} from "../../lib/servicesApi";

import Link from "next/link";

const categories = [
  {
    name: "Home Services",
    description: "Cleaning, repair & maintenance",
    icon: Home,
  },
  {
    name: "Beauty & Grooming",
    description: "Salon & personal care",
    icon: Scissors,
  },
  {
    name: "Health & Wellness",
    description: "Care for you & your family",
    icon: HeartPulse,
  },
  {
    name: "Fitness & Lifestyle",
    description: "Training & wellness",
    icon: Dumbbell,
  },
  {
    name: "Education",
    description: "Tutors & skill training",
    icon: GraduationCap,
  },
  {
    name: "Professional",
    description: "Experts for important needs",
    icon: BriefcaseBusiness,
  },
  {
    name: "Moving & Events",
    description: "Moving, events & catering",
    icon: Truck,
  },
  {
    name: "Pet Care",
    description: "Grooming & veterinary care",
    icon: PawPrint,
  },
  {
    name: "Security",
    description: "Security & protection",
    icon: ShieldCheck,
  },
  {
    name: "Repair & Maintenance",
    description: "AC, electrical & repairs",
    icon: Wrench,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchServices(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const data = await getServices({
        search: searchValue || undefined,
        page: 1,
        limit: 10,
      });

      setServices(data.services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setError("Unable to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function handleSearch() {
    fetchServices(search.trim());
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Urbino Services
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Find the right service.
              <br />
              <span className="text-blue-600">
                Get it done.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Explore trusted professionals across home, beauty,
              wellness, fitness, education and everyday services.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 flex max-w-4xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg sm:flex-row">

            <div className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <Search className="h-5 w-5 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search for a service..."
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 sm:w-56">
              <MapPin className="h-5 w-5 text-gray-400" />

              <span className="text-sm text-gray-500">
                Select location
              </span>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Search size={17} />
              )}

              Search
            </button>

          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          
          <div className="mb-8 flex justify-end">
              <Link
                href="/bookings"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                My Bookings
                <ArrowRight size={16} />
              </Link>
            </div>

          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Categories
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Explore by category
              </h2>
            </div>

            <span className="hidden text-sm text-gray-500 sm:block">
              100+ services available
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.name}
                  type="button"
                  className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-900 transition group-hover:bg-gray-950 group-hover:text-white">
                    <Icon size={21} strokeWidth={1.8} />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-gray-950">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    {category.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gray-800">
                    Explore

                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* Backend Services */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Available Services
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Services from Urbino
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                These services are being loaded directly from the Urbino
                backend.
              </p>
            </div>

            {!loading && !error && (
              <span className="hidden rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 sm:block">
                {services.length} services found
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-10 flex min-h-60 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2
                  size={28}
                  className="animate-spin text-gray-900"
                />

                <p className="text-sm">
                  Loading services...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-10 flex min-h-60 items-center justify-center rounded-3xl border border-red-200 bg-red-50">
              <div className="flex max-w-md flex-col items-center text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                  <AlertCircle size={22} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-950">
                  Something went wrong
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => fetchServices(search)}
                  className="mt-5 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Try Again
                </button>

              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && services.length === 0 && (
            <div className="mt-10 flex min-h-60 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
              <div className="text-center">

                <h3 className="text-lg font-semibold text-gray-950">
                  No services found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try searching for another service.
                </p>

              </div>
            </div>
          )}

          {/* Real Services */}
          {!loading && !error && services.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {services.map((service) => (
                <article
                  key={service.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
                >

                  {/* Visual Header */}
                  <div className="relative flex h-44 items-end overflow-hidden bg-gray-950 p-5">

                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-600/20" />

                    <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-blue-500/10" />

                    <div className="relative">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200 backdrop-blur">
                        {service.category_name}
                      </span>

                      <h3 className="mt-3 text-xl font-bold text-white">
                        {service.name}
                      </h3>
                    </div>

                  </div>

                  {/* Content */}
                  <div className="p-5">

                    <p className="min-h-12 text-sm leading-6 text-gray-500">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-5">

                      <div>
                        <p className="text-xs text-gray-400">
                          Starting from
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-950">
                          ₹{Number(service.base_price).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <a
                        href={`/service/${service.id}`}
                        className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        View Service
                        <ArrowRight size={15} />
                      </a>

                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </div>
      </section>

    </main>
  );
}