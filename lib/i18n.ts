"use client";

import { useCallback, useSyncExternalStore } from "react";
import { HI } from "./i18n-hi";

/**
 * Halka-phulka language support (English / हिन्दी).
 *  - English text hi "key" hai: t("Book now") -> Hindi mile to Hindi, warna English.
 *  - Placeholders: t("Hi {name}", { name }) .
 *  - Choice localStorage mein rehti hai, saare tabs/components ek saath badalte hain.
 * Naya text translate karna ho to bas lib/i18n-hi.ts mein ek line jodo.
 */
export type Lang = "en" | "hi";

const KEY = "urbino:lang";
const EVENT = "urbino-lang-change";

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "en");
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* private mode: sirf is page ke liye */
  }
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event(EVENT));
}

export type Vars = Record<string, string | number | null | undefined>;

export function translate(lang: Lang, text: string, vars?: Vars) {
  let out = lang === "hi" ? (HI[text] ?? text) : text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v == null ? "" : String(v));
  }
  return out;
}

/** const t = useT();  t("My jobs") */
export function useT() {
  const lang = useLang();
  return useCallback((text: string, vars?: Vars) => translate(lang, text, vars), [lang]);
}
