import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";

const providers = [
  { name: "Rajesh Kumar", category: "AC & Appliance Expert", rating: "4.9", reviews: "128 reviews", experience: "8+ yrs", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85" },
  { name: "Priya Sharma", category: "Beauty Specialist", rating: "4.8", reviews: "96 reviews", experience: "6+ yrs", image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85" },
  { name: "Amit Verma", category: "Home Cleaning Expert", rating: "4.9", reviews: "184 reviews", experience: "7+ yrs", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85" },
];

export default function TrustedProviders() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Top professionals</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Verified experts you can trust
            </h2>
          </div>
          <Link href="/services" className="hidden items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {providers.map((p) => (
            <article key={p.name} className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-60 overflow-hidden bg-gray-100">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm">
                  <BadgeCheck size={14} className="text-blue-600" /> Verified
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-950">{p.name}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-700">
                    <Star size={14} className="fill-amber-400 text-amber-400" /> {p.rating}
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-500">{p.reviews} · {p.experience} experience</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link href="/services" className="rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-800 transition hover:border-gray-900">
                    Profile
                  </Link>
                  <Link href="/services" className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700">
                    Book now
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