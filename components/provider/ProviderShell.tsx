"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarClock, ClipboardList, FileCheck2, LogOut, UserRound, Wrench } from "lucide-react";
import RequireRole from "@/components/auth/RequireRole";
import UrbinoLogo from "@/components/brand/UrbinoLogo";
import { clearSession, useAuth } from "@/lib/auth";

const TABS = [
  { href: "/provider/dashboard", label: "Bookings", icon: ClipboardList },
  { href: "/provider/profile", label: "Profile", icon: UserRound },
  { href: "/provider/services", label: "Services", icon: Wrench },
  { href: "/provider/availability", label: "Working hours", icon: CalendarClock },
  { href: "/provider/documents", label: "Documents", icon: FileCheck2 },
];

function Shell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/provider/dashboard" className="flex items-center gap-2.5">
            <UrbinoLogo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-base font-bold text-gray-950">Urbino Help</span>
              <span className="block text-xs text-gray-500">Partner workspace</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
        <nav aria-label="Provider" className="mx-auto max-w-7xl overflow-x-auto px-3 sm:px-6">
          <ul className="flex min-w-max gap-1">
            {TABS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                      active ? "border-orange-500 text-gray-950" : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

/** Provider ke saare pages: login + role check + common header/tabs. */
export default function ProviderShell(props: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <RequireRole roles={["provider"]}>
      <Shell {...props} />
    </RequireRole>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "bg-rose-50 text-rose-700"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-blue-50 text-blue-700";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>
      {children}
    </p>
  );
}

export const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-4 focus:ring-gray-100";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60";
