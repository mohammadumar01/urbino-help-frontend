
"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

type Job = {
  id: number;
  customer_id: number;
  customer_name: string;
  phone: string;
  service_name: string;
  address: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  agent_assigned: "Agent Assigned",
  agent_accepted: "Accepted",
  on_the_way: "On The Way",
  in_progress: "Work In Progress",
  completed: "Completed",
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[\s-]+/g, "_");
}

export default function AgentDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/agent/my-jobs", {
        params: {
          page,
          limit: 10,
          search,
          status,
          sortBy: "created_at",
          order: "DESC",
        },
      });

      const data = response.data;
      console.log("Agent Jobs API Response:", data);

      setJobs(data.jobs || []);
      setTotalJobs(Number(data.totalJobs || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Jobs fetch nahi ho paayi. Login aur backend check karo."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAction = async (
    jobId: number,
    action: "accept" | "on-the-way" | "start" | "complete"
  ) => {
    const confirmMessage: Record<string, string> = {
      accept: "Kya tum ye job accept karna chahte ho?",
      "on-the-way": "Kya tum customer ke location par ja rahe ho?",
      start: "Kya tum kaam start karna chahte ho?",
      complete: "Kya tumne customer ka kaam complete kar diya hai?",
    };

    if (!window.confirm(confirmMessage[action])) return;

    try {
      setActionLoading(jobId);
      setError("");
      setMessage("");

      const response = await api.put(
        `/api/agent/${action}/${jobId}`
      );

      setMessage(
        response.data.message || "Job status update ho gaya!"
      );

      await fetchJobs();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Action failed. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButton = (job: Job) => {
    const currentStatus = normalizeStatus(job.status);
    const isBusy = actionLoading === job.id;

    if (currentStatus === "agent_assigned") {
      return (
        <button
          onClick={() => handleAction(job.id, "accept")}
          disabled={isBusy}
          className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isBusy ? "Processing..." : "Accept Job"}
        </button>
      );
    }

    if (currentStatus === "agent_accepted") {
      return (
        <button
          onClick={() => handleAction(job.id, "on-the-way")}
          disabled={isBusy}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isBusy ? "Processing..." : "On The Way"}
        </button>
      );
    }

    if (currentStatus === "on_the_way") {
      return (
        <button
          onClick={() => handleAction(job.id, "start")}
          disabled={isBusy}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isBusy ? "Processing..." : "Start Work"}
        </button>
      );
    }

    if (currentStatus === "in_progress") {
      return (
        <button
          onClick={() => handleAction(job.id, "complete")}
          disabled={isBusy}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isBusy ? "Processing..." : "Complete Work"}
        </button>
      );
    }

    return (
      <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
        Job Completed
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    const value = normalizeStatus(status);

    if (value === "completed")
      return "bg-green-100 text-green-700";

    if (value === "in_progress")
      return "bg-blue-100 text-blue-700";

    if (value === "on_the_way")
      return "bg-indigo-100 text-indigo-700";

    return "bg-amber-100 text-amber-700";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-widest text-blue-600">
              URBINO
            </h1>
            <p className="text-sm text-slate-500">Agent Panel</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchJobs}
              className="rounded-xl border px-4 py-2 font-semibold hover:bg-slate-100"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="mb-2 font-bold tracking-widest text-blue-600">
          AGENT WORKSPACE
        </p>

        <h2 className="text-4xl font-extrabold">
          My Assigned Jobs
        </h2>

        <p className="mt-3 text-slate-500">
          Manage your assigned service requests and update job progress.
        </p>

        {/* Statistics */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Jobs</p>
            <h3 className="mt-3 text-4xl font-bold">{totalJobs}</h3>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Jobs On This Page</p>
            <h3 className="mt-3 text-4xl font-bold">{jobs.length}</h3>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Account Role</p>
            <h3 className="mt-3 text-3xl font-bold">Agent</h3>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Search and filter */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border bg-white p-5 md:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customer, service or address..."
            className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border px-4 py-3 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="agent_assigned">Agent Assigned</option>
            <option value="agent_accepted">Accepted</option>
            <option value="on_the_way">On The Way</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Jobs */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Assigned Jobs</h3>
            <p className="mt-1 text-slate-500">
              Review customer requests and take action.
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            {totalJobs} Jobs
          </span>
        </div>

        {loading ? (
          <div className="mt-10 rounded-2xl border bg-white p-10 text-center">
            Loading your jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-8 rounded-2xl border bg-white p-12 text-center">
            <h3 className="text-xl font-bold">No jobs found</h3>
            <p className="mt-2 text-slate-500">
              Abhi tumhare account par koi assigned job nahi hai.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">
                      BOOKING #{job.id}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {job.service_name}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {statusLabels[normalizeStatus(job.status)] ||
                      job.status}
                  </span>
                </div>

                <hr className="my-5" />

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Customer Name
                    </p>
                    <p className="mt-1 font-semibold">
                      {job.customer_name || `Customer #${job.customer_id}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Customer Phone
                    </p>
                    <p className="mt-1 font-semibold">
                      {job.phone || "Not available"}
                    </p>

                    {job.phone && (
                      <a
                        href={`tel:${job.phone}`}
                        className="mt-2 inline-block font-semibold text-blue-600 hover:underline"
                      >
                        Call Customer
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-slate-400">
                      Service Address
                    </p>
                    <p className="mt-1 font-semibold">
                      {job.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">
                        Booking Date
                      </p>
                      <p className="mt-1 font-semibold">
                        {new Date(job.booking_date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          }
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">
                        Booking Time
                      </p>
                      <p className="mt-1 font-semibold">
                        {String(job.booking_time).slice(0, 5)}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="my-5" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-slate-400">
                    Customer ID: {job.customer_id}
                  </p>

                  {getActionButton(job)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border bg-white px-5 py-3 font-semibold disabled:opacity-40"
          >
            Previous
          </button>

          <span className="font-semibold">
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border bg-white px-5 py-3 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
