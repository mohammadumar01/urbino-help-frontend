"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, MapPin, Star, Users } from "lucide-react";
import api, { apiError } from "@/lib/api";

type Invite = {
  id: number;
  provider_name: string;
  service_area: string | null;
  provider_verified: boolean | null;
  provider_rating: number | null;
  message: string | null;
};

/** Agent ko provider ke team invites: Join / No thanks. */
export default function InviteBanner({ onJoined }: { onJoined?: () => void }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ invites: Invite[] }>("/api/agent/invites");
      setInvites(r.data.invites);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function answer(id: number, accept: boolean) {
    setBusy(id);
    try {
      const r = await api.put<{ message: string }>(`/api/agent/invites/${id}/${accept ? "accept" : "decline"}`);
      setMsg(r.data.message);
      await load();
      if (accept) onJoined?.();
    } catch (e) {
      setMsg(apiError(e, "Could not answer the invite."));
    } finally {
      setBusy(null);
    }
  }

  if (!invites.length && !msg) return null;

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
      <h2 className="flex items-center gap-2 font-bold text-gray-950">
        <Users size={18} className="text-blue-600" /> Team invites
      </h2>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
      <ul className="mt-3 space-y-3">
        {invites.map((i) => (
          <li key={i.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-gray-950">
                {i.provider_name}
                {i.provider_verified && <BadgeCheck size={16} className="text-blue-600" aria-label="Verified provider" />}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                {i.provider_rating && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> {i.provider_rating}
                  </span>
                )}
                {i.service_area && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin size={12} /> {i.service_area}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-gray-600">wants you in their team. You&apos;ll get jobs from them here.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy === i.id} onClick={() => void answer(i.id, false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">
                No thanks
              </button>
              <button
                type="button"
                disabled={busy === i.id}
                onClick={() => void answer(i.id, true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy === i.id && <Loader2 size={15} className="animate-spin" />} Join team
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
