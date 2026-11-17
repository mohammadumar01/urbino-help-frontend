import Link from "next/link";
import { ArrowRight } from "lucide-react";

const categories = [
  { name: "Home Repair", description: "Repairs & maintenance", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=85" },
  { name: "Cleaning", description: "Clean & fresh spaces", image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=700&q=85" },
  { name: "Beauty", description: "Salon & grooming", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=85" },
  { name: "Fitness", description: "Fitness & training", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=85" },
  { name: "Wellness", description: "Relaxation & wellness", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=85" },
  { name: "Professional", description: "Expert services", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=700&q=85" },
];

export default function Categories() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Explore Services
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              What do you need help with?
            </h2>
          </div>

          <Link
            href="/services"
            className="hidden items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/services"
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100"
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="font-semibold">{category.name}</h3>
                <p className="mt-0.5 text-xs text-white/80">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}