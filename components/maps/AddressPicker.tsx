"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { apiError } from "@/lib/api";
import { currentPosition, lastPoint, reversePlace, searchPlaces, type LatLng, type Place } from "@/lib/geoApi";
import { useT } from "@/lib/i18n";

// Leaflet sirf browser mein chalta hai
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />,
});

export type PickedLocation = { point: LatLng; place: Place | null };

/**
 * Address chunne ka widget: search, "meri location", map par pin (drag ya tap).
 * onChange har baar point + (mile to) address deta hai.
 */
export default function AddressPicker({
  value,
  onChange,
  mapClassName = "h-64",
}: {
  value: LatLng | null;
  onChange: (v: PickedLocation) => void;
  mapClassName?: string;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState("");
  const [recenter, setRecenter] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);
  // Suggestion chunne par input mein naam bharte hain - us par dobara search mat karo
  const skipNext = useRef(false);

  // Debounced search (server cache + rate limit ke saath)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchPlaces(term, value ?? lastPoint());
        if (id === reqId.current) {
          setResults(r);
          setOpen(true);
          setMsg(r.length ? "" : t("No match. Try area + city, or drop the pin on the map."));
        }
      } catch (e) {
        if (id === reqId.current) setMsg(t(apiError(e, "Address search failed. Drop the pin on the map instead.")));
      } finally {
        if (id === reqId.current) setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function pickPoint(p: LatLng, recenterMap = false) {
    onChange({ point: p, place: null });
    if (recenterMap) setRecenter((n) => n + 1);
    try {
      const place = await reversePlace(p);
      onChange({ point: p, place });
    } catch {
      /* address na mile to bhi point rakho */
    }
  }

  async function locateMe() {
    setLocating(true);
    setMsg("");
    try {
      const p = await currentPosition();
      await pickPoint({ lat: p.lat, lng: p.lng }, true);
      if (p.accuracy > 200) setMsg(t("Location is approximate. Drag the pin to your exact door."));
    } catch (e) {
      setMsg(t(e instanceof Error ? e.message : "Could not get your location."));
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <label className="relative block">
            <span className="sr-only">{t("Search your area")}</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value.trim().length < 3) {
                  setResults([]);
                  setOpen(false);
                }
              }}
              onFocus={() => results.length && setOpen(true)}
              placeholder={t("Search area, society or landmark")}
              role="combobox"
              aria-expanded={open}
              aria-controls="place-results"
              aria-autocomplete="list"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
            {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
          </label>
          {open && results.length > 0 && (
            <ul id="place-results" role="listbox" className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
              {results.map((r) => (
                <li key={`${r.latitude},${r.longitude}`} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      skipNext.current = true;
                      reqId.current++;
                      setQ(r.short);
                      onChange({ point: { lat: r.latitude, lng: r.longitude }, place: r });
                      setRecenter((n) => n + 1);
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-orange-600" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">{r.short}</span>
                      <span className="block truncate text-xs text-gray-500">{r.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => void locateMe()}
          disabled={locating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} className="text-blue-600" />}
          {t("Use my location")}
        </button>
      </div>

      <MapView
        className={mapClassName}
        center={value}
        zoom={value ? 16 : 5}
        recenterKey={recenter}
        markers={value ? [{ id: "home", kind: "home", lat: value.lat, lng: value.lng, draggable: true, label: t("Service address") }] : []}
        onPick={(p) => void pickPoint(p)}
        onDragEnd={(_, p) => void pickPoint(p)}
        ariaLabel={t("Map: tap to place the pin at your address")}
      />
      <p className="text-xs text-gray-500">
        {value ? t("Drag the pin or tap the map to set your exact door.") : t("Search, use your location, or tap the map to drop a pin.")}
      </p>
      {msg && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{msg}</p>}
    </div>
  );
}
