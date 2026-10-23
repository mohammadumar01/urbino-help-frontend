import { BadgeCheck, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    service: "Home Cleaning",
    rating: 5,
    review:
      "The booking experience was simple and convenient. I could find the service I needed without going through multiple calls.",
  },
  {
    name: "Priya Mehta",
    service: "Beauty at Home",
    rating: 5,
    review:
      "I liked being able to explore the service details before booking. The whole experience felt convenient and straightforward.",
  },
  {
    name: "Amit Verma",
    service: "AC Repair",
    rating: 4,
    review:
      "Finding a professional for an urgent repair can be difficult. Having services available in one place makes the process much easier.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Customer Reviews
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Experiences that build trust
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Real experiences and feedback help customers discover
              professionals with confidence.
            </p>
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={17}
                  className="fill-current text-gray-900"
                />
              ))}
            </div>

            <div className="h-5 w-px bg-gray-300" />

            <span className="text-sm font-semibold text-gray-900">
              Trusted experiences
            </span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="group rounded-3xl border border-gray-200 bg-gray-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:bg-white hover:shadow-xl"
            >
              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className="fill-current text-gray-900"
                      />
                    )
                  )}
                </div>

                <BadgeCheck
                  size={20}
                  className="text-blue-600"
                />
              </div>

              {/* Review */}
              <p className="mt-6 text-[15px] leading-7 text-gray-600">
                “{testimonial.review}”
              </p>

              {/* Customer */}
              <div className="mt-7 flex items-center gap-3 border-t border-gray-200 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {testimonial.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-950">
                    {testimonial.name}
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {testimonial.service}
                  </p>
                </div>

                <span className="ml-auto text-xs font-medium text-gray-400">
                  Verified
                </span>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}