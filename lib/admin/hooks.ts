"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "./api";

export type ToastState = { type: "success" | "error"; text: string } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = useCallback((type: "success" | "error", text: string) => setToast({ type, text }), []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, notify, dismiss };
}

export function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Filters/page ko URL mein rakhta hai: refresh, back button aur link sharing kaam karte hain. */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const values = useMemo(() => {
    const o: Record<string, string> = { ...defaults };
    for (const k of Object.keys(defaults)) {
      const v = sp.get(k);
      if (v !== null) o[k] = v;
    }
    return o as T;
  }, [sp, defaults]);

  const set = useCallback(
    (patch: Partial<T>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "" || v === (defaults as Record<string, string>)[k]) next.delete(k);
        else next.set(k, String(v));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, pathname, router, defaults]
  );

  return [values, set] as const;
}

/** Input ke liye local state, 300ms baad URL mein commit. */
export function useDebouncedUrlSearch(urlValue: string, commit: (q: string) => void, ms = 300) {
  const [search, setSearch] = useState(urlValue);
  const debounced = useDebounce(search.trim(), ms);
  useEffect(() => {
    if (debounced !== urlValue) commit(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return [search, setSearch] as const;
}

/** pageSize / density jaisi preferences localStorage mein yaad rakhta hai. */
export function usePersisted<T extends string | number>(key: string, initial: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      const v = (typeof initial === "number" ? Number(raw) : raw) as T;
      if (allowed.includes(v)) setValue(v);
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, String(v));
      } catch {}
    },
    [key]
  );
  return [value, update] as const;
}

export function useHotkeys(map: Record<string, () => void>, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable)) return;
      const fn = ref.current[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** GET data + race-safe loading. Pehli baar skeleton, baad mein sirf dim + progress bar. */
export function useApiQuery<T = any>(path: string | null, intervalMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);
  const req = useRef(0);
  const loaded = useRef(false);

  const run = useCallback(
    async (silent = false) => {
      if (!path) return;
      const id = ++req.current;
      if (silent || loaded.current) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const d = await api<T>(path);
        if (id !== req.current) return;
        setData(d);
        loaded.current = true;
        setUpdated(new Date());
      } catch (e) {
        if (id !== req.current) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (id === req.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [path]
  );

  useEffect(() => {
    void run();
  }, [run]);

  useEffect(() => {
    if (!intervalMs) return;
    const t = setInterval(() => {
      if (!document.hidden) void run(true);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, run]);

  return { data, setData, loading, refreshing, error, updated, reload: () => run(true), retry: () => run() };
}