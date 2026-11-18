"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { LatLng } from "@/lib/geoApi";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: "home" | "agent" | "provider";
  label?: string;
  /** Sirf ek marker draggable ho (address pin) */
  draggable?: boolean;
  /** Meter mein: GPS accuracy / service radius circle */
  radiusM?: number;
};

const COLORS = { home: "#ea580c", agent: "#2563eb", provider: "#0f172a" };
const ICONS = {
  // ghar
  home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="#fff"/>',
  // scooter/person
  agent: '<circle cx="12" cy="7" r="3" fill="#fff"/><path d="M6 20a6 6 0 0 1 12 0z" fill="#fff"/>',
  provider: '<path d="M4 8h16v11H4zM9 8V5h6v3" stroke="#fff" stroke-width="2" fill="none"/>',
};

function pinHtml(kind: MapMarker["kind"]) {
  const c = COLORS[kind];
  const pulse = kind === "agent" ? `<span class="urb-pulse" style="background:${c}"></span>` : "";
  return `<div class="urb-pin">${pulse}<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <path d="M17 43C17 43 32 27.5 32 17A15 15 0 0 0 2 17C2 27.5 17 43 17 43Z" fill="${c}" stroke="#fff" stroke-width="2"/>
    <g transform="translate(5 5)">${ICONS[kind]}</g></svg></div>`;
}

/**
 * Halka map (Leaflet + OpenStreetMap tiles, koi API key nahi).
 * Markers badalne par map khud fit ho jaata hai (jab tak user ne zoom na kiya ho).
 */
export default function MapView({
  center,
  zoom = 14,
  markers = [],
  onPick,
  onDragEnd,
  className = "h-72",
  ariaLabel = "Map",
  recenterKey,
}: {
  center?: LatLng | null;
  zoom?: number;
  markers?: MapMarker[];
  /** Map par tap -> naya point */
  onPick?: (p: LatLng) => void;
  onDragEnd?: (id: string, p: LatLng) => void;
  className?: string;
  ariaLabel?: string;
  /** Yeh badle to map dobara markers par fit ho (jaise search se naya address chuna) */
  recenterKey?: string | number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const userMoved = useRef(false);
  const cb = useRef({ onPick, onDragEnd });
  // Har render ki latest values (async init aur draw dono yahin se padhte hain)
  const latest = useRef({ markers, center, zoom });
  useEffect(() => {
    cb.current = { onPick, onDragEnd };
    latest.current = { markers, center, zoom };
  });

  // Map ek baar banao
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const { center: c0, markers: m0, zoom: z0 } = latest.current;
      const start = c0 ?? m0[0] ?? { lat: 22.9734, lng: 78.6569 };
      const map = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(
        [start.lat, start.lng],
        c0 || m0.length ? z0 : 5
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => cb.current.onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      // User ne khud map ghumaya/zoom kiya to auto-fit band (uski view mat chheeno)
      const markMoved = () => (userMoved.current = true);
      map.getContainer().addEventListener("pointerdown", markMoved);
      map.getContainer().addEventListener("wheel", markMoved, { passive: true });
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function draw() {
    const { markers, center, zoom } = latest.current;
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const pts: Leaflet.LatLngExpression[] = [];
    for (const m of markers) {
      const icon = L.divIcon({ html: pinHtml(m.kind), className: "", iconSize: [34, 44], iconAnchor: [17, 43] });
      const mk = L.marker([m.lat, m.lng], { icon, draggable: !!m.draggable, keyboard: true, title: m.label || m.kind, alt: m.label || m.kind });
      if (m.label) mk.bindTooltip(m.label, { direction: "top", offset: [0, -40] });
      if (m.draggable) mk.on("dragend", () => {
        const p = mk.getLatLng();
        cb.current.onDragEnd?.(m.id, { lat: p.lat, lng: p.lng });
      });
      mk.addTo(layer);
      if (m.radiusM) L.circle([m.lat, m.lng], { radius: m.radiusM, color: COLORS[m.kind], weight: 1, fillOpacity: 0.08 }).addTo(layer);
      pts.push([m.lat, m.lng]);
    }
    if (userMoved.current) return;
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16 });
    else if (pts.length === 1) map.setView(pts[0], Math.max(map.getZoom(), zoom));
    else if (center) map.setView([center.lat, center.lng], zoom);
  }

  // Markers badle -> dobara banao (latest ref pehle wale effect mein update ho chuka)
  useEffect(() => {
    latest.current = { markers, center, zoom };
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), center?.lat, center?.lng]);

  useEffect(() => {
    if (recenterKey === undefined) return;
    userMoved.current = false;
    draw();
  }, [recenterKey]);

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${className}`}>
      <div ref={el} role="application" aria-label={ariaLabel} className="h-full w-full" />
      <style>{`
        .urb-pin{position:relative;width:34px;height:44px;filter:drop-shadow(0 4px 6px rgb(0 0 0 / .25))}
        .urb-pulse{position:absolute;left:5px;top:3px;width:24px;height:24px;border-radius:9999px;opacity:.35;animation:urbPulse 1.8s ease-out infinite}
        @keyframes urbPulse{0%{transform:scale(.8);opacity:.45}100%{transform:scale(2.4);opacity:0}}
        @media (prefers-reduced-motion: reduce){.urb-pulse{animation:none}}
        .leaflet-container{font:inherit}
      `}</style>
    </div>
  );
}
