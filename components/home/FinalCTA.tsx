import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-blue-600 px-7 py-12 sm:px-12 lg:px-16 lg:py-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Whatever you need, find it on Urbino Help.
              </h2>
              <p className="mt-4 text-base leading-7 text-blue-100">
                Book trusted professionals in minutes, or start earning by offering your own services.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/services" className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100">
                Find a service <ArrowRight size={16} />
              </Link>
              <Link href="/provider" className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20">
                <UserPlus size={18} /> Become a provider
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}