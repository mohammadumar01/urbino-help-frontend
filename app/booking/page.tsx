
"use client";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UserRound,
  Star,
} from "lucide-react";

import api from "../../lib/api";

interface Service {
  id: number;
  name: string;
  description: string;
  base_price: string | number;
  category_name?: string;
}

interface Provider {
  provider_id: number;
  provider_name: string;
  service_id: number;
  service_name: string;
  price: string | number;
  service_area?: string;
  experience_years?: number;
  average_rating?: string | number;
  total_reviews?: string | number;
  is_verified?: boolean;
}

interface Booking {
  id: number;
  service_name: string;
  provider_id?: number | null;
  status?: string;
  booking_date?: string;
  booking_time?: string;
}

  function BookingContent() {
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId");
  const urlProviderId = searchParams.get("providerId");

  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const [address, setAddress] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successBooking, setSuccessBooking] =
    useState<Booking | null>(null);

  const [error, setError] = useState("");

  // Load service and providers
  useEffect(() => {
    async function loadBookingData() {
      try {
        setLoading(true);
        setError("");

        if (!serviceId || !Number.isInteger(Number(serviceId))) {
          setError("Invalid service. Please select a service first.");
          return;
        }

        // Fetch actual service details
        const serviceResponse = await api.get(
          `/api/services/${serviceId}`
        );

        const serviceData =
          serviceResponse.data.service;

        if (!serviceData) {
          setError("Service not found.");
          return;
        }

        setService(serviceData);

        // Fetch providers for this service
        const providerResponse = await api.get(
          "/api/service-discovery/providers",
          {
            params: {
              service_id: serviceId,
              service_area: "Kota",
            },
          }
        );

        const providerList: Provider[] =
          providerResponse.data.providers || [];

        setProviders(providerList);

        // Preselect provider if user came from a provider profile
        if (urlProviderId) {
          const matchingProvider = providerList.find(
            (provider) =>
              String(provider.provider_id) ===
              String(urlProviderId)
          );

          if (matchingProvider) {
            setSelectedProviderId(
              String(matchingProvider.provider_id)
            );
          }
        } else if (providerList.length === 1) {
          // Automatically select if only one provider exists
          setSelectedProviderId(
            String(providerList[0].provider_id)
          );
        }
      } catch (err: any) {
        console.error("Booking data error:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load service or providers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookingData();
  }, [serviceId, urlProviderId]);

  async function handleBooking(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!service) {
      setError("Service details are not available.");
      return;
    }

    if (!selectedProviderId) {
      setError("Please select a service provider.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post(
        "/api/booking/create",
        {
          service_name: service.name,
          address,
          booking_date: bookingDate,
          booking_time: bookingTime,
          provider_id: Number(selectedProviderId),
        }
      );

      console.log("Booking response:", response.data);

      const booking: Booking =
        response.data.booking;

      if (!booking) {
        throw new Error(
          "Booking created, but booking details were not returned."
        );
      }

      setSuccessBooking(booking);
    } catch (err: any) {
      console.error("Booking failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create booking."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProvider = providers.find(
    (provider) =>
      String(provider.provider_id) === selectedProviderId
  );

  const displayPrice =
    selectedProvider?.price ?? service?.base_price;

  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={22} />
          Loading service details...
        </div>
      </main>
    );
  }

  // Booking success
  if (successBooking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Booking Created!
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Your {successBooking.service_name} booking has
            been created successfully.
          </p>

          <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-left">
            <p className="text-sm text-gray-500">
              Booking ID
            </p>

            <p className="mt-1 font-bold text-gray-950">
              #{successBooking.id}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Status
            </p>

            <p className="mt-1 font-semibold capitalize text-yellow-700">
              {(successBooking.status || "pending").replace(
                /_/g,
                " "
              )}
            </p>
          </div>

          <Link
            href="/bookings"
            className="mt-7 inline-flex w-full justify-center rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            View My Bookings
          </Link>

          <Link
            href="/services"
            className="mt-3 inline-flex text-sm font-medium text-gray-600 hover:text-gray-950"
          >
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href="/services"
            className="flex w-fit items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Back to services
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Urbino Booking
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            Book your service
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Select a provider and schedule your service.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!service ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="font-semibold text-gray-900">
              Unable to load service.
            </p>

            <Link
              href="/services"
              className="mt-4 inline-block text-blue-600 underline"
            >
              Browse services
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Service Summary */}
            <div className="h-fit rounded-3xl bg-gray-950 p-7 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-400">
                Selected Service
              </p>

              <h2 className="mt-4 text-2xl font-bold">
                {service.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {service.description ||
                  "Professional home service."}
              </p>

              <div className="mt-7 border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-400">
                    Service price
                  </span>

                  <span className="text-xl font-bold">
                    ₹{displayPrice ?? "Not available"}
                  </span>
                </div>
              </div>

              {selectedProvider && (
                <div className="mt-6 rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-gray-400">
                    Selected Provider
                  </p>

                  <p className="mt-2 font-semibold">
                    {selectedProvider.provider_name}
                  </p>

                  {selectedProvider.is_verified && (
                    <p className="mt-1 text-xs text-green-400">
                      Verified Provider
                    </p>
                  )}

                  {selectedProvider.average_rating && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-gray-300">
                      <Star
                        size={15}
                        className="text-yellow-400"
                      />
                      {selectedProvider.average_rating}
                      {" "}({selectedProvider.total_reviews || 0} reviews)
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={18}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Select your date
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock3
                    size={18}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Select your time
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin
                    size={18}
                    className="text-blue-400"
                  />
                  <span className="text-sm text-gray-300">
                    Service at your location
                  </span>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500">
                  Service ID
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  {service.id}
                </p>

                <p className="mt-3 text-xs text-gray-500">
                  Provider ID
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  {selectedProviderId || "Not selected"}
                </p>
              </div>
            </div>

            {/* Booking Form */}
            <form
              onSubmit={handleBooking}
              className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-8"
            >
              <h2 className="text-xl font-bold text-gray-950">
                Booking details
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Choose your provider, address, date and time.
              </p>

              {/* Provider Selection */}
              <div className="mt-7">
                <label
                  htmlFor="provider"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Select Service Provider
                </label>

                {providers.length === 0 ? (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    No providers found for this service in
                    Kota. Please try again later or select
                    another service.
                  </div>
                ) : (
                  <select
                    id="provider"
                    value={selectedProviderId}
                    onChange={(e) =>
                      setSelectedProviderId(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
                  >
                    <option value="">
                      Choose a provider
                    </option>

                    {providers.map((provider) => (
                      <option
                        key={provider.provider_id}
                        value={provider.provider_id}
                      >
                        {provider.provider_name}
                        {" — ₹"}
                        {provider.price}
                        {provider.is_verified
                          ? " (Verified)"
                          : ""}
                      </option>
                    ))}
                  </select>
                )}

                {selectedProvider && (
                  <div className="mt-3 rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <UserRound
                        size={20}
                        className="text-gray-500"
                      />

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedProvider.provider_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {selectedProvider.experience_years ?? 0}
                          {" "}years experience
                        </p>
                      </div>
                    </div>

                    {selectedProvider.service_area && (
                      <p className="mt-3 text-xs text-gray-500">
                        Service areas: {selectedProvider.service_area}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="mt-6">
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Service Address
                </label>

                <textarea
                  id="address"
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="Enter your complete address"
                  required
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500"
                />
              </div>

              {/* Date */}
              <div className="mt-5">
                <label
                  htmlFor="booking-date"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Booking Date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  min={localToday}
                  onChange={(e) =>
                    setBookingDate(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
                />
              </div>

              {/* Time */}
              <div className="mt-5">
                <label
                  htmlFor="booking-time"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Booking Time
                </label>

                <input
                  id="booking-time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) =>
                    setBookingTime(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  providers.length === 0 ||
                  !selectedProviderId
                }
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creating Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          Loading booking page...
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}