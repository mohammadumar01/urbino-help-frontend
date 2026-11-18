"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, Loader2, MailCheck } from "lucide-react";
import UrbinoLogo from "@/components/brand/UrbinoLogo";
import api, { apiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

const input =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500";

/**
 * Password reset: email + registered mobile. Support team call karke verify karti hai
 * aur temporary password deti hai (email/SMS service lagne par yahan OTP aa jayega).
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string }>("/api/account/forgot-password", { email, phone });
      setDone(r.data.message);
    } catch (err) {
      setError(t(apiError(err, "Something went wrong. Please try again.")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
          <UrbinoLogo className="h-10 w-10" />
          <span className="text-xl font-bold text-gray-950">
            Urbino<span className="text-orange-500"> Help</span>
          </span>
        </Link>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          {done ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <MailCheck size={24} />
              </span>
              <h1 className="mt-4 text-xl font-bold text-gray-950">{t("Request received")}</h1>
              <p className="mt-2 text-sm text-gray-600">{t(done)}</p>
              <Link href="/login" className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
                {t("Back to login")}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-950">{t("Forgot your password?")}</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                {t("Enter your email and the mobile number on your account. Our team will call that number to verify you and reset your password.")}
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-gray-800">
                  {t("Email")}
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={`mt-1.5 ${input}`} />
                </label>
                <label className="block text-sm font-semibold text-gray-800">
                  {t("Mobile number")}
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" required className={`mt-1.5 ${input}`} />
                </label>
                {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                  {busy && <Loader2 size={16} className="animate-spin" />} {t("Request password reset")}
                </button>
              </form>
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                <Headphones size={15} className="shrink-0" /> {t("Urbino Help will never ask for your password or OTP on a call.")}
              </p>
            </>
          )}
        </div>
        <Link href="/login" className="mx-auto mt-5 flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft size={15} /> {t("Back to login")}
        </Link>
      </div>
    </main>
  );
}
