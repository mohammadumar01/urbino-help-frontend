import { ArrowRight, Search, UserPlus } from "lucide-react";

export default function FinalCTA() {
return (
<section className="bg-gray-950">
    <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

    <div className="relative overflow-hidden rounded-[2rem] bg-blue-600 px-7 py-12 sm:px-12 lg:px-16 lg:py-16">

        {/* Decorative Shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">

        {/* Content */}
        <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">
            Get Started with Urbino
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Whatever you need,
            <br />
            find it on Urbino.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">
            Discover trusted professionals, explore services and book
            the help you need — all from one place.
            </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">

            <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
            >
            <Search size={18} />
            Find a Service
            <ArrowRight size={16} />
            </button>

            <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
            <UserPlus size={18} />
            Become a Provider
            </button>

        </div>

        </div>
    </div>

    </div>
</section>
);
}