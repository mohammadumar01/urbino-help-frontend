import Link from "next/link";
import {
  Globe2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";

const footerLinks = {
  Services: [
    "Home Services",
    "Beauty & Grooming",
    "Health & Wellness",
    "Fitness & Lifestyle",
  ],
  Company: [
    "About Us",
    "How It Works",
    "Careers",
    "Contact",
  ],
  Providers: [
    "Become a Provider",
    "Provider Login",
    "Provider Resources",
  ],
  Support: [
    "Help Center",
    "FAQs",
    "Privacy Policy",
    "Terms of Service",
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        {/* Main Footer */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">

          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight"
            >
              Urbino<span className="text-blue-500">.</span>
            </Link>

            <p className="mt-5 text-sm leading-7 text-gray-400">
              Making everyday services easier. Discover trusted
              professionals, book services and manage everything from
              one place.
            </p>

            {/* Social / Contact Icons */}
            <div className="mt-6 flex items-center gap-3">
              {[Globe2, Mail, MessageCircle, Share2].map(
                (Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-800 text-gray-400 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white"
                    aria-label="Social media"
                  >
                    <Icon size={17} />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {Object.entries(footerLinks).map(
              ([title, links]) => (
                <div key={title}>
                  <h3 className="text-sm font-semibold text-white">
                    {title}
                  </h3>

                  <ul className="mt-5 space-y-3">
                    {links.map((link) => (
                      <li key={link}>
                        <button
                          type="button"
                          className="text-left text-sm text-gray-400 transition hover:text-white"
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-14 flex flex-col gap-4 border-t border-gray-800 pt-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © 2026 Urbino Tech Private Limited. All rights reserved.
          </p>

          <div className="flex gap-5">
            <button
              type="button"
              className="transition hover:text-white"
            >
              Privacy
            </button>

            <button
              type="button"
              className="transition hover:text-white"
            >
              Terms
            </button>

            <button
              type="button"
              className="transition hover:text-white"
            >
              Cookies
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}