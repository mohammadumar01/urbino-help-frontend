"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Languages, Loader2, LogOut, ShieldAlert, UserRound } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LanguageToggle from "@/components/layout/LanguageToggle";
import RequireRole from "@/components/auth/RequireRole";
import api, { apiError } from "@/lib/api";
import { clearSession, getToken, ROLE_HOME, saveSession, useAuth, type SessionUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";

const input =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-4 focus:ring-gray-100";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <RequireRole roles={["customer", "provider", "agent", "admin"]}>
        <Navbar />
        <Account />
      </RequireRole>
    </Suspense>
  );
}

function Account() {
  const t = useT();
  const user = useAuth();
  const router = useRouter();
  const forced = useSearchParams().get("setPassword") === "1" || !!user?.must_change_password;
  const home = user ? ROLE_HOME[user.role] : "/";

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href={home} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft size={15} /> {user?.role === "customer" ? t("Back to services") : t("Back to dashboard")}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{t("Your account")}</h1>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>

        {forced && (
          <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            {t("You signed in with a temporary password. Please set your own password now.")}
          </p>
        )}

        <div className="mt-6 space-y-5">
          {forced ? (
            <PasswordCard forced onDone={() => router.push(home)} />
          ) : (
            <>
              <ProfileCard />
              <PasswordCard />
            </>
          )}

          <section className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <Languages size={20} className="text-gray-500" />
              <div>
                <p className="font-semibold text-gray-950">{t("Language")}</p>
                <p className="text-xs text-gray-500">English / हिन्दी</p>
              </div>
            </div>
            <LanguageToggle />
          </section>

          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={16} /> {t("Log out")}
          </button>
        </div>
      </div>
    </main>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
        <Icon size={19} className="text-gray-500" /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p role={ok ? "status" : "alert"} className={`rounded-xl px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {ok && <CheckCircle2 size={15} className="mr-1 inline" />}
      {text}
    </p>
  );
}

function ProfileCard() {
  const t = useT();
  const user = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api
      .get<{ user: SessionUser }>("/api/account/me")
      .then((r) => {
        setName(r.data.user.name);
        setPhone(r.data.user.phone || "");
      })
      .catch(() => {
        if (user) {
          setName(user.name);
          setPhone(user.phone || "");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.put<{ user: SessionUser }>("/api/account/profile", { name, phone });
      const token = getToken();
      if (token && user) saveSession(token, { ...user, ...r.data.user });
      setPhone(r.data.user.phone || "");
      setMsg({ ok: true, text: t("Profile saved.") });
    } catch (err) {
      setMsg({ ok: false, text: t(apiError(err, "Could not save your profile.")) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card icon={UserRound} title={t("Profile")}>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">
          {t("Full name")}
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`mt-1.5 ${input}`} required minLength={2} maxLength={80} />
        </label>
        <label className="text-sm font-semibold text-gray-800">
          {t("Mobile number")}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" className={`mt-1.5 ${input}`} required />
        </label>
        <div className="space-y-3 sm:col-span-2">
          {msg && <Msg {...msg} />}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
            {busy && <Loader2 size={15} className="animate-spin" />} {t("Save profile")}
          </button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard({ forced = false, onDone }: { forced?: boolean; onDone?: () => void }) {
  const t = useT();
  const user = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const weak = next.length > 0 && (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next));
  const mismatch = confirm.length > 0 && confirm !== next;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (weak || mismatch) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.put("/api/account/password", { current_password: current, new_password: next });
      const token = getToken();
      if (token && user) saveSession(token, { ...user, must_change_password: false });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({ ok: true, text: t("Password changed.") });
      if (onDone) setTimeout(onDone, 900);
    } catch (err) {
      setMsg({ ok: false, text: t(apiError(err, "Could not change your password.")) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card icon={KeyRound} title={forced ? t("Set a new password") : t("Change password")}>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800 sm:col-span-2">
          {forced ? t("Temporary password") : t("Current password")}
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={`mt-1.5 ${input}`} required />
        </label>
        <label className="text-sm font-semibold text-gray-800">
          {t("New password")}
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={`mt-1.5 ${input}`} required />
          <span className={`mt-1 block text-xs font-normal ${weak ? "text-rose-600" : "text-gray-500"}`}>{t("8+ characters with a letter and a number")}</span>
        </label>
        <label className="text-sm font-semibold text-gray-800">
          {t("Confirm new password")}
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={`mt-1.5 ${input}`} required />
          {mismatch && <span className="mt-1 block text-xs font-normal text-rose-600">{t("Passwords don't match")}</span>}
        </label>
        <div className="space-y-3 sm:col-span-2">
          {msg && <Msg {...msg} />}
          <button type="submit" disabled={busy || weak || mismatch || !current || !next} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {busy && <Loader2 size={15} className="animate-spin" />} {forced ? t("Set password and continue") : t("Change password")}
          </button>
        </div>
      </form>
    </Card>
  );
}
