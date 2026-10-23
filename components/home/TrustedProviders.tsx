import { ArrowRight, BadgeCheck, Star } from "lucide-react";

const providers = [
  {
    name: "Rajesh Kumar",
    category: "AC & Appliance Expert",
    rating: "4.9",
    reviews: "128 reviews",
    experience: "8+ years experience",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Priya Sharma",
    category: "Beauty Specialist",
    rating: "4.8",
    reviews: "96 reviews",
    experience: "6+ years experience",
    image:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Amit Verma",
    category: "Home Cleaning Expert",
    rating: "4.9",
    reviews: "184 reviews",
    experience: "7+ years experience",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85",
  },
];

export default function TrustedProviders() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Trusted Professionals
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Meet professionals you can trust
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Verified professionals, real reviews and reliable service —
              so you can book with confidence.
            </p>
          </div>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 sm:flex"
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Provider Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {providers.map((provider) => (
            <article
              key={provider.name}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
            >
              {/* Profile Image */}
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Verified Badge */}
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur">
                  <BadgeCheck
                    size={15}
                    className="text-blue-600"
                  />
                  Verified
                </div>
              </div>

              {/* Content */}
              <div className="p-5">

                {/* Name */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-950">
                      {provider.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {provider.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5">
                    <Star
                      size={14}
                      className="fill-current text-gray-900"
                    />

                    <span className="text-sm font-semibold text-gray-900">
                      {provider.rating}
                    </span>
                  </div>
                </div>

                {/* Reviews */}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <span>{provider.reviews}</span>
                  <span>•</span>
                  <span>{provider.experience}</span>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-900 hover:bg-gray-950 hover:text-white"
                >
                  View Profile
                  <ArrowRight size={16} />
                </button>

              </div>
            </article>
          ))}
        </div>

        {/* Mobile Button */}
        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-800 sm:hidden"
        >
          View all professionals
          <ArrowRight size={16} />
        </button>

      </div>
    </section>
  );
}