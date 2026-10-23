import { MapPin, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">

          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
            Trusted services. Right at your doorstep.
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Get things done.
            <br />
            <span className="text-blue-600">
              Without the hassle.
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Discover trusted professionals for home, wellness, repair,
            beauty, fitness and everyday services — all in one place.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl shadow-gray-200/50 sm:flex-row">

            <div className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <Search className="h-5 w-5 text-gray-400" />

              <input
                type="text"
                placeholder="What service do you need?"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 sm:w-52">
              <MapPin className="h-5 w-5 text-gray-400" />

              <span className="text-sm text-gray-500">
                Your location
              </span>
            </div>

            <button
              type="button"
              className="rounded-xl bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Search
            </button>
          </div>

          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">
              Popular:
            </span>

            {["AC Repair", "Cleaning", "Electrician", "Beauty"].map(
              (service) => (
                <button
                  key={service}
                  type="button"
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-gray-600 transition hover:border-gray-400"
                >
                  {service}
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </section>
  );
}