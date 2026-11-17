import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { popularServices } from "@/constants/services";

export default function PopularServices() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Popular Services
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Most booked near you
            </h2>
            <p className="mt-2 text-gray-600">Clear prices. Book in a few taps.</p>
          </div>

          <Link
            href="/services"
            className="hidden items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
          >
            Explore all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="-mx-6 mt-8 flex snap-x gap-4 overflow-x-auto px-6 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {popularServices.map((service) => (
            <article
              key={service.name}
              className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl lg:w-auto"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                  {service.category}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-950">{service.name}</h3>

                <div className="mt-1.5 flex items-center gap-1 text-sm text-gray-600">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-medium text-gray-900">{service.rating}</span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                  {service.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Starts at</p>
                    <p className="font-bold text-gray-950">{service.price}</p>
                  </div>
                  <Link
                    href="/services"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}