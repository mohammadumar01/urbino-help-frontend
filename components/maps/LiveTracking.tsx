"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Navigation, Phone, Radio } from "lucide-react";
import { getTracking, type Tracking } from "@/lib/geoApi";
import { useT } from "@/lib/i18n";
import type { MapMarker } from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />,
});

function ago(iso: string, t: (s: string, v?: Record<string, string | number>) => string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return t("{n}s ago", { n: s });
  return t("{n} min ago", { n: Math.round(s / 60) });
}

/**
 * Live map: ghar + professional ki location, doori aur ETA. Har 10 sec refresh.
 * Customer: sirf "on the way" ke dauraan. Provider: on the way + kaam ke dauraan.
 */
export default function LiveTracking({ bookingId, className = "h-56", showCall = true }: { bookingId: number; className?: string; showCall?: boolean }) {
  const t = useT();
  const [data, setData] = useState<Tracking | null>(null);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setData(await getTracking(bookingId));
    } catch {
      /* agla refresh try karega */
    }
  }, [bookingId]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      if (!document.hidden) void load();
      setTick((n) => n + 1);
    }, 10000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  if (!data) return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;

  const d = data.destination;
  const a = data.agent_location;
  const markers: MapMarker[] = [];
  if (d.latitude != null && d.longitude != null) markers.push({ id: "home", kind: "home", lat: d.latitude, lng: d.longitude, label: t("Service address") });
  if (a) markers.push({ id: "agent", kind: "agent", lat: a.latitude, lng: a.longitude, label: data.agent?.name ?? t("Professional"), radiusM: a.accuracy_m && a.accuracy_m > 50 ? a.accuracy_m : undefined });

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          {data.live && a ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-bold text-gray-950">
                <Radio size={15} className={a.stale ? "text-gray-400" : "animate-pulse text-blue-600"} />
                {data.arrived
                  ? t("{name} has arrived", { name: data.agent?.name ?? t("Professional") })
                  : data.eta_minutes != null
                    ? t("{name} is ~{min} min away", { name: data.agent?.name ?? t("Professional"), min: data.eta_minutes })
                    : t("{name} is on the way", { name: data.agent?.name ?? t("Professional") })}
              </p>
              <p className="text-xs text-gray-500">
                {data.distance_km != null && `${data.distance_km} km · `}
                {a.stale ? t("Last seen {when}", { when: ago(a.updated_at, t) }) : t("Live · updated {when}", { when: ago(a.updated_at, t) })}
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-sm font-bold text-gray-950">
                <Navigation size={15} className="text-blue-600" />
                {data.status === "on_the_way" ? t("Waiting for live location…") : t("Live location appears when the professional is on the way.")}
              </p>
              {data.status === "on_the_way" && <p className="text-xs text-gray-500">{t("The professional's phone shares it once they start driving.")}</p>}
            </>
          )}
        </div>
        {showCall && data.agent?.phone && (
          <a href={`tel:${data.agent.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50">
            <Phone size={14} /> {t("Call")}
          </a>
        )}
      </div>
      {markers.length > 0 ? (
        <MapView className={`${className} rounded-none border-0 border-t border-blue-100`} markers={markers} zoom={15} ariaLabel={t("Live tracking map")} />
      ) : (
        <p className="border-t border-blue-100 px-4 py-3 text-xs text-gray-500">{t("This booking has no map pin, so only the address is shown.")}</p>
      )}
    </div>
  );
}
