"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X, CalendarCheck } from "lucide-react";
import { clearSession, ROLE_HOME, useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";
import NotificationBell from "./NotificationBell";

const links = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/provider", label: "Become a Provider" },
];

export default function Navbar() {
  const user = useAuth();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);

  function logout() {
    clearSession();
    setOpen(false);
    router.push("/");
  }

  const dashboard =
    user && user.role !== "customer"
      ? { href: ROLE_HOME[user.role], label: "Dashboard", icon: LayoutDashboard }
      : user
        ? { href: "/bookings", label: "My Bookings", icon: CalendarCheck }
        : null;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/urbino-logo.png" alt="Urbino logo" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Urbino
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />
          <NotificationBell />
          {/* user === undefined: abhi pata nahi, kuch mat dikhao (flash na ho) */}
          {user === null && (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 md:block"
              >
                {t("Log in")}
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 md:block"
              >
                {t("Get Started")}
              </Link>
            </>
          )}

          {user && dashboard && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={dashboard.href}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <dashboard.icon size={17} /> {t(dashboard.label)}
              </Link>
              <Link
                href="/account"
                aria-label={t("Your account")}
                title={user.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label={t("Log out")}
                className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label={t(open ? "Close menu" : "Open menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          <LanguageToggle className="mb-3 sm:hidden" />
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t(l.label)}
              </Link>
            ))}
            {user && dashboard && (
              <Link
                href={dashboard.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                {t(dashboard.label)}
              </Link>
            )}
            {user && (
              <Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                {t("Your account")}
              </Link>
            )}
          </nav>
          <div className="mt-3 border-t border-gray-100 pt-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {t("Log out")} ({user.name})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold">
                  {t("Log in")}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white">
                  {t("Get Started")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
