import {
  ArrowRight,
  CalendarCheck,
  Search,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Discover",
    description:
      "Search for the service you need and explore professionals available near you.",
    icon: Search,
  },
  {
    step: "02",
    title: "Choose",
    description:
      "Compare profiles, ratings, pricing and availability before making your choice.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Book & Pay",
    description:
      "Select a convenient time, confirm your booking and make a secure payment.",
    icon: CalendarCheck,
  },
  {
    step: "04",
    title: "Get It Done",
    description:
      "Receive the service, manage your booking and share your experience with the community.",
    icon: ArrowRight,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            From search to service, made simple
          </h2>

          <p className="mt-4 text-base leading-7 text-gray-600">
            Find the right professional, book when it suits you and manage
            your entire service experience from one place.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-14">

          {/* Connecting Line */}
          <div className="absolute left-[12%] right-[12%] top-8 hidden border-t border-dashed border-gray-200 md:block" />

          <div className="relative grid gap-10 md:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.step}
                  className="group text-center"
                >
                  {/* Icon */}
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-gray-300 group-hover:shadow-md">
                    <Icon
                      size={25}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Step */}
                  <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-gray-400">
                    STEP {step.step}
                  </p>

                  {/* Title */}
                  <h3 className="mt-2 text-lg font-semibold text-gray-950">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-500">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Bottom Message */}
        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              One platform.
            </span>{" "}
            Discover, book, pay and manage services without the hassle.
          </p>
        </div>

      </div>
    </section>
  );
}