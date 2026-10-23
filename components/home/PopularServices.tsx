import { ArrowRight, Star } from "lucide-react";
import { popularServices } from "@/constants/services";

export default function PopularServices() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Popular Services
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Services people book most
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Discover reliable professionals for the services people need
              most, right at their doorstep.
            </p>
          </div>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 sm:flex"
          >
            Explore all
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Services */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {popularServices.map((service) => (
            <article
              key={service.name}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-gray-100">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Category */}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
                  {service.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">

                <h3 className="text-base font-semibold text-gray-950">
                  {service.name}
                </h3>

                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-gray-500">
                  {service.description}
                </p>

                {/* Rating */}
                <div className="mt-4 flex items-center gap-1.5">
                  <Star
                    size={15}
                    className="fill-current text-gray-900"
                  />

                  <span className="text-sm font-medium text-gray-800">
                    {service.rating}
                  </span>

                  <span className="text-xs text-gray-400">
                    • Highly rated
                  </span>
                </div>

                {/* Price + Book */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">
                      Starting from
                    </p>

                    <p className="mt-0.5 text-base font-bold text-gray-950">
                      {service.price}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                  >
                    Book
                  </button>
                </div>

              </div>
            </article>
          ))}
        </div>

        {/* Mobile */}
        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-800 sm:hidden"
        >
          Explore all services
          <ArrowRight size={16} />
        </button>

      </div>
    </section>
  );
}