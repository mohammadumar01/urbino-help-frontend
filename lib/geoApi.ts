import api from "./api";

export type LatLng = { lat: number; lng: number };

export type Place = {
  label: string;
  short: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number;
  longitude: number;
};

export type Tracking = {
  booking_id: number;
  status: string;
  destination: { latitude: number | null; longitude: number | null; address: string };
  agent: { name: string; phone: string | null } | null;
  live: boolean;
  agent_location: { latitude: number; longitude: number; accuracy_m: number | null; heading: number | null; updated_at: string; stale: boolean } | null;
  distance_km: number | null;
  eta_minutes: number | null;
  arrived: boolean;
};

/** Default map center: India */
export const INDIA: LatLng = { lat: 22.9734, lng: 78.6569 };

const POINT_KEY = "urbino:lastPoint";

export async function searchPlaces(q: string, near?: LatLng | null) {
  const r = await api.get<{ results: Place[] }>("/api/geo/search", {
    params: { q, ...(near ? { lat: near.lat.toFixed(2), lng: near.lng.toFixed(2) } : {}) },
  });
  return r.data.results;
}

export async function reversePlace(p: LatLng) {
  const r = await api.get<{ place: Place | null }>("/api/geo/reverse", { params: { lat: p.lat, lng: p.lng } });
  return r.data.place;
}

export async function getTracking(bookingId: number) {
  const r = await api.get<{ tracking: Tracking }>(`/api/tracking/${bookingId}`);
  return r.data.tracking;
}

export async function shareAgentLocation(jobId: number, pos: { latitude: number; longitude: number; accuracy?: number; heading?: number | null }) {
  await api.post(`/api/agent/jobs/${jobId}/location`, pos);
}

/** Browser GPS (ek baar). Permission na mile to error message ke saath reject. */
export function currentPosition(): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) =>
        reject(
          new Error(
            e.code === e.PERMISSION_DENIED
              ? "Location permission is off. Allow it in the browser, or search your address."
              : "Could not get your location. Please search your address."
          )
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

export function rememberPoint(p: LatLng) {
  try {
    localStorage.setItem(POINT_KEY, JSON.stringify({ lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5) }));
  } catch {
    /* ignore */
  }
}

export function lastPoint(): LatLng | null {
  try {
    const v = JSON.parse(localStorage.getItem(POINT_KEY) || "null");
    return v && Number.isFinite(v.lat) && Number.isFinite(v.lng) ? v : null;
  } catch {
    return null;
  }
}

/** Google Maps directions link (agent ke liye "Navigate") */
export function directionsUrl(dest: { latitude?: number | null; longitude?: number | null; address: string }) {
  const d = dest.latitude != null && dest.longitude != null ? `${dest.latitude},${dest.longitude}` : dest.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}&travelmode=driving`;
}
