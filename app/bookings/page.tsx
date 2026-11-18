"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
ArrowLeft,
CalendarDays,
Clock3,
MapPin,
Loader2,
PackageCheck,
XCircle,
RefreshCw,
Star,
} from "lucide-react";

import api from "../../lib/api";
import RequireRole from "../../components/auth/RequireRole";
import JobTimeline from "../../components/booking/JobTimeline";
import GuaranteeBox from "../../components/booking/GuaranteeBox";
import LiveTracking from "../../components/maps/LiveTracking";
import PaymentActions, { PaymentBadge } from "../../components/payments/PaymentActions";
import type { PaymentStatus } from "../../lib/paymentsApi";

interface Booking {
id: number;
service_name?: string;
address?: string;
booking_date?: string;
booking_time?: string;
status?: string;
created_at?: string;
price?: string | number;
amount?: string | number;
provider_id?: number;
provider_name?: string | null;
agent_name?: string | null;
agent_phone?: string | null;
has_review?: boolean;
start_otp?: string | null;
rework_of?: number | null;
can_claim?: boolean;
claim_status?: "requested" | "accepted" | "rejected" | "escalated" | null;
claim_note?: string | null;
provider_accepted_at?: string | null;
agent_accepted_at?: string | null;
on_the_way_at?: string | null;
started_at?: string | null;
completed_at?: string | null;
payment_status?: PaymentStatus | null;
payment_method?: string | null;
}

interface BookingsResponse {
success: boolean;
message?: string;
bookings: Booking[];
}

export default function BookingsPage() {
return (
<RequireRole roles={["customer"]}>
<BookingsContent />
</RequireRole>
);
}

function BookingsContent() {
const [bookings, setBookings] = useState<Booking[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [reviewingId, setReviewingId] = useState<number | null>(null);
const [rating, setRating] = useState(0);
const [reviewText, setReviewText] = useState("");
const [submittingReview, setSubmittingReview] = useState(false);
const [reviewedIds, setReviewedIds] = useState<number[]>([]);

const [cancellingId, setCancellingId] = useState<number | null>(
null
);

const [reschedulingId, setReschedulingId] = useState<number | null>(
null
);

const [rescheduleDate, setRescheduleDate] = useState("");
const [rescheduleTime, setRescheduleTime] = useState("");

async function fetchBookings(silent = false) {
  try {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    const response = await api.get<BookingsResponse>(
      "/api/booking/my-bookings"
    );

    setBookings(response.data.bookings || []);
  } catch (error: any) {
    console.error("Failed to fetch bookings:", error);

    if (!silent) {
      setError(
        error?.response?.data?.message ||
          "Unable to load your bookings."
      );
    }
  } finally {
    if (!silent) {
      setLoading(false);
    }
  }
}

useEffect(() => {
  fetchBookings();

  const interval = setInterval(() => {
    fetchBookings(true);
  }, 15000);

  return () => clearInterval(interval);
}, []);

// =========================
// CANCEL BOOKING
// =========================

async function handleCancelBooking(bookingId: number) {
const confirmed = window.confirm(
"Are you sure you want to cancel this booking?"
);

if (!confirmed) {
return;
}

try {
setCancellingId(bookingId);
setError("");

const response = await api.put(
  `/api/booking/cancel/${bookingId}`
);


await fetchBookings();

} catch (error: any) {
console.error(
  "Failed to cancel booking:",
  error
);

setError(
  error?.response?.data?.message ||
    "Unable to cancel booking."
);

} finally {
setCancellingId(null);
}
}


// reviews aur rating 

async function handleSubmitReview(bookingId: number) {
if (rating < 1 || rating > 5) {
setError("Please select a rating between 1 and 5.");
return;
}

try {
setSubmittingReview(true);
setError("");

await api.post("/api/reviews", {
booking_id: bookingId,
rating,
review: reviewText.trim(),
});

setReviewedIds((prev) => [...prev, bookingId]);
setReviewingId(null);
setRating(0);
setReviewText("");

alert("Thank you! Your review has been submitted.");
} catch (error: any) {
setError(
error?.response?.data?.message ||
  "Unable to submit your review."
);
} finally {
setSubmittingReview(false);
}
}
// =========================
// OPEN RESCHEDULE
// =========================

function openReschedule(bookingId: number) {
setReschedulingId(bookingId);
setRescheduleDate("");
setRescheduleTime("");
setError("");
}

// =========================
// CLOSE RESCHEDULE
// =========================

function closeReschedule() {
setReschedulingId(null);
setRescheduleDate("");
setRescheduleTime("");
}

// =========================
// RESCHEDULE BOOKING
// =========================

async function handleRescheduleBooking() {
if (!reschedulingId) {
return;
}

if (!rescheduleDate || !rescheduleTime) {
setError(
  "Please select both date and time."
);
return;
}

try {
setError("");

const response = await api.put(
  `/api/booking/reschedule/${reschedulingId}`,
  {
    booking_date: rescheduleDate,
    booking_time: rescheduleTime,
  }
);


closeReschedule();

await fetchBookings();

} catch (error: any) {
console.error(
  "Failed to reschedule booking:",
  error
);

setError(
  error?.response?.data?.message ||
    "Unable to reschedule booking."
);
}
}

function formatDate(date?: string) {
if (!date) return "Not available";

return new Date(date).toLocaleDateString(
"en-IN",
{
  day: "2-digit",
  month: "short",
  year: "numeric",
}
);
}

function formatStatus(status?: string) {
if (!status) return "Pending";

return status
.replace(/_/g, " ")
.replace(/\b\w/g, (char) =>
  char.toUpperCase()
);
}

function getStatusClass(status?: string) {
const value = status?.toLowerCase();

if (value === "completed") {
return "bg-green-50 text-green-700";
}

if (value === "cancelled") {
return "bg-red-50 text-red-700";
}

if (value === "accepted") {
return "bg-blue-50 text-blue-700";
}

return "bg-yellow-50 text-yellow-700";
}

function getBookingProgress(status?: string) {
  const value = status?.toLowerCase().replace(/_/g, " ");

  if (value === "cancelled") return -1;
  if (value === "completed") return 2;
  if (value === "accepted") return 1;

  return 0;
}

function canManageBooking(status?: string) {
const value = status?.toLowerCase();

// Backend sirf in statuses mein reschedule/cancel allow karta hai
return value === "pending" || value === "provider_accepted";
}

return (
<main className="min-h-screen bg-gray-50">

{/* Header */}
<div className="border-b border-gray-200 bg-white">
  <div className="mx-auto max-w-6xl px-6 py-4">

    <Link
      href="/"
      className="flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
    >
      <ArrowLeft size={17} />
      Back to home
    </Link>

  </div>
</div>

{/* Main */}
<section className="mx-auto max-w-6xl px-6 py-12">

  {/* Heading */}
  <div>
    <p className="text-sm font-bold tracking-[0.2em] text-blue-600">
      URBINO
    </p>

    <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
      My Bookings
    </h1>

    <p className="mt-2 text-sm leading-6 text-gray-500">
      View and manage all your service bookings.
    </p>
  </div>

  {/* Error */}
  {error && !loading && (
    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">

      <p className="text-sm font-semibold text-red-700">
        {error}
      </p>

      <button
        type="button"
        onClick={() => setError("")}
        className="mt-2 text-xs font-semibold text-red-600 underline"
      >
        Dismiss
      </button>

    </div>
  )}

  {/* Loading */}
  {loading && (
    <div className="flex min-h-[300px] items-center justify-center">

      <div className="flex items-center gap-3 text-sm text-gray-500">

        <Loader2
          size={20}
          className="animate-spin"
        />

        Loading your bookings...

      </div>

    </div>
  )}

  {/* Empty */}
  {!loading &&
    bookings.length === 0 && (
      <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <PackageCheck size={28} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-950">
          No bookings yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          You haven't booked any service yet.
          Explore our services and make your first
          booking.
        </p>

        <Link
          href="/services"
          className="mt-6 inline-flex rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Browse Services
        </Link>

      </div>
    )}

  {/* Bookings */}
  {!loading &&
    bookings.length > 0 && (
      <div className="mt-10 space-y-5">

        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >

            {/* Top */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Booking #{booking.id}
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-950">
                  {booking.service_name ||
                    "Service Booking"}
                </h2>

              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                  booking.status
                )}`}
              >
                {formatStatus(
                  booking.status
                )}
              </span>

            </div>

           {/* Live progress */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <JobTimeline booking={booking} />
                {booking.start_otp && (
                  <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-orange-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        {booking.status === "on_the_way" ? "Your professional is on the way" : "Your professional is confirmed"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Share this start code only after they reach your home. Never share it on call.
                      </p>
                    </div>
                    <p className="font-mono text-3xl font-bold tracking-[0.3em] text-orange-600" aria-label={`Start code ${booking.start_otp.split("").join(" ")}`}>
                      {booking.start_otp}
                    </p>
                  </div>
                )}
                {booking.status === "on_the_way" && (
                  <div className="mt-4">
                    <LiveTracking bookingId={booking.id} />
                  </div>
                )}
              </div>
            {/* Details */}
            <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">

              {/* Date */}
              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <CalendarDays size={18} />
                </div>

                <div>

                  <p className="text-xs text-gray-400">
                    Booking Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(
                      booking.booking_date
                    )}
                  </p>

                </div>

              </div>

              {/* Time */}
              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Clock3 size={18} />
                </div>

                <div>

                  <p className="text-xs text-gray-400">
                    Booking Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {booking.booking_time ||
                      "Not available"}
                  </p>

                </div>

              </div>

              {/* Address */}
              <div className="flex items-start gap-3 sm:col-span-2">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <MapPin size={18} />
                </div>

                <div>

                  <p className="text-xs text-gray-400">
                    Service Address
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {booking.address ||
                      "Address not available"}
                  </p>

                </div>

              </div>

            </div>

            {/* Price */}
            {(booking.provider_name || booking.agent_name) && (
              <div className="mt-5 grid gap-2 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
                {booking.provider_name && (
                  <p className="text-gray-500">
                    Provider: <span className="font-semibold text-gray-900">{booking.provider_name}</span>
                  </p>
                )}
                {booking.agent_name && (
                  <p className="text-gray-500">
                    Professional: <span className="font-semibold text-gray-900">{booking.agent_name}</span>
                    {booking.agent_phone && <span className="text-gray-500"> · {booking.agent_phone}</span>}
                  </p>
                )}
              </div>
            )}

            {(booking.price != null ||
              booking.amount != null) && (
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">

                <span className="text-sm text-gray-500">
                  Amount
                </span>

                <span className="text-lg font-bold text-gray-950">
                  ₹
                  {booking.price ??
                    booking.amount}
                </span>

              </div>
            )}

            {/* Payment */}
            {(booking.price != null || booking.payment_status) && booking.status !== "cancelled" || booking.payment_status === "refunded" || booking.payment_status === "refund_pending" ? (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Payment</span>
                  <PaymentBadge status={booking.payment_status} method={booking.payment_method} />
                </div>
                <PaymentActions
                  bookingId={booking.id}
                  bookingStatus={booking.status}
                  amount={booking.price ?? null}
                  paymentStatus={booking.payment_status}
                  paymentMethod={booking.payment_method}
                  onChange={() => fetchBookings(true)}
                />
              </div>
            ) : null}

         {/* Actions */}
{canManageBooking(booking.status) && (
  <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

    {/* Reschedule */}
    <button
      type="button"
      onClick={() => openReschedule(booking.id)}
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      <RefreshCw size={17} />
      Reschedule
    </button>

    {/* Cancel */}
    <button
      type="button"
      onClick={() => handleCancelBooking(booking.id)}
      disabled={cancellingId === booking.id}
      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {cancellingId === booking.id ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          Cancelling...
        </>
      ) : (
        <>
          <XCircle size={17} />
          Cancel Booking
        </>
      )}
    </button>
  </div>
)}

{/* 7-day service guarantee */}
{(booking.status === "completed" || booking.rework_of) && (
  <GuaranteeBox
    bookingId={booking.id}
    canClaim={booking.can_claim}
    claimStatus={booking.claim_status}
    claimNote={booking.claim_note}
    isRework={!!booking.rework_of}
    onChange={() => fetchBookings(true)}
  />
)}

{/* Rating & Review */}
{booking.status?.toLowerCase() === "completed" && (
  <div className="mt-6 border-t border-gray-100 pt-5">

    {booking.has_review || reviewedIds.includes(booking.id) ? (
      <p className="text-sm font-semibold text-green-700">
        ✓ Review submitted. Thank you!
      </p>
    ) : (
      <>
        <h3 className="mb-3 text-lg font-bold text-gray-900">
          Rate your experience
        </h3>

        {/* Star Rating */}
        <div className="mb-4 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
            >
              <Star
                size={28}
                className={
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        {/* Review Text */}
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience (optional)..."
          rows={3}
        className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {/* Submit Review */}
      <button
        type="button"
        onClick={() => handleSubmitReview(booking.id)}
        disabled={rating === 0 || submittingReview}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submittingReview ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
    </button>
      </>
    )}
  </div>
)}

          </div>
        ))}

      </div>
    )}

</section>

{/* ========================= */}
{/* RESCHEDULE MODAL */}
{/* ========================= */}

{reschedulingId !== null && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">

    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

      {/* Modal Header */}
      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-bold tracking-[0.16em] text-blue-600">
            URBINO
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-950">
            Reschedule Booking
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Select a new date and time for your service.
          </p>

        </div>

        <button
          type="button"
          onClick={closeReschedule}
          className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

      </div>

      {/* Date */}
      <div className="mt-7">

        <label
          htmlFor="reschedule-date"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          New Booking Date
        </label>

        <input
          id="reschedule-date"
          type="date"
          value={rescheduleDate}
          onChange={(e) =>
            setRescheduleDate(
              e.target.value
            )
          }
          min={
            new Date()
              .toISOString()
              .split("T")[0]
          }
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500"
        />

      </div>

      {/* Time */}
      <div className="mt-5">

        <label
          htmlFor="reschedule-time"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          New Booking Time
        </label>

        <input
          id="reschedule-time"
          type="time"
          value={rescheduleTime}
          onChange={(e) =>
            setRescheduleTime(
              e.target.value
            )
          }
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500"
        />

      </div>

      {/* Buttons */}
      <div className="mt-7 flex gap-3">

        <button
          type="button"
          onClick={closeReschedule}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleRescheduleBooking}
          disabled={
            !rescheduleDate ||
            !rescheduleTime
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Confirm
        </button>

      </div>

    </div>

  </div>
)}

</main>
);
}