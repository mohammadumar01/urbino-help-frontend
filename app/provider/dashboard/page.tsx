"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
  ClipboardList,
  Loader2,
  AlertCircle,
  LogOut,
  CheckCircle,
} from "lucide-react";

import api from "../../../lib/api";

interface Booking {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  service_name: string;
  address: string;
  booking_date: string;
  booking_time: string;
  status: string;
  agent_id?: number | null;
  agent_assigned_at?: string | null;
}

interface PendingBookingsResponse {
  success: boolean;
  currentPage: number;
  limit: number;
  totalPendingBookings: number;
  totalPages: number;
  bookings: Booking[];
}

interface Agent {
  id: number;
  provider_id: number;
  agent_id: number;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
  created_at: string;
}

export default function ProviderDashboard() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(true);
  const [myBookingsError, setMyBookingsError] = useState("");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState("");

  // Track which booking is being accepted
  const [processingId, setProcessingId] = useState<number | null>(
    null
  );

  // Success message
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedAgent, setSelectedAgent] = useState<
  Record<number, number | "">
  >({});

   
  // Fetch pending bookings
  async function fetchPendingBookings() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<PendingBookingsResponse>(
         "/api/provider-bookings/pending"
        );

      setBookings(response.data.bookings || []);

      setTotalBookings(
        response.data.totalPendingBookings || 0
      );
    } catch (err: any) {
      console.error("Pending bookings error:", err);

      if (err?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else if (err?.response?.status === 403) {
        setError(
          "Provider access only. Please login with a provider account."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Unable to fetch pending bookings."
        );
      }
    } finally {
      setLoading(false);
    }
  }

 // fatch my bookings
async function fetchMyBookings() {
  try {
    setMyBookingsLoading(true);
    setMyBookingsError("");

    const response = await api.get("/api/provider/my-bookings");

    setMyBookings(response.data.bookings || []);
  } catch (error: any) {
    console.error("Failed to fetch provider bookings:", error);

    setMyBookingsError(
      error?.response?.data?.message ||
        "Unable to load your bookings."
    );
  } finally {
    setMyBookingsLoading(false);
  }
}

// fatch agents

async function fetchAgents() {
  try {
    setAgentsLoading(true);
    setAgentsError("");

    const response = await api.get("/api/provider-agents");

    setAgents(response.data.agents || []);
  } catch (error: any) {
    console.error("Failed to fetch provider agents:", error);

    setAgentsError(
      error?.response?.data?.message ||
        "Unable to load your agents."
    );
  } finally {
    setAgentsLoading(false);
  }
}
  // Initial load
  useEffect(() => {
  fetchPendingBookings();
  fetchMyBookings();
  fetchAgents();
}, []);

  // Accept booking
  async function handleAcceptBooking(bookingId: number) {
    try {
      setProcessingId(bookingId);
      setSuccessMessage("");
      setError("");

      const response = await api.put(
        `/api/provider-bookings/accept/${bookingId}`
      );

      setSuccessMessage(
        response.data.message ||
          `Booking #${bookingId} accepted successfully!`
      );

      // Remove accepted booking from pending list
      setBookings((previousBookings) =>
        previousBookings.filter(
          (booking) => booking.id !== bookingId
        )
      );

      setTotalBookings((previousTotal) =>
        Math.max(0, previousTotal - 1)
      );

      // Refresh from backend to get latest data
      await fetchPendingBookings();
      await fetchMyBookings();

    } catch (err: any) {
      console.error("Accept booking error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to accept booking. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }


  
  // Assign agent to a booking
  async function handleAssignAgent(bookingId: number) {
    const agentId = selectedAgent[bookingId];

    if (!agentId) {
      setError("Please select an agent first.");
      return;
    }

    try {
      setProcessingId(bookingId);
      setSuccessMessage("");
      setError("");

      const response = await api.put(
        `/api/provider/assign-agent/${bookingId}`,
        { agent_id: Number(agentId) }
      );

      setSuccessMessage(
        response.data.message ||
          `Agent assigned to booking #${bookingId} successfully!`
      );

      setSelectedAgent((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      await Promise.all([
        fetchPendingBookings(),
        fetchMyBookings(),
        fetchAgents(),
      ]);
    } catch (error: any) {
      console.error("Assign agent error:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to assign agent. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }


  // Logout
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  }

  // Format date
  function formatDate(date: string) {
    const dateOnly = date.split("T")[0];

    const [year, month, day] =
      dateOnly.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Format time
  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-lg font-extrabold tracking-[0.18em] text-blue-600">
              URBINO
            </p>

            <p className="text-xs text-gray-500">
              Provider Panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                                fetchPendingBookings();
                                fetchMyBookings();
                                fetchAgents();
                              }}
              disabled={loading || processingId !== null}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-600">
              PROVIDER WORKSPACE
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Provider Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your service bookings and
              customer requests.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Provider Portal
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Success!
              </p>

              <p className="mt-1 text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

  {/* Stats */}
  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          Pending Bookings
        </p>

        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
          <ClipboardList size={22} />
        </div>
      </div>

      <p className="mt-4 text-4xl font-bold text-gray-950">
        {loading ? "..." : totalBookings}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Customer requests awaiting action
      </p>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          Requests Received
        </p>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <CalendarDays size={22} />
        </div>
      </div>

      <p className="mt-4 text-4xl font-bold text-gray-950">
        {loading ? "..." : bookings.length}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Requests on this page
      </p>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          Account Role
        </p>

        <div className="rounded-xl bg-green-50 p-3 text-green-600">
          <ClipboardList size={22} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold capitalize text-gray-950">
        Provider
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Manage bookings and assign agents
      </p>
    </div>
  </div>

  {/* Booking List */}
  <div className="mt-12">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-950">
          Pending Bookings
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review customer service requests.
        </p>
      </div>

      <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
        {totalBookings} Pending
      </span>
    </div>

    {/* Loading */}
    {loading && (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20">
        <Loader2
          size={35}
          className="animate-spin text-blue-600"
        />

        <p className="mt-4 text-sm text-gray-500">
          Loading your bookings...
        </p>
      </div>
    )}

    {/* Empty State */}
    {!loading &&
      !error &&
      bookings.length === 0 && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <ClipboardList size={30} />
          </div>

          <h3 className="mt-5 text-xl font-bold text-gray-950">
            No Pending Bookings
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            New customer service requests
            will appear here when they are
            assigned to your provider account.
          </p>
        </div>
      )}

    {/* Booking Cards */}
    {!loading &&
      !error &&
      bookings.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7"
  >
    {/* Card Header */}
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-wider text-gray-400">
          BOOKING #{booking.id}
        </p>

        <h3 className="mt-2 text-xl font-bold text-gray-950">
          {booking.service_name}
        </h3>
      </div>

      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold capitalize text-amber-700">
        {booking.status}
      </span>
    </div>

    {/* Booking Details */}
    <div className="mt-6 space-y-5 border-y border-gray-100 py-6">
      {/* Date */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
          <CalendarDays size={19} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Booking Date
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {formatDate(
              booking.booking_date
            )}
          </p>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
          <Clock size={19} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Booking Time
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {formatTime(
              booking.booking_time
            )}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
          <MapPin size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-gray-500">
            Service Address
          </p>

          <p className="mt-1 break-words font-semibold text-gray-900">
            {booking.address}
          </p>
        </div>
      </div>
    </div>

    {/* Customer & Accept Button */}
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <p className="text-xs text-gray-400">
        Customer ID: {booking.customer_id}
      </p>

      <button
        onClick={() =>
          handleAcceptBooking(booking.id)
        }
        disabled={processingId !== null}
        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processingId === booking.id ? (
          <>
            <Loader2
              size={17}
              className="animate-spin"
            />
            Accepting...
          </>
        ) : (
          <>
            <CheckCircle size={17} />
            Accept Booking
          </>
        )}
      </button>
    </div>
  </div>
))}
</div>
)}
</div>

{/* My Bookings */}
<div className="mt-12">
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h2 className="text-2xl font-bold text-gray-950">
        My Bookings
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        View accepted bookings and assign your agents.
      </p>
    </div>

    <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
      {myBookings.length} Bookings
    </span>
  </div>

  {myBookingsLoading && (
    <div className="mt-6 rounded-2xl border bg-white py-12 text-center">
      <Loader2 className="mx-auto animate-spin text-blue-600" size={30} />
      <p className="mt-3 text-sm text-gray-500">
        Loading your bookings...
      </p>
    </div>
  )}

  {!myBookingsLoading && myBookingsError && (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      {myBookingsError}
    </div>
  )}

  {!myBookingsLoading &&
    !myBookingsError &&
    myBookings.length === 0 && (
      <div className="mt-6 rounded-2xl border bg-white px-6 py-12 text-center">
        <ClipboardList className="mx-auto text-gray-400" size={32} />
        <h3 className="mt-4 font-bold text-gray-900">
          No Accepted Bookings Yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Accepted bookings will appear here.
        </p>
      </div>
    )}

  {!myBookingsLoading && myBookings.length > 0 && (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {myBookings.map((booking) => (
        <div
          key={booking.id}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-400">
                BOOKING #{booking.id}
              </p>
              <h3 className="mt-2 text-xl font-bold text-gray-950">
                {booking.service_name}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Customer: {booking.customer_name || `#${booking.customer_id}`}
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
              {booking.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-5 space-y-3 border-y border-gray-100 py-5 text-sm text-gray-600">
            <p className="flex gap-2">
              <CalendarDays size={18} />
              {formatDate(booking.booking_date)}
            </p>
            <p className="flex gap-2">
              <Clock size={18} />
              {formatTime(booking.booking_time)}
            </p>
            <p className="flex gap-2 break-words">
              <MapPin size={18} />
              {booking.address}
            </p>
            {booking.customer_phone && (
              <p>Phone: {booking.customer_phone}</p>
            )}
          </div>

          {booking.status === "provider_accepted" &&
            !booking.agent_id && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select Agent
                </label>

                {agentsLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading agents...
                  </p>
                ) : agents.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    No agents linked to your account.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedAgent[booking.id] ?? ""}
                      onChange={(event) =>
                        setSelectedAgent((previous) => ({
                          ...previous,
                          [booking.id]: event.target.value
                            ? Number(event.target.value)
                            : "",
                        }))
                      }
                       className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900"
                    >
                      <option value="">Choose an agent</option>
                      {agents.map((agent) => (
                        <option
                          key={agent.agent_id}
                          value={agent.agent_id}
                        >
                          {agent.agent_name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssignAgent(booking.id)}
                      disabled={
                        processingId !== null ||
                        !selectedAgent[booking.id]
                      }
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processingId === booking.id
                        ? "Assigning..."
                        : "Assign Agent"}
                    </button>
                  </div>
                )}
              </div>
            )}

          {booking.agent_id && (
            <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">Agent Assigned</p>
              <p className="mt-1">
                {agents.find(
                  (agent) => agent.agent_id === booking.agent_id
                )?.agent_name || `Agent #${booking.agent_id}`}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>

</section>
</main>
);
}