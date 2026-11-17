import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, HeartHandshake, Layers3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "About Us | Urbino",
  description: "Urbino connects customers with trusted local service professionals.",
};

const values = [
  { icon: BadgeCheck, title: "Trust first", text: "Providers go through verification before they take bookings." },
  { icon: CreditCard, title: "Clear pricing", text: "You see the price upfront, with no surprises later." },
  { icon: Layers3, title: "One platform", text: "Home, beauty, wellness and professional services in one place." },
  { icon: HeartHandshake, title: "Fair for providers", text: "Professionals set their own rates and work on their own schedule." },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:py-28">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">About Urbino</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Making everyday services simple and trustworthy.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Urbino is a marketplace that connects customers with verified local
              professionals, so finding and booking help takes minutes, not phone calls.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-950">Our mission</h2>
              <p className="mt-4 leading-7 text-gray-600">
                Finding a reliable electrician, cleaner or trainer should not depend on
                luck. We bring discovery, pricing, booking and payment together, and we
                verify the professionals behind every service.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-950">Who it is for</h2>
              <p className="mt-4 leading-7 text-gray-600">
                Customers who want dependable help at home and in daily life, and
                professionals who want steady bookings without chasing leads.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-950">What we stand for</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 font-semibold text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">Join Urbino</h2>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-blue-700">
                Find a service <ArrowRight size={16} />
              </Link>
              <Link href="/provider" className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-7 py-3.5 text-sm font-semibold text-gray-800 hover:border-gray-400">
                Become a provider
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}