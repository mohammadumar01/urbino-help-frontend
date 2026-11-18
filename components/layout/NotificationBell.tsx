"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

type Note = { id: number; booking_id: number | null; title: string; message: string; type: string; is_read: boolean; created_at: string };

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

/** Bell: unread count (har 45 sec), click par latest 50 notifications. */
export default function NotificationBell({ className = "" }: { className?: string }) {
  const user = useAuth();
  const t = useT();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const r = await api.get<{ unreadCount: number | string }>("/api/notifications/unread-count");
      setCount(Number(r.data.unreadCount) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const first = setTimeout(() => void refreshCount(), 0);
    const timer = setInterval(() => !document.hidden && void refreshCount(), 45000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [user, refreshCount]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const r = await api.get<{ notifications: Note[] }>("/api/notifications");
        setNotes(r.data.notifications);
      } catch {
        setNotes([]);
      }
    }
  }

  async function readAll() {
    try {
      await api.patch("/api/notifications/read-all");
      setNotes((n) => n?.map((x) => ({ ...x, is_read: true })) ?? null);
      setCount(0);
    } catch {
      /* ignore */
    }
  }

  if (!user) return null;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={count ? t("Notifications ({n} unread)", { n: count }) : t("Notifications")}
        aria-expanded={open}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
      >
        <Bell size={19} />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[1100] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-bold text-gray-950">{t("Notifications")}</p>
            {count > 0 && (
              <button type="button" onClick={() => void readAll()} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                <CheckCheck size={14} /> {t("Mark all read")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notes === null ? (
              <p className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
                <Loader2 size={15} className="animate-spin" /> {t("Loading…")}
              </p>
            ) : notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">{t("You're all caught up.")}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notes.map((n) => (
                  <li key={n.id} className={`px-4 py-3 ${n.is_read ? "" : "bg-orange-50/50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-950">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-gray-400">{ago(n.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-gray-600">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
