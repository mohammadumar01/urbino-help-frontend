"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import api from "../../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const formData = new FormData(e.currentTarget);

      const name = String(
        formData.get("name") || ""
      ).trim();

      const email = String(
        formData.get("email") || ""
      ).trim();

      const phone = String(
        formData.get("phone") || ""
      ).trim();

      const password = String(
        formData.get("password") || ""
      );

      // Validation
      if (!name || !email || !phone || !password) {
        setError("All fields are required.");
        return;
      }

      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters long."
        );
        return;
      }

      // Register API
      const response = await api.post(
        "/api/auth/register",
        {
          name,
          email,
          phone,
          password,
        }
      );

      console.log(
        "Register response:",
        response.data
      );

      setSuccess(true);

    } catch (error: any) {
      console.error(
        "Registration failed:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Unable to create account."
      );

    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <span className="text-2xl">✓</span>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-950">
            Account Created
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Your Urbino account has been created
            successfully.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Go to Login
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-4xl px-6 py-4">

          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

        </div>

      </div>

      {/* Register Section */}
      <section className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">

          {/* Heading */}
          <div className="text-center">

            <p className="text-sm font-bold tracking-[0.2em] text-blue-600">
              URBINO
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Join Urbino and book trusted services
              easily.
            </p>

          </div>

          {/* Form */}
          <form
            onSubmit={handleRegister}
            className="mt-8"
          >

            {/* Name */}
            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />

            </div>

            {/* Email */}
            <div className="mt-5">

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />

            </div>

            {/* Phone */}
            <div className="mt-5">

              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter your phone number"
                autoComplete="tel"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />

            </div>

            {/* Password */}
            <div className="mt-5">

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />

              <p className="mt-2 text-xs text-gray-400">
                Password must be at least 8 characters.
              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
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

                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}

            </button>

          </form>

          {/* Login */}
          <p className="mt-7 text-center text-sm text-gray-500">

            Already have an account?{" "}

            <Link
              href="/login"
              className="font-semibold text-gray-950 hover:underline"
            >
              Login
            </Link>

          </p>

        </div>

      </section>

    </main>
  );
}