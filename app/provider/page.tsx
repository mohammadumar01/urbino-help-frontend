import Link from "next/link";
import {
  ArrowRight, BadgeCheck, CalendarClock, FileCheck2, IndianRupee,
  Users, UserPlus, ClipboardList,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Become a Provider | Urbino",
  description: "Join Urbino, get verified and receive service bookings from customers near you.",
};

const benefits = [
  { icon: Users, title: "Customers come to you", text: "Get booking requests from people looking for your service in your area." },
  { icon: IndianRupee, title: "You set your rate", text: "Decide your hourly rate and the services you offer." },
  { icon: CalendarClock, title: "Work on your schedule", text: "Set your availability and accept only the bookings that suit you." },
  { icon: BadgeCheck, title: "Verified badge", text: "Verified providers earn customer trust and stand out in search." },
];

const steps = [
  { icon: UserPlus, title: "Create your account", text: "Sign up as a provider with your name, email and phone." },
  { icon: ClipboardList, title: "Complete your profile", text: "Add your bio, skills, experience, service area and hourly rate." },
  { icon: FileCheck2, title: "Get verified", text: "Upload your documents. Our team reviews and approves them." },
  { icon: CalendarClock, title: "Start getting bookings", text: "Accept requests, complete jobs and build your ratings." },
];

export default function ProviderPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:py-28">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              For professionals
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Grow your service business with <span className="text-blue-600">Urbino.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Join as a verified professional and get bookings from customers
              near you, without chasing leads.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register?role=provider"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Join as a provider <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400"
              >
                Already a provider? Log in
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-950">
              Why professionals choose Urbino
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:bg-white hover:shadow-lg">
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

        {/* Steps */}
        <section className="bg-gray-50">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-950">
              Get started in four steps
            </h2>
            <ol className="mt-10 space-y-4">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-950 text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-gray-950">
                      <Icon size={18} className="text-blue-600" /> {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950">Ready to start earning?</h2>
            <p className="mt-3 text-gray-600">Create your provider account in a couple of minutes.</p>
            <Link
              href="/register?role=provider"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Join as a provider <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}