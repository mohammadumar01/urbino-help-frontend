"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

import api, { apiError } from "../../lib/api";
import UrbinoLogo from "../../components/brand/UrbinoLogo";
import { ROLE_HOME, saveSession, type Role } from "../../lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        setError("Login failed. Please try again.");
        return;
      }

      saveSession(token, user);

      // Admin ne temporary password diya tha: pehle naya password set karwao
      if (user.must_change_password) {
        if (user.role === "admin") {
          try {
            sessionStorage.setItem("adminToken", token);
          } catch {
            /* ignore */
          }
        }
        router.push("/account?setPassword=1");
        return;
      }

      // Admin bhi isi page se login kar sake: admin panel ka session bhi set karo
      if (user.role === "admin") {
        try {
          sessionStorage.setItem("adminToken", token);
        } catch {
          /* private mode: admin login page use karein */
        }
        router.push("/admin/dashboard");
        return;
      }

      // ?next=/booking?... wapas wahi le jao jahan se aaye the (sirf apni site ke andar)
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const role = (user.role === "user" ? "customer" : user.role) as Role;
      // next sirf tab jab woh page isi role ka ho (provider -> /provider/..., agent -> /agent/...)
      const area = safeNext?.split(/[/?#]/)[1] ?? "";
      const allowed =
        role === "customer" ? !["admin", "provider", "agent"].includes(area) : (role === "provider" || role === "agent") && area === role;
      router.push(safeNext && allowed ? safeNext : ROLE_HOME[role] || "/services");

    } catch (error) {
      setError(apiError(error, "Invalid email or password."));

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">

          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

        </div>
      </div>

      {/* Login */}
      <section className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="text-center">

            <Link href="/" className="mx-auto flex w-fit flex-col items-center gap-2" aria-label="Urbino Help home">
              <UrbinoLogo className="h-14 w-14 drop-shadow-[0_6px_16px_rgba(238,116,48,0.30)]" />
              <span className="text-lg font-bold tracking-tight text-gray-950">
                Urbino<span className="text-orange-500"> Help</span>
              </span>
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Login to continue to your Urbino account.
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="mt-8"
          >

            {/* Email */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
              />

            </div>

            {/* Password */}
            <div className="mt-5">

              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Logging in...
                </>
              ) : (
                "Login"
              )}

            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-500">

            Don&apos;t have an account?{" "}

            <Link
              href="/register"
              className="font-semibold text-gray-950 hover:underline"
            >
              Create account
            </Link>

          </p>

        </div>

      </section>

    </main>
  );
}