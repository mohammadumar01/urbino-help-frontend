"use client";

import { useT } from "@/lib/i18n";
import { CalendarCheck, Search, ShieldCheck, ThumbsUp } from "lucide-react";

const steps = [
  { title: "Search", description: "Tell us what you need and where. See services and professionals near you.", icon: Search },
  { title: "Compare", description: "Check ratings, reviews, prices and availability side by side.", icon: ShieldCheck },
  { title: "Book & pay", description: "Pick a time that suits you and confirm with secure payment.", icon: CalendarCheck },
  { title: "Relax", description: "Your professional arrives on time. Rate the service when done.", icon: ThumbsUp },
];

export default function HowItWorks() {
  const t = useT();
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">{t("How it works")}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            {t("Booking takes four simple steps")}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:bg-white hover:shadow-lg"
              >
                <span className="absolute right-5 top-4 text-5xl font-bold text-gray-200">
                  {index + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-950">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{t(step.description)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}