"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

import api from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

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

      console.log("Login response:", response.data);

      const token = response.data.token;

      if (!token) {
        setError("Login successful but token was not received.");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", token);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      // Redirect user according to role
        const user = response.data.user;

        if (user.role === "provider") {
          router.push("/provider/dashboard");

        } else if (user.role === "admin") {
          router.push("/admin/dashboard");

        } else if (user.role === "agent") {
          router.push("/agent/dashboard");

        } else {
          router.push("/services");
        }

    } catch (error: any) {
      console.error("Login failed:", error);

      setError(
        error?.response?.data?.message ||
          "Invalid email or password."
      );

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

            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Urbino
            </p>

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

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Password
              </label>

              <input
                type="password"
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

            Don't have an account?{" "}

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