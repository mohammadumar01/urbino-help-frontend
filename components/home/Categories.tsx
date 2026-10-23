const categories = [
  {
    name: "Home Repair",
    description: "Repairs & maintenance",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Cleaning",
    description: "Clean & fresh spaces",
    image:
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Beauty",
    description: "Salon & grooming",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Fitness",
    description: "Fitness & training",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Wellness",
    description: "Relaxation & wellness",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Professional",
    description: "Expert services",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=700&q=85",
  },
];

export default function Categories() {
  return (
    <section className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Explore Services
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Everything you need, in one place
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Find trusted professionals for the services you need at home
              and in your everyday life.
            </p>
          </div>

          <button
            type="button"
            className="hidden shrink-0 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 sm:block"
          >
            View all →
          </button>
        </div>

        {/* Cards */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <article
              key={category.name}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden bg-gray-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-950">
                  {category.name}
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {category.description}
                </p>

                <div className="mt-4 text-sm font-semibold text-gray-900">
                  Explore →
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile View All */}
        <button
          type="button"
          className="mt-6 w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 sm:hidden"
        >
          View all services →
        </button>

      </div>
    </section>
  );
}