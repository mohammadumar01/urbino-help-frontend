"use client";

import { useEffect } from "react";
import { Languages } from "lucide-react";
import { setLang, useLang } from "@/lib/i18n";

/** EN | हिं  switch. `compact` = sirf chhota pill (phone header ke liye). */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const lang = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      className={`inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold ${className}`}
    >
      <Languages size={14} className="ml-1.5 mr-0.5 text-gray-400" aria-hidden />
      {(
        [
          ["en", "EN"],
          ["hi", "हिं"],
        ] as const
      ).map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          aria-label={code === "en" ? "English" : "हिन्दी"}
          onClick={() => setLang(code)}
          className={`rounded-full px-2.5 py-1 transition ${lang === code ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
