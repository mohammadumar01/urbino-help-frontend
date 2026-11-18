"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Headphones, KeyRound, Loader2, MailCheck } from "lucide-react";
import UrbinoLogo from "@/components/brand/UrbinoLogo";
import api, { apiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

const input =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500";
const primary =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60";

type Channel = "email" | "call";

/**
 * Password reset.
 *  - Email (SMTP) chalu: email -> 6-digit code -> naya password
 *  - Warna: email + mobile -> support team call karke reset karti hai
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [step, setStep] = useState<"request" | "code" | "done">("request");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    api
      .get<{ channel: Channel }>("/api/account/reset-options")
      .then((r) => setChannel(r.data.channel))
      .catch(() => setChannel("call"));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function request(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string; channel: Channel }>("/api/account/forgot-password", { email, phone });
      setInfo(r.data.message);
      if (r.data.channel === "email") {
        setStep("code");
        setCooldown(60);
      } else setStep("done");
    } catch (err) {
      setError(t(apiError(err, "Something went wrong. Please try again.")));
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/api/account/reset-password", { email, code, new_password: password });
      router.push("/login?reset=1");
    } catch (err) {
      setError(t(apiError(err, "Could not reset your password.")));
      setBusy(false);
    }
  }

  const weak = password.length > 0 && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password));

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
          {step === "done" ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <MailCheck size={24} />
              </span>
              <h1 className="mt-4 text-xl font-bold text-gray-950">{t("Request received")}</h1>
              <p className="mt-2 text-sm text-gray-600">{t(info)}</p>
              <Link href="/login" className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
                {t("Back to login")}
              </Link>
            </div>
          ) : step === "code" ? (
            <>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-950">
                <KeyRound size={22} /> {t("Enter the code")}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">{t(info)}</p>
              <form onSubmit={reset} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-gray-800">
                  {t("6-digit code")}
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    className={`mt-1.5 ${input} text-center font-mono text-xl tracking-[0.4em]`}
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-800">
                  {t("New password")}
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className={`mt-1.5 ${input}`} />
                  <span className={`mt-1 block text-xs font-normal ${weak ? "text-rose-600" : "text-gray-500"}`}>{t("8+ characters with a letter and a number")}</span>
                </label>
                {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                <button type="submit" disabled={busy || code.length !== 6 || weak || !password} className={primary}>
                  {busy && <Loader2 size={16} className="animate-spin" />} {t("Reset password")}
                </button>
              </form>
              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={() => void request()}
                className="mt-4 w-full text-center text-sm font-semibold text-blue-600 disabled:text-gray-400"
              >
                {cooldown > 0 ? t("Send a new code in {s}s", { s: cooldown }) : t("Send a new code")}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-950">{t("Forgot your password?")}</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                {channel === "email"
                  ? t("Enter your account email. We'll send you a 6-digit code to set a new password.")
                  : t("Enter your email and the mobile number on your account. Our team will call that number to verify you and reset your password.")}
              </p>
              <form onSubmit={request} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-gray-800">
                  {t("Email")}
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={`mt-1.5 ${input}`} />
                </label>
                {channel === "call" && (
                  <label className="block text-sm font-semibold text-gray-800">
                    {t("Mobile number")}
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" required className={`mt-1.5 ${input}`} />
                  </label>
                )}
                {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                <button type="submit" disabled={busy || !channel} className={primary}>
                  {busy && <Loader2 size={16} className="animate-spin" />} {channel === "email" ? t("Send code") : t("Request password reset")}
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
