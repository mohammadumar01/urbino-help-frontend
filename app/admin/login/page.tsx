"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5500";
const REQUEST_TIMEOUT_MS = 15000;
const EMAIL_KEY = "urbino:adminEmail";

const FEATURES = [
  {
    title: "Verify service professionals",
    text: "Review applications and approve or pause accounts.",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    title: "Follow every request",
    text: "Track jobs from booking to completion and step in when needed.",
    icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 7 2 2 4-4",
  },
  {
    title: "Keep the platform healthy",
    text: "Manage customers, categories and platform settings.",
    icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Skip the form if a session already exists; prefill the remembered email.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("adminToken")) {
        router.replace("/admin/dashboard");
        return;
      }
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* storage unavailable (private mode etc.) */
    }
  }, [router]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.token) {
        setError(
          data.message ||
            "We couldn't sign you in. Check your email and password, then try again."
        );
        return;
      }

      if (data.user?.role !== "admin") {
        setError(
          "This account doesn't have administrator access. Sign in with an admin account."
        );
        return;
      }

      try {

        sessionStorage.setItem("adminToken", data.token);
        if (remember) localStorage.setItem(EMAIL_KEY, email.trim());
        else localStorage.removeItem(EMAIL_KEY);
      } catch {
        setError("Your browser blocked session storage. Disable private mode and try again.");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      setError(
        timedOut
          ? "The server took too long to respond. Please try again."
          : "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 disabled:bg-slate-50 disabled:text-slate-500 " +
    (error ? "border-red-300" : "border-slate-300");

  return (
    <main className="min-h-screen bg-white text-slate-900 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT: BRAND PANEL */}
      <section
        className="relative hidden overflow-hidden bg-slate-950 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 85% 0%, rgba(37,99,235,0.35) 0%, rgba(2,6,23,0) 70%), linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 44px 44px, 44px 44px",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold shadow-lg shadow-blue-900/40">
            U
          </div>
          <span className="text-lg font-semibold tracking-tight">Urbino Help</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
            Run every service request from one place.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            The administration workspace for Urbino Help, built for the team that
            keeps customers and professionals connected.
          </p>

          <ul className="mt-12 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-300 ring-1 ring-white/10">
                  <Icon d={f.icon} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Â© {new Date().getFullYear()} Urbino Help. All rights reserved.
        </p>
      </section>

      {/* RIGHT: SIGN IN */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
              U
            </div>
            <span className="text-lg font-semibold tracking-tight">Urbino Help</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use your administrator account to open the workspace.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              <Icon
                d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                aria-invalid={Boolean(error)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleKey}
                  onKeyDown={handleKey}
                  onBlur={() => setCapsLock(false)}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={capsLock ? "caps-hint" : undefined}
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {showPassword ? (
                    <Icon d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.3 8 2.7 10.2 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1" />
                  ) : (
                    <Icon d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  )}
                </button>
              </div>
              {capsLock && (
                <p id="caps-hint" className="mt-2 text-xs font-medium text-amber-700">
                  Caps Lock is on.
                </p>
              )}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
              />
              Remember my email on this device
            </label>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 active:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-600/50"
            >
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Signing in" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2.5 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
            <Icon
              d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"
              className="h-4 w-4 shrink-0 text-slate-400"
            />
            Access is limited to authorized administrators.
          </div>
        </div>
      </section>
    </main>
  );
}
