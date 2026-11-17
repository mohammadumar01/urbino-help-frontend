import { BadgeCheck, Star } from "lucide-react";

const testimonials = [
  { name: "Rahul Sharma", service: "Home Cleaning", rating: 5, review: "The booking experience was simple and convenient. I could find the service I needed without going through multiple calls." },
  { name: "Priya Mehta", service: "Beauty at Home", rating: 5, review: "I liked being able to explore the service details before booking. The whole experience felt convenient and straightforward." },
  { name: "Amit Verma", service: "AC Repair", rating: 4, review: "Finding a professional for an urgent repair can be difficult. Having services available in one place makes the process much easier." },
];

export default function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Customer reviews</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            What customers say
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <article key={t.name} className="rounded-3xl border border-gray-200 bg-gray-50 p-7 transition hover:bg-white hover:shadow-lg">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < t.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                ))}
              </div>

              <p className="mt-5 text-[15px] leading-7 text-gray-700">“{t.review}”</p>

              <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-950">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.service}</p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
                  <BadgeCheck size={14} /> Verified
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}