import Link from "next/link";
import { Menu, Search } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-gray-900"
        >
          Urbino<span className="text-blue-600">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/services"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Services
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            About Us
          </Link>

          <Link
            href="/provider"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Become a Provider
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search"
            className="hidden rounded-full p-2 text-gray-600 hover:bg-gray-100 md:block"
          >
            <Search size={20} />
          </button>

          <Link
            href="/login"
            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 md:block"
          >
            Log in
          </Link>

          <Link
            href="/register"
            className="hidden rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 md:block"
          >
            Get Started
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            <Menu size={22} />
          </button>
        </div>

      </div>
    </header>
  );
}