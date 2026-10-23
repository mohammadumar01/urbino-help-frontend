
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type ProfileForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  experience: string;
  skills: string;
  service_area: string;
};

const initialForm: ProfileForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  experience: "",
  skills: "",
  service_area: "",
};

// Predefined city suggestions
const CITY_OPTIONS = [
  "Kota",
  "Jaipur",
  "Delhi",
  "New Delhi",
  "Gurugram",
  "Noida",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Chandigarh",
  "Lucknow",
  "Ahmedabad",
  "Indore",
  "Jodhpur",
  "Udaipur",
  "Ajmer",
  "Bhopal",
  "Chennai",
  "Kolkata",
];

// Predefined service suggestions
const SKILL_OPTIONS = [
  "AC Installation",
  "AC Repair",
  "Air Conditioner Maintenance",
  "Plumbing",
  "Electrical Repair",
  "Wiring Installation",
  "Appliance Repair",
  "Washing Machine Repair",
  "Refrigerator Repair",
  "Painting",
  "Carpentry",
  "Cleaning",
  "RO Repair",
  "Fan Installation",
  "Geyser Repair",
  "CCTV Installation",
];

export default function AgentProfilePage() {
  const [form, setForm] = useState<ProfileForm>(initialForm);

  const [citySearch, setCitySearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState("pending");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/api/agent/profile");
        const profile = response.data.profile;

        if (profile) {
          const skills = profile.skills
            ? profile.skills.split(",").map((item: string) => item.trim()).filter(Boolean)
            : [];

          const cities = profile.service_area
            ? profile.service_area.split(",").map((item: string) => item.trim()).filter(Boolean)
            : [];

          setForm({
            name: profile.name ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? "",
            address: profile.address ?? "",
            experience: String(profile.experience_years ?? 0),
            skills: skills.join(", "),
            service_area: cities.join(", "),
          });

          setSelectedSkills([...new Set<string>(skills)]);
          setSelectedCities([...new Set<string>(cities)]);

          setVerificationStatus(
            profile.verification_status ?? "pending"
          );
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ??
            "Unable to load your profile. Please check your login."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addSkill = (value: string) => {
    const skill = value.trim();

    if (!skill) return;

    const exists = selectedSkills.some(
      (item) => item.toLowerCase() === skill.toLowerCase()
    );

    if (exists) {
      setSkillSearch("");
      return;
    }

    const updated = [...selectedSkills, skill];

    setSelectedSkills(updated);
    setForm((previous) => ({
      ...previous,
      skills: updated.join(", "),
    }));

    setSkillSearch("");
  };

  const removeSkill = (skill: string) => {
    const updated = selectedSkills.filter(
      (item) => item !== skill
    );

    setSelectedSkills(updated);
    setForm((previous) => ({
      ...previous,
      skills: updated.join(", "),
    }));
  };

  const addCity = (value: string) => {
    const city = value.trim();

    if (!city) return;

    const exists = selectedCities.some(
      (item) => item.toLowerCase() === city.toLowerCase()
    );

    if (exists) {
      setCitySearch("");
      return;
    }

    const updated = [...selectedCities, city];

    setSelectedCities(updated);
    setForm((previous) => ({
      ...previous,
      service_area: updated.join(", "),
    }));

    setCitySearch("");
  };

  const removeCity = (city: string) => {
    const updated = selectedCities.filter(
      (item) => item !== city
    );

    setSelectedCities(updated);
    setForm((previous) => ({
      ...previous,
      service_area: updated.join(", "),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.address.trim() ||
      selectedSkills.length === 0 ||
      selectedCities.length === 0 ||
      form.experience.trim() === "" ||
      !Number.isInteger(Number(form.experience)) ||
      Number(form.experience) < 0
    ) {
      setError(
        "Please enter a valid address and experience, and select at least one skill and service area."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await api.put("/api/agent/profile", {
        address: form.address.trim(),
        experience_years: Number(form.experience),
        skills: selectedSkills.join(", "),
        service_area: selectedCities.join(", "),
      });

      const profile = response.data.profile;

      if (profile) {
        setVerificationStatus(
          profile.verification_status ?? "pending"
        );
      }

      setMessage(
        response.data.message ?? "Profile saved successfully!"
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    verificationStatus === "approved"
      ? "Verification Approved"
      : verificationStatus === "rejected"
        ? "Verification Rejected"
        : "Verification Pending";

  const statusClass =
    verificationStatus === "approved"
      ? "bg-green-100 text-green-800"
      : verificationStatus === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  const matchingCities = CITY_OPTIONS.filter(
    (city) =>
      city.toLowerCase().includes(citySearch.trim().toLowerCase()) &&
      !selectedCities.some(
        (selected) => selected.toLowerCase() === city.toLowerCase()
      )
  );

  const matchingSkills = SKILL_OPTIONS.filter(
    (skill) =>
      skill.toLowerCase().includes(skillSearch.trim().toLowerCase()) &&
      !selectedSkills.some(
        (selected) => selected.toLowerCase() === skill.toLowerCase()
      )
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/agent/dashboard"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold">
              Agent Profile
            </h1>

            <p className="mt-2 text-slate-600">
              Complete your profile and professional details.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}
          >
            {statusLabel}
          </span>
        </header>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                role="status"
                className="rounded-xl bg-green-100 p-4 text-green-800"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-100 p-4 text-red-800"
              >
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">
                Personal Information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { name: "name", label: "Full Name", type: "text" },
                  { name: "phone", label: "Phone Number", type: "tel" },
                  { name: "email", label: "Email Address", type: "email" },
                  {
                    name: "experience",
                    label: "Experience (Years)",
                    type: "number",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="mb-2 block text-sm font-medium"
                    >
                      {field.label}
                    </label>

                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      min={field.type === "number" ? "0" : undefined}
                      step={field.type === "number" ? "1" : undefined}
                      value={form[field.name as keyof ProfileForm]}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium"
                >
                  Full Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full address"
                />
              </div>

              {/* Skills autocomplete */}
              <div className="mt-5">
                <label
                  htmlFor="skill-search"
                  className="mb-2 block text-sm font-medium"
                >
                  Skills / Services
                </label>

                <input
                  id="skill-search"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && skillSearch.trim()) {
                      e.preventDefault();
                      addSkill(skillSearch);
                    }
                  }}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search skills, e.g. AC Repair"
                />

                {skillSearch.trim() && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {matchingSkills.map((skill) => (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50"
                      >
                        + {skill}
                      </button>
                    ))}

                    {!SKILL_OPTIONS.some(
                      (skill) =>
                        skill.toLowerCase() ===
                        skillSearch.trim().toLowerCase()
                    ) &&
                      !selectedSkills.some(
                        (skill) =>
                          skill.toLowerCase() ===
                          skillSearch.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onClick={() => addSkill(skillSearch)}
                          className="block w-full px-4 py-3 text-left font-medium text-blue-600 hover:bg-blue-50"
                        >
                          + Add "{skillSearch.trim()}"
                        </button>
                      )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-sm text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="font-bold hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Select a suggestion or press Enter to add a custom skill.
                </p>
              </div>

              {/* City autocomplete */}
              <div className="mt-5">
                <label
                  htmlFor="city-search"
                  className="mb-2 block text-sm font-medium"
                >
                  Service Area
                </label>

                <input
                  id="city-search"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && citySearch.trim()) {
                      e.preventDefault();
                      addCity(citySearch);
                    }
                  }}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search city, e.g. Jaipur"
                />

                {citySearch.trim() && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {matchingCities.map((city) => (
                      <button
                        type="button"
                        key={city}
                        onClick={() => addCity(city)}
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50"
                      >
                        + {city}
                      </button>
                    ))}

                    {!CITY_OPTIONS.some(
                      (city) =>
                        city.toLowerCase() ===
                        citySearch.trim().toLowerCase()
                    ) &&
                      !selectedCities.some(
                        (city) =>
                          city.toLowerCase() ===
                          citySearch.trim().toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onClick={() => addCity(citySearch)}
                          className="block w-full px-4 py-3 text-left font-medium text-blue-600 hover:bg-blue-50"
                        >
                          + Add "{citySearch.trim()}"
                        </button>
                      )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCities.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-sm text-blue-800"
                    >
                      {city}
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        aria-label={`Remove ${city}`}
                        className="font-bold hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Select multiple cities or press Enter to add another city.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Document Verification
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select an identity document for the next verification step.
                Uploading it to the server is not connected yet.
              </p>

              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="font-semibold">
                  Identity Proof & Certificates
                </p>

                <input
                  type="file"
                  id="identity-document"
                  name="identity-document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      console.log("Selected document:", file.name);
                    }
                  }}
                  className="mt-4 block w-full rounded-xl border border-slate-300 bg-white p-3"
                />
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
