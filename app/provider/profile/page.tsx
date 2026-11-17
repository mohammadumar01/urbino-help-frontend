"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import ProviderShell, { btnPrimary, Card, inputCls, Notice } from "@/components/provider/ProviderShell";
import { apiError } from "@/lib/api";
import { providerApi, type ProviderProfile } from "@/lib/providerApi";

type Form = {
  bio: string;
  experience_years: string;
  skills: string;
  service_area: string;
  hourly_rate: string;
  profile_image: string;
};

const EMPTY: Form = { bio: "", experience_years: "", skills: "", service_area: "", hourly_rate: "", profile_image: "" };

function toForm(p: ProviderProfile | null): Form {
  if (!p) return EMPTY;
  return {
    bio: p.bio ?? "",
    experience_years: p.experience_years != null ? String(p.experience_years) : "",
    skills: p.skills ?? "",
    service_area: p.service_area ?? "",
    hourly_rate: p.hourly_rate != null ? String(Number(p.hourly_rate)) : "",
    profile_image: p.profile_image ?? "",
  };
}

export default function ProviderProfilePage() {
  return (
    <ProviderShell title="Your profile" subtitle="Customers see this before they book you.">
      <ProfileForm />
    </ProviderShell>
  );
}

function ProfileForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    providerApi
      .getProfile()
      .then((p) => {
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((e) => setError(apiError(e, "Could not load your profile.")))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setSaved("");
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const p = await providerApi.saveProfile({
        bio: form.bio,
        skills: form.skills,
        service_area: form.service_area,
        experience_years: form.experience_years === "" ? 0 : Number(form.experience_years),
        hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
        profile_image: form.profile_image || null,
      });
      setProfile(p);
      setForm(toForm(p));
      setSaved("Profile saved.");
    } catch (err) {
      setError(apiError(err, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading profile…
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <label htmlFor="service_area" className="mb-1.5 block text-sm font-semibold text-gray-800">
              Areas you serve <span className="text-rose-600">*</span>
            </label>
            <input id="service_area" value={form.service_area} onChange={set("service_area")} placeholder="Kota, Jaipur, Ajmer" className={inputCls} required />
            <p className="mt-1 text-xs text-gray-500">Separate cities or localities with commas. Customers searching these areas will find you.</p>
          </div>

          <div>
            <label htmlFor="experience" className="mb-1.5 block text-sm font-semibold text-gray-800">Experience (years)</label>
            <input id="experience" type="number" min={0} max={60} inputMode="numeric" value={form.experience_years} onChange={set("experience_years")} placeholder="5" className={inputCls} />
          </div>

          <div>
            <label htmlFor="rate" className="mb-1.5 block text-sm font-semibold text-gray-800">Hourly rate (₹)</label>
            <input id="rate" type="number" min={1} inputMode="decimal" value={form.hourly_rate} onChange={set("hourly_rate")} placeholder="300" className={inputCls} />
            <p className="mt-1 text-xs text-gray-500">Used for custom jobs. Each service has its own fixed price.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="skills" className="mb-1.5 block text-sm font-semibold text-gray-800">Skills</label>
            <input id="skills" value={form.skills} onChange={set("skills")} placeholder="Split AC, window AC, gas refill" className={inputCls} maxLength={500} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold text-gray-800">About you</label>
            <textarea id="bio" value={form.bio} onChange={set("bio")} rows={4} maxLength={1000} placeholder="Tell customers about your work, training and what makes you reliable." className={inputCls} />
            <p className="mt-1 text-right text-xs text-gray-400">{form.bio.length}/1000</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="image" className="mb-1.5 block text-sm font-semibold text-gray-800">Profile photo link (optional)</label>
            <input id="image" type="url" value={form.profile_image} onChange={set("profile_image")} placeholder="https://…" className={inputCls} />
          </div>

          <div className="space-y-3 sm:col-span-2">
            {error && <Notice tone="error">{error}</Notice>}
            {saved && <Notice tone="success">{saved}</Notice>}
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving && <Loader2 size={16} className="animate-spin" />} {profile ? "Save changes" : "Create profile"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="h-fit">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Preview</p>
        <div className="mt-4 flex items-center gap-3">
          {form.profile_image.startsWith("https://") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.profile_image} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
              {(profile?.name || "P")[0]}
            </span>
          )}
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-gray-950">
              {profile?.name || "Your name"}
              {profile?.is_verified && <BadgeCheck size={17} className="text-blue-600" aria-label="Verified" />}
            </p>
            <p className="text-sm text-gray-500">
              {form.experience_years || 0} yrs experience{form.hourly_rate ? ` · ₹${form.hourly_rate}/hr` : ""}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">{form.bio || "Your introduction will appear here."}</p>
        {form.service_area && <p className="mt-3 text-xs text-gray-500">Serves: {form.service_area}</p>}
        {!profile?.is_verified && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Upload your Aadhaar under Documents to get the Verified badge.
          </p>
        )}
      </Card>
    </div>
  );
}
