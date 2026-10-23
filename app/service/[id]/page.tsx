
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Star,
} from "lucide-react";

import {
  getServiceById,
  Service,
} from "../../../lib/servicesApi";

import {
  getProvidersByService,
  Provider,
} from "../../../lib/providersApi";

import {
  getProviderReviews,
  type ProviderReview,
} from "../../../lib/reviewsApi";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Professionals",
    description:
      "Professionals are verified before joining Urbino.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Booking",
    description:
      "Your booking and payment experience stays protected.",
  },
  {
    icon: Clock3,
    title: "Flexible Scheduling",
    description:
      "Choose a convenient time according to your availability.",
  },
];

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const serviceIdParam = params.id;
  const serviceId = Number(
    Array.isArray(serviceIdParam)
      ? serviceIdParam[0]
      : serviceIdParam
  );

  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [loading, setLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [error, setError] = useState("");
  const [providerError, setProviderError] = useState("");

  const [providerReviews, setProviderReviews] = useState<
    Record<number, ProviderReview[]>
  >({});

  const [expandedProviderId, setExpandedProviderId] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchServiceData() {
      try {
        setLoading(true);
        setError("");

        if (!Number.isInteger(serviceId) || serviceId < 1) {
          setError("Invalid service ID.");
          return;
        }

        // Fetch service details
        const serviceData = await getServiceById(serviceId);

        if (cancelled) return;

        setService(serviceData.service);

        // Fetch providers
        try {
          setProvidersLoading(true);
          setProviderError("");

          const providerData = await getProvidersByService(
            serviceId,
            "Kota"
          );

          if (cancelled) return;

          const providerList = providerData.providers || [];
          setProviders(providerList);

          // Fetch reviews for each provider
          const reviewsResults = await Promise.all(
            providerList.map(async (provider) => {
              try {
                const result = await getProviderReviews(
                  provider.provider_id
                );

                return [
                  provider.provider_id,
                  Array.isArray(result.reviews)
                    ? result.reviews
                    : [],
                ] as const;
              } catch (error) {
                console.error(
                  `Failed to load reviews for provider ${provider.provider_id}:`,
                  error
                );

                return [provider.provider_id, []] as const;
              }
            })
          );

          if (cancelled) return;

          setProviderReviews(
            Object.fromEntries(reviewsResults)
          );
        } catch (error) {
          console.error("Failed to fetch providers:", error);

          if (!cancelled) {
            setProviderError(
              "Unable to load available professionals."
            );
          }
        } finally {
          if (!cancelled) {
            setProvidersLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch service:", error);

        if (!cancelled) {
          setError("Unable to load this service.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchServiceData();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  // Loading
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2
            size={30}
            className="animate-spin text-gray-900"
          />

          <p className="text-sm">Loading service...</p>
        </div>
      </main>
    );
  }

  // Error
  if (error || !service) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={25} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Service not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error ||
              "The requested service could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/services")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Services
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/services")}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Back to services
          </button>
        </div>
      </div>

      {/* Service Header */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {service.category_name}
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                  Available Service
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
                {service.name}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600">
                {service.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/booking?serviceId=${service.id}`
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Book a Service
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("professionals")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <MapPin size={17} />
                  Check Availability
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-950">
              <div className="flex h-[360px] items-end p-7 sm:h-[420px]">
                <div>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                    {service.category_name}
                  </span>

                  <h2 className="mt-4 text-3xl font-bold text-white">
                    {service.name}
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Trusted service through Urbino
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Details + Pricing */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Service Details
              </p>

              <h2 className="mt-3 text-2xl font-bold text-gray-950">
                About this service
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
                {service.description}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {[
                  "Professional service",
                  "Service at your location",
                  "Convenient scheduling",
                  "Verified professionals",
                  "Transparent pricing",
                  "Secure booking",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <BadgeCheck size={16} />
                    </div>

                    <span className="text-sm font-medium text-gray-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-950 p-7 text-white sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-400">
                Pricing
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                ₹
                {Number(
                  service.base_price
                ).toLocaleString("en-IN")}
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Starting price
              </p>

              <p className="mt-5 text-sm leading-6 text-gray-400">
                Final pricing may vary depending on the service
                required and any additional parts or work needed.
              </p>

              <div className="mt-7 space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={19}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Choose your preferred date
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock3
                    size={19}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Select a convenient time
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin
                    size={19}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Service at your location
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/booking?serviceId=${service.id}`
                  )
                }
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
              >
                Book This Service
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Providers */}
      <section id="professionals" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Professionals
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Available professionals
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Verified professionals available for this service in Kota.
            </p>
          </div>

          {/* Provider Loading */}
          {providersLoading && (
            <div className="mt-10 flex items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 py-16">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2
                  size={24}
                  className="animate-spin"
                />

                <span className="text-sm">
                  Finding professionals...
                </span>
              </div>
            </div>
          )}

          {/* Provider Error */}
          {!providersLoading && providerError && (
            <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle
                size={28}
                className="mx-auto text-red-500"
              />

              <p className="mt-3 text-sm font-medium text-red-700">
                {providerError}
              </p>
            </div>
          )}

          {/* No Providers */}
          {!providersLoading &&
            !providerError &&
            providers.length === 0 && (
              <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <BadgeCheck
                  size={30}
                  className="mx-auto text-gray-400"
                />

                <h3 className="mt-4 text-lg font-semibold text-gray-950">
                  No professionals available
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  No verified professional is currently available
                  for this service in Kota.
                </p>
              </div>
            )}

          {/* Provider Cards */}
          {!providersLoading &&
            !providerError &&
            providers.length > 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => {
                  const reviews =
                    providerReviews[provider.provider_id] || [];

                  const isExpanded =
                    expandedProviderId === provider.provider_id;

                  return (
                    <article
                      key={provider.provider_id}
                      className="overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:shadow-lg"
                    >
                      {/* Image */}
                      <div className="h-56 bg-gray-100">
                        {provider.profile_image ? (
                          <img
                            src={provider.profile_image}
                            alt={provider.provider_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Name and Rating */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-950">
                              {provider.provider_name}
                            </h3>

                            {provider.is_verified && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                <BadgeCheck size={15} />
                                Verified Professional
                              </div>
                            )}
                          </div>

                          {/* Average Rating */}
                          <div className="flex flex-col items-end">
                            {Number(provider.total_reviews) > 0 ? (
                              <>
                                <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2.5 py-1.5">
                                  <Star
                                    size={14}
                                    className="fill-yellow-400 text-yellow-400"
                                  />

                                  <span className="text-sm font-semibold text-gray-800">
                                    {Number(
                                      provider.average_rating || 0
                                    ).toFixed(1)}
                                  </span>
                                </div>

                                <span className="mt-1 text-xs text-gray-500">
                                  {provider.total_reviews} reviews
                                </span>
                              </>
                            ) : (
                              <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
                                No reviews yet
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Provider Details */}
                        <div className="mt-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Experience
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                              {provider.experience_years} years
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Reviews
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                              {provider.total_reviews ?? 0}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                              <MapPin size={15} />
                              Area
                            </span>

                            <span className="text-right text-sm font-semibold text-gray-900">
                              {provider.service_area}
                            </span>
                          </div>
                        </div>

                        {/* Reviews */}
                        <div className="mt-5 border-t border-gray-100 pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProviderId(
                                isExpanded
                                  ? null
                                  : provider.provider_id
                              )
                            }
                            className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                          >
                            <span>
                              {isExpanded
                                ? "Hide Reviews"
                                : "View Reviews"}
                            </span>

                            <ArrowRight
                              size={16}
                              className={
                                isExpanded
                                  ? "rotate-90 transition"
                                  : "transition"
                              }
                            />
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {reviews.length > 0 ? (
                                reviews.map((review) => (
                                  <div
                                    key={review.id}
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {review.customer_name}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                          {new Date(
                                            review.created_at
                                          ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1">
                                        <Star
                                          size={13}
                                          className="fill-yellow-400 text-yellow-400"
                                        />

                                        <span className="text-xs font-semibold text-gray-800">
                                          {review.rating}/5
                                        </span>
                                      </div>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                                      {review.review?.trim() ||
                                        "No written comment provided."}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-xl bg-gray-50 p-4 text-center">
                                  <Star
                                    size={22}
                                    className="mx-auto text-gray-400"
                                  />

                                  <p className="mt-2 text-sm font-medium text-gray-700">
                                    No reviews yet
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    Reviews will appear here after customers
                                    complete their bookings.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Price and Booking */}
                        <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
                          <div>
                            <p className="text-xs text-gray-500">
                              Service price
                            </p>

                            <p className="mt-1 text-2xl font-bold text-gray-950">
                              ₹
                              {Number(
                                provider.price
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/booking?serviceId=${service.id}&providerId=${provider.provider_id}`
                              )
                            }
                            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                          >
                            Book
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </div>
      </section>

      {/* Why Urbino */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Why Urbino
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Service without the hassle
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 text-white">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-gray-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-blue-600 px-7 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100">
              Find a trusted professional and book the service you need
              in just a few simple steps.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/booking?serviceId=${service.id}`
                )
              }
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Book a Service
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
