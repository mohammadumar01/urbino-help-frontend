"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BriefcaseBusiness, Car, Dumbbell, GraduationCap, HeartPulse,
  Home, PawPrint, Scissors, ShieldCheck, Sparkles, Truck, Wrench,
} from "lucide-react";

const serviceCategories = [
  { title: "Home Services", icon: Home, services: ["Home Cleaning", "Electrician", "Plumber", "Appliance Repair", "Pest Control", "Painting"] },
  { title: "Beauty & Grooming", icon: Scissors, services: ["Beauty Services", "Hair Services", "Hair Transplant", "Grooming", "Salon at Home"] },
  { title: "Health & Wellness", icon: HeartPulse, services: ["Doctor", "Nurse", "Physiotherapy", "Yoga Trainer", "Elderly Care"] },
  { title: "Fitness & Lifestyle", icon: Dumbbell, services: ["Fitness Trainer", "Yoga Trainer", "Personal Training", "Wellness Services"] },
  { title: "Education", icon: GraduationCap, services: ["Home Tutors", "Language Trainers", "Skill Training"] },
  { title: "Professional", icon: BriefcaseBusiness, services: ["Legal Assistance", "Tax Assistance", "Insurance Assistance", "Financial Services"] },
  { title: "Moving & Events", icon: Truck, services: ["Packers & Movers", "Event Management", "Catering", "Interior & Renovation"] },
  { title: "Pet Care", icon: PawPrint, services: ["Pet Grooming", "Veterinary at Home", "Pet Care"] },
  { title: "Security", icon: ShieldCheck, services: ["Security Services", "Watchman", "Bodyguard", "Bouncers"] },
  { title: "Local & Everyday", icon: Car, services: ["Driver on Demand", "Laundry", "Tailor", "Scrap Collector"] },
  { title: "Repair & Maintenance", icon: Wrench, services: ["AC Repair", "Electrical Repair", "Home Maintenance", "Installation"] },
  { title: "Personal Care", icon: Sparkles, services: ["Maid Services", "Instant Chef", "Elder Care", "Personal Assistance"] },
];

export default function ServiceCategories() {
  const [active, setActive] = useState(0);
  const current = serviceCategories[active];

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">All services</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            100+ services, one platform
          </h2>
          <p className="mt-3 text-gray-600">Pick a category and see everything we offer in it.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Category list */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {serviceCategories.map((category, index) => {
              const Icon = category.icon;
              const isActive = index === active;
              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-blue-300"
                  }`}
                >
                  <Icon size={18} />
                  {category.title}
                </button>
              );
            })}
          </div>

          {/* Services of selected category */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-950">{current.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {current.services.length} services available
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {current.services.map((service) => (
                <Link
                  key={service}
                  href="/services"
                  className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-medium text-gray-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {service}
                  <ArrowRight size={16} className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}