"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, LogOut, UserRound } from "lucide-react";
import RequireRole from "@/components/auth/RequireRole";
import UrbinoLogo from "@/components/brand/UrbinoLogo";
import { clearSession, useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import LanguageToggle from "@/components/layout/LanguageToggle";
import NotificationBell from "@/components/layout/NotificationBell";

const TABS = [
  { href: "/agent/dashboard", label: "My jobs", icon: ClipboardList },
  { href: "/agent/profile", label: "Profile", icon: UserRound },
];

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();
  const t = useT();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/agent/dashboard" className="flex items-center gap-2.5">
            <UrbinoLogo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-base font-bold text-gray-950">Urbino Help</span>
              <span className="block text-xs text-gray-500">{t("Professional app")}</span>
            </span>
          </Link>
          <nav aria-label="Agent" className="hidden items-center gap-1 sm:flex">
            {TABS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                  pathname === href ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} /> {t(label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <NotificationBell />
            <Link href="/account" className="hidden max-w-[140px] truncate text-sm text-gray-600 hover:text-gray-950 md:inline" title={t("Your account")}>
              {user?.name}
            </Link>
            <button
              type="button"
              aria-label={t("Log out")}
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>

      {/* Phone par neeche tab bar (ek haath se use karna aasaan) */}
      <nav aria-label="Agent" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-gray-200 bg-white sm:hidden">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold ${pathname === href ? "text-orange-600" : "text-gray-500"}`}
          >
            <Icon size={20} /> {t(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function AgentShell({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["agent"]}>
      <Shell>{children}</Shell>
    </RequireRole>
  );
}
