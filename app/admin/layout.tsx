"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LOGIN_PATH, signOut } from "@/lib/admin/api";
import { KEYFRAMES } from "@/components/admin/ui";
import UrbinoLogo from "@/components/brand/UrbinoLogo";

/* Admin ka ek hi shell: dark sidebar + (dashboard ke alawa) simple top bar. */

const SIDEBAR_KEY = "urbino:sidebarCollapsed";
const OPEN_MENU_EVENT = "urbino:admin-open-menu";

const PATHS: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  calendar: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 3v4M8 3v4M3 11h18",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11ZM9 12l2 2 4-4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
  layers: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5",
  rupee: "M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5l7 6",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  logout: "M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.grid} />
    </svg>
  );
}

type NavItem = { label: string; icon: string; href?: string };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Operations",
    items: [
      { label: "Overview", icon: "grid", href: "/admin/dashboard" },
      { label: "Bookings", icon: "calendar", href: "/admin/bookings" },
      { label: "Users", icon: "users", href: "/admin/users" },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Agents", icon: "file", href: "/admin/agents" },
      { label: "Provider verification", icon: "shield" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", icon: "rupee", href: "/admin/payments" },
      { label: "Reports", icon: "pulse" },
    ],
  },
  { title: "Catalog", items: [{ label: "Services", icon: "layers" }] },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function Sidebar({
  pathname,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const hide = collapsed ? "lg:hidden" : "";
  return (
    <div className="flex h-full flex-col bg-[#1a110b]">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
      >
        <UrbinoLogo className="h-9 w-9 shrink-0 drop-shadow-[0_4px_12px_rgba(238,116,48,0.35)]" />
        <span className={`leading-tight ${hide}`}>
          <span className="block text-sm font-semibold text-white">Urbino Help</span>
          <span className="block text-xs text-stone-500">Admin console</span>
        </span>
      </Link>

      <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={`mb-2 px-3 text-xs font-medium text-stone-500 ${hide}`}>{group.title}</p>
            {collapsed && <div className="mx-3 mb-2 hidden border-t border-white/10 lg:block" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = !!item.href && pathname.startsWith(item.href);
                const base = `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${collapsed ? "lg:justify-center lg:px-0" : ""}`;
                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <div aria-disabled="true" title={`${item.label}: coming soon`} className={`${base} cursor-not-allowed text-stone-600`}>
                        <Icon name={item.icon} />
                        <span className={hide}>{item.label}</span>
                        <span className={`ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 ${hide}`}>
                          Soon
                        </span>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      aria-current={active ? "page" : undefined}
                      className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8692A] ${
                        active ? "bg-white/10 font-medium text-white" : "text-stone-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#E8692A]" />}
                      <span className={active ? "text-orange-300" : ""}>
                        <Icon name={item.icon} />
                      </span>
                      <span className={hide}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mb-2 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 transition hover:bg-white/5 hover:text-white lg:flex ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Icon name={collapsed ? "right" : "left"} size={16} />
            <span className={hide}>Collapse</span>
          </button>
        )}
        <div className={`flex items-center gap-3 px-1 py-1 ${collapsed ? "lg:justify-center" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">A</span>
          <div className={`min-w-0 flex-1 leading-tight ${hide}`}>
            <p className="truncate text-sm font-medium text-white">Administrator</p>
            <p className="text-xs text-stone-500">Platform admin</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className={`rounded-md p-2 text-stone-400 hover:bg-white/10 hover:text-white ${hide}`}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* storage blocked */
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  // Dashboard ka apna top bar hai; uska menu button yeh event bhejta hai
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener(OPEN_MENU_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_MENU_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });
  }, []);

  // Login page par shell nahi dikhana
  if (pathname === LOGIN_PATH) return <>{children}</>;

  const isDashboard = pathname.startsWith("/admin/dashboard");
  const current = ALL_ITEMS.find((n) => n.href && pathname.startsWith(n.href));

  return (
    <div className="min-h-screen bg-[#faf8f6] text-slate-900">
      <style>{KEYFRAMES}</style>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 motion-reduce:transition-none lg:block ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <Sidebar pathname={pathname} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-950/50" style={{ animation: "fadeIn .15s ease-out" }} onMouseDown={() => setOpen(false)} />
          <aside className="relative h-full w-64 shadow-2xl" style={{ animation: "slideIn .2s ease-out" }}>
            <Sidebar pathname={pathname} collapsed={false} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 motion-reduce:transition-none ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        {!isDashboard && (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Icon name="menu" size={20} />
              </button>
              {/* Desktop par page ka apna breadcrumb hai; yahan sirf mobile ke liye title */}
              <span className="text-sm font-medium text-slate-900 lg:hidden">{current?.label ?? "Admin"}</span>
              <span className="hidden text-sm text-slate-500 lg:inline">Urbino Help · Admin console</span>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">AD</span>
          </header>
        )}

        <main>{children}</main>
      </div>
    </div>
  );
}
