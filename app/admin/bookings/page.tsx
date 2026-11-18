"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5500";

const STATUSES = [
  "pending",
  "agent_assigned",
  "provider_accepted",
  "completed",
  "cancelled",
] as const;

type Booking = {
  id: number | string;
  booking_id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  service_name?: string;
  address?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  amount?: number | string;
};

function statusStyle(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "provider_accepted":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "agent_assigned":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

function formatStatus(status?: string) {
  return (status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBookingId(booking: Booking) {
  return booking.id ?? booking.booking_id;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState<number | null>(null);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | number | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Admin token nahi mila. Dashboard se login karo.");
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (status !== "all") params.set("status", status);

      const response = await fetch(`${API}/api/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      const list = Array.isArray(data.bookings)
        ? data.bookings
        : Array.isArray(data.data)
          ? data.data
          : [];

      setBookings(list);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));

      const count = data.totalBookings ?? data.total;
      setTotalBookings(
        count !== undefined && Number.isFinite(Number(count))
          ? Number(count)
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bookings load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function updateStatus(id: string | number, nextStatus: string) {
    const current = bookings.find(
      (booking) => String(getBookingId(booking)) === String(id)
    );

    if (!current || current.status === nextStatus) return;

    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      setError("Admin token nahi mila. Dobara login karo.");
      return;
    }

    setSaving(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/bookings/${id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Status update failed: ${response.status}`
        );
      }

      setMessage(data.message || "Booking status updated successfully.");
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status update nahi ho saka."
      );
    } finally {
      setSaving(null);
    }
  }

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((booking) =>
      [
        String(getBookingId(booking) ?? ""),
        booking.name ?? "",
        booking.email ?? "",
        booking.phone ?? "",
        booking.service_name ?? "",
        booking.address ?? "",
        booking.status ?? "",
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [bookings, search]);

  const pageStats = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === "pending").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings]
  );

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Operations / Bookings
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Booking management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Monitor service bookings and manage their current status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            ✓ {message}
          </div>
        )}

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total bookings"
            value={totalBookings ?? "—"}
            note="Total reported by API"
            icon="▤"
          />
          <SummaryCard
            label="Pending on this page"
            value={pageStats.pending}
            note="Awaiting next action"
            icon="◷"
          />
          <SummaryCard
            label="Completed on this page"
            value={pageStats.completed}
            note="Marked as completed"
            icon="✓"
          />
          <SummaryCard
            label="Cancelled on this page"
            value={pageStats.cancelled}
            note="Cancelled bookings"
            icon="×"
          />
        </section>

        {/* Main table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <div>
              <h2 className="text-lg font-bold">All bookings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter and review customer bookings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bookings..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-64"
                />
              </div>

              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                  setMessage("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                aria-label="Filter bookings by status"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-7">
              <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
              <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
              <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
              <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Booking</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Service</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Update status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking, index) => {
                    const id = getBookingId(booking);
                    const customerInitial = (booking.name || "C")
                      .trim()
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <tr
                        key={id ?? index}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            #{id ?? "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                              {customerInitial}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {booking.name || "Unknown customer"}
                              </p>
                              {booking.email && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {booking.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">
                            {booking.service_name || "Service"}
                          </p>
                          {booking.address && (
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {booking.address}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {formatDate(booking.created_at || booking.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800">
                          {booking.amount != null
                            ? `₹${Number(booking.amount).toLocaleString("en-IN")}`
                            : "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(booking.status)}`}
                          >
                            {formatStatus(booking.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {id != null ? (
                            <select
                              aria-label={`Update status for booking ${id}`}
                              className="max-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 disabled:cursor-wait disabled:opacity-50"
                              value={
                                STATUSES.includes(
                                  booking.status as (typeof STATUSES)[number]
                                )
                                  ? booking.status!
                                  : ""
                              }
                              disabled={saving === id || !booking.status || !STATUSES.includes(booking.status as (typeof STATUSES)[number])}
                              onChange={(e) => {
                                if (e.target.value) {
                                  void updateStatus(id, e.target.value);
                                }
                              }}
                            >
                              <option value="" disabled>
                                Unknown status
                              </option>
                              {STATUSES.map((item) => (
                                <option key={item} value={item}>
                                  {formatStatus(item)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No booking ID
                            </span>
                          )}
                          {saving === id && (
                            <p className="mt-1 text-xs text-blue-600">
                              Saving...
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <p className="font-semibold text-slate-700">
                          No bookings found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or status filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-sm text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings on this page
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <span className="whitespace-nowrap text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-blue-700">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
