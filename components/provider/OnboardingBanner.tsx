"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import { providerApi, type Onboarding } from "@/lib/providerApi";
import { useT } from "@/lib/i18n";

const LINKS: Record<string, string> = {
  profile: "/provider/profile",
  services: "/provider/services",
  availability: "/provider/availability",
  documents: "/provider/documents",
};

/** Setup adhoora ho to checklist; sab done ho to chhota "verified/live" status. */
export default function OnboardingBanner() {
  const t = useT();
  const [data, setData] = useState<Onboarding | null>(null);

  useEffect(() => {
    providerApi.onboarding().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <div className="min-h-[1px] flex-1" />;

  const steps = data.steps.filter((s) => !s.optional);
  const allDone = data.completed === data.total;

  if (allDone) {
    return (
      <p className="flex flex-1 items-center gap-2 text-sm text-gray-600">
        {data.verified ? (
          <>
            <BadgeCheck size={18} className="text-blue-600" /> {t("Verified and visible to customers.")}
          </>
        ) : (
          <>
            <Clock3 size={18} className="text-amber-600" /> {t("Live for bookings. Verification is under review.")}
          </>
        )}
      </p>
    );
  }

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <section className="flex-1 rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-950">{t("Finish setting up your account")}</h2>
          <p className="text-sm text-gray-600">
            {t(
              data.visible_to_customers
                ? "Customers can already find you. Complete the rest to get verified."
                : "Customers can't find you until your profile and services are added."
            )}
          </p>
        </div>
        <span className="text-sm font-semibold text-orange-700">
          {data.completed}/{data.total} {t("done")}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => {
          const rejected = s.status === "rejected";
          const pending = s.key === "documents" && s.status === "pending";
          const Icon = rejected ? XCircle : s.done ? CheckCircle2 : Circle;
          return (
            <li key={s.key}>
              <Link
                href={LINKS[s.key] ?? "#"}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-100 hover:ring-orange-300"
              >
                <Icon size={17} className={rejected ? "text-rose-600" : s.done ? "text-emerald-600" : "text-gray-300"} />
                <span className={s.done && !rejected ? "text-gray-500 line-through" : ""}>{t(s.label)}</span>
                {pending && <span className="ml-auto text-xs text-amber-700">In review</span>}
                {rejected && <span className="ml-auto text-xs text-rose-700">Re-upload</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
