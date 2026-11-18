"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinOff, Radio } from "lucide-react";
import { agentApi } from "@/lib/agentApi";
import { shareAgentLocation } from "@/lib/geoApi";
import { useT } from "@/lib/i18n";

const SEND_EVERY_MS = 15000;

/**
 * Jab agent kisi job par "on the way" ya kaam par ho, phone ki GPS location
 * har 15 sec server ko bhejo (customer + provider live map par dekhte hain).
 * Koi aisi job na ho to GPS band - battery aur privacy dono bachte hain.
 * `refreshKey` badalne par (job ka status badla) turant dobara check karo.
 */
export default function LocationSharer({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useT();
  const [jobIds, setJobIds] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "waiting" | "live" | "denied" | "unsupported">("idle");
  const pos = useRef<GeolocationPosition | null>(null);
  const lastSent = useRef(0);
  const ids = useRef<number[]>([]);

  // Kaunsi jobs par location chahiye
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await agentApi.jobs("active", "");
        const live = r.jobs.filter((j) => j.status === "on_the_way" || j.status === "in_progress").map((j) => j.id);
        if (!cancelled) setJobIds((prev) => (prev.join() === live.join() ? prev : live));
      } catch {
        /* next time */
      }
    };
    void check();
    const timer = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshKey]);

  useEffect(() => {
    ids.current = jobIds;
  }, [jobIds]);

  const active = jobIds.length > 0;

  useEffect(() => {
    if (!active) {
      pos.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("idle");
      return;
    }
    if (!navigator.geolocation) {
      setState("unsupported");
      return;
    }
    setState("waiting");

    const send = async (force = false) => {
      const p = pos.current;
      if (!p) return;
      if (!force && Date.now() - lastSent.current < SEND_EVERY_MS - 500) return;
      lastSent.current = Date.now();
      const body = {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        heading: p.coords.heading,
      };
      await Promise.all(ids.current.map((id) => shareAgentLocation(id, body).catch(() => {})));
      setState("live");
    };

    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const first = !pos.current;
        pos.current = p;
        void send(first);
      },
      (e) => setState(e.code === e.PERMISSION_DENIED ? "denied" : "waiting"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    );
    // Agent ruka ho (position na badle) tab bhi har 15 sec "abhi yahin hoon" bhejo
    const timer = setInterval(() => void send(), SEND_EVERY_MS);
    return () => {
      navigator.geolocation.clearWatch(watch);
      clearInterval(timer);
    };
  }, [active]);

  if (!active || state === "idle") return null;

  if (state === "denied" || state === "unsupported") {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <MapPinOff size={18} className="mt-0.5 shrink-0" />
        <p>
          <b>{t("Location is off.")}</b> {t("Customers can't see you coming. Allow location for this site in your browser settings, then refresh.")}
        </p>
      </div>
    );
  }

  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <Radio size={18} className={state === "live" ? "animate-pulse text-blue-600" : "text-blue-400"} />
      <p>
        {state === "live" ? t("Sharing your live location with the customer.") : t("Getting your location…")}{" "}
        <span className="text-blue-700/80">{t("It stops automatically when the job is done.")}</span>
      </p>
    </div>
  );
}
