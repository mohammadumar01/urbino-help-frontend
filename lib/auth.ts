"use client";

import { useSyncExternalStore } from "react";

export type Role = "customer" | "provider" | "agent" | "admin";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";
const EVENT = "urbino-auth-change";

/** Har role ka "home" page jahan login ke baad jaana hai. */
export const ROLE_HOME: Record<Role, string> = {
  customer: "/services",
  provider: "/provider/dashboard",
  agent: "/agent/dashboard",
  admin: "/admin/dashboard",
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Token expire ho chuka ho to session ko invalid maano. */
function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  const token = safeGet(TOKEN_KEY);
  if (!token || tokenExpired(token)) return null;
  return token;
}

let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

export function getUser(): SessionUser | null {
  if (!getToken()) return null;
  const raw = safeGet(USER_KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    const u = raw ? (JSON.parse(raw) as SessionUser) : null;
    // purane accounts ka role "user" tha
    if (u && (u.role as string) === "user") u.role = "customer";
    cachedUser = u;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function saveSession(token: string, user: SessionUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Admin panel apna token sessionStorage mein padhta hai
    if (user.role === "admin") sessionStorage.setItem("adminToken", token);
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("adminToken");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // doosre tab mein login/logout
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Logged-in user. Server render par `undefined` (abhi pata nahi),
 * browser mein `null` (logged out) ya user.
 */
export function useAuth(): SessionUser | null | undefined {
  return useSyncExternalStore(subscribe, getUser, () => undefined);
}
