import {
  ArrowRight,
  BriefcaseBusiness,
  Car,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  PawPrint,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";

const serviceCategories = [
  {
    title: "Home Services",
    description: "Everything your home needs",
    services: [
      "Home Cleaning",
      "Electrician",
      "Plumber",
      "Appliance Repair",
      "Pest Control",
      "Painting",
    ],
    icon: Home,
  },
  {
    title: "Beauty & Grooming",
    description: "Salon & grooming at home",
    services: [
      "Beauty Services",
      "Hair Services",
      "Hair Transplant",
      "Grooming",
      "Salon at Home",
    ],
    icon: Scissors,
  },
  {
    title: "Health & Wellness",
    description: "Care for you and your family",
    services: [
      "Doctor",
      "Nurse",
      "Physiotherapy",
      "Yoga Trainer",
      "Elderly Care",
    ],
    icon: HeartPulse,
  },
  {
    title: "Fitness & Lifestyle",
    description: "Stay active and healthy",
    services: [
      "Fitness Trainer",
      "Yoga Trainer",
      "Personal Training",
      "Wellness Services",
    ],
    icon: Dumbbell,
  },
  {
    title: "Education",
    description: "Learn from trusted experts",
    services: [
      "Home Tutors",
      "Language Trainers",
      "Skill Training",
    ],
    icon: GraduationCap,
  },
  {
    title: "Professional Services",
    description: "Experts for important needs",
    services: [
      "Legal Assistance",
      "Tax Assistance",
      "Insurance Assistance",
      "Financial Services",
    ],
    icon: BriefcaseBusiness,
  },
  {
    title: "Moving & Events",
    description: "Make big moments easier",
    services: [
      "Packers & Movers",
      "Event Management",
      "Catering",
      "Interior & Renovation",
    ],
    icon: Truck,
  },
  {
    title: "Pet Care",
    description: "Care for your companions",
    services: [
      "Pet Grooming",
      "Veterinary at Home",
      "Pet Care",
    ],
    icon: PawPrint,
  },
  {
    title: "Security",
    description: "People you can depend on",
    services: [
      "Security Services",
      "Watchman",
      "Bodyguard",
      "Bouncers",
    ],
    icon: ShieldCheck,
  },
  {
    title: "Local & Everyday",
    description: "Services for everyday life",
    services: [
      "Driver on Demand",
      "Laundry",
      "Tailor",
      "Scrap Collector",
    ],
    icon: Car,
  },
  {
    title: "Repair & Maintenance",
    description: "Keep things working",
    services: [
      "AC Repair",
      "Electrical Repair",
      "Home Maintenance",
      "Installation",
    ],
    icon: Wrench,
  },
  {
    title: "Personal Care",
    description: "Personalized help at home",
    services: [
      "Maid Services",
      "Instant Chef",
      "Elder Care",
      "Personal Assistance",
    ],
    icon: Sparkles,
  },
];

export default function ServiceCategories() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Explore More
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              100+ services, one platform
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
              From everyday household needs to specialized professional
              services, discover everything you need in one place.
            </p>
          </div>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 sm:flex"
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Categories */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {serviceCategories.map((category) => {
            const Icon = category.icon;

            return (
              <article
                key={category.title}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:bg-white hover:shadow-lg"
              >
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 transition group-hover:bg-gray-950 group-hover:text-white">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                {/* Title */}
                <h3 className="mt-5 text-lg font-semibold text-gray-950">
                  {category.title}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {category.description}
                </p>

                {/* Services */}
                <div className="mt-5 space-y-2">
                  {category.services.slice(0, 4).map((service) => (
                    <button
                      key={service}
                      type="button"
                      className="block text-left text-sm text-gray-600 transition hover:text-gray-950"
                    >
                      {service}
                    </button>
                  ))}
                </div>

                {/* Explore */}
                <button
                  type="button"
                  className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-gray-900"
                >
                  Explore
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}