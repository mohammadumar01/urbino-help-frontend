import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Layers3,
} from "lucide-react";

const benefits = [
  {
    number: "01",
    title: "Verified Professionals",
    description:
      "Connect with trusted professionals through Urbino's verification and quality-focused service experience.",
    icon: BadgeCheck,
  },
  {
    number: "02",
    title: "Transparent Pricing",
    description:
      "See service costs upfront with a clear pricing experience designed to avoid unexpected charges.",
    icon: CreditCard,
  },
  {
    number: "03",
    title: "Smart Scheduling",
    description:
      "Choose a convenient time, check availability and manage your service booking with ease.",
    icon: CalendarClock,
  },
  {
    number: "04",
    title: "One-Stop Platform",
    description:
      "Discover, book and manage home, personal, wellness and professional services from one place.",
    icon: Layers3,
  },
];

export default function WhyUrbino() {
  return (
    <section className="bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-400">
              Why Urbino
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              A better way to access everyday services.
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-gray-400 lg:justify-self-end">
            Urbino brings trusted professionals, transparent pricing,
            convenient scheduling and multiple service categories together
            in one digital marketplace.
          </p>

        </div>

        {/* Benefits */}
        <div className="mt-16 grid border-t border-gray-800 sm:grid-cols-2">

          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.number}
                className="group border-b border-gray-800 p-7 transition duration-300 hover:bg-white/[0.03] sm:nth-[odd]:border-r sm:nth-[3]:border-b-0 sm:nth-[4]:border-b-0 lg:p-9"
              >
                <div className="flex items-start justify-between gap-6">

                  {/* Number */}
                  <span className="text-sm font-medium text-gray-600">
                    {benefit.number}
                  </span>

                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-blue-400 transition group-hover:border-blue-900">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>

                </div>

                <h3 className="mt-10 text-xl font-semibold text-white">
                  {benefit.title}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
                  {benefit.description}
                </p>

                <div className="mt-7 flex items-center gap-2 text-sm font-medium text-gray-500 transition group-hover:text-white">
                  Learn more
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>

              </article>
            );
          })}

        </div>

        {/* Bottom Statement */}
        <div className="mt-14 flex flex-col gap-5 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div>
            <p className="text-lg font-semibold">
              Built for India's evolving service economy.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              From everyday home services to specialized professional needs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
            Explore Urbino
            <ArrowUpRight size={17} />
          </div>

        </div>

      </div>
    </section>
  );
}