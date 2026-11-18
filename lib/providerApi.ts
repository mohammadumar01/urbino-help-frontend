import api from "./api";

export interface ProviderProfile {
  provider_id: number;
  name?: string;
  email?: string;
  phone?: string;
  bio: string | null;
  experience_years: number | null;
  skills: string | null;
  service_area: string | null;
  hourly_rate: string | number | null;
  profile_image: string | null;
  is_verified: boolean;
  latitude?: string | number | null;
  longitude?: string | number | null;
  service_radius_km?: number | null;
}

export interface OnboardingStep {
  key: "profile" | "services" | "availability" | "documents" | "agents";
  label: string;
  done: boolean;
  optional?: boolean;
  status?: "approved" | "pending" | "rejected" | "missing";
}

export interface Onboarding {
  verified: boolean;
  completed: number;
  total: number;
  visible_to_customers: boolean;
  steps: OnboardingStep[];
}

export interface MyService {
  id: number;
  service_id: number;
  service_name: string;
  category_name: string;
  description: string | null;
  base_price: string | number | null;
  price: string | number;
  is_active: boolean;
}

export interface CatalogService {
  id: number;
  name: string;
  category_name: string;
  base_price: string | number | null;
}

export interface TimeRange {
  id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface MyDocument {
  id: number;
  document_type: string;
  document_number: string | null;
  file_name: string | null;
  has_file: boolean;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const providerApi = {
  onboarding: () => api.get<Onboarding>("/api/provider-profile/onboarding").then((r) => r.data),

  getProfile: () => api.get<{ profile: ProviderProfile | null }>("/api/provider-profile/profile").then((r) => r.data.profile),
  saveProfile: (p: Partial<ProviderProfile>) =>
    api.put<{ profile: ProviderProfile }>("/api/provider-profile/profile", p).then((r) => r.data.profile),

  myServices: () => api.get<{ services: MyService[] }>("/api/provider-services").then((r) => r.data.services),
  catalog: () =>
    api.get<{ services: CatalogService[] }>("/api/services", { params: { limit: 100 } }).then((r) => r.data.services),
  addService: (service_id: number, price?: number) =>
    api.post("/api/provider-services", { service_id, price }).then((r) => r.data),
  updateService: (service_id: number, patch: { price?: number; is_active?: boolean }) =>
    api.put(`/api/provider-services/${service_id}`, patch).then((r) => r.data),
  removeService: (service_id: number) => api.delete(`/api/provider-services/${service_id}`).then((r) => r.data),

  myHours: () => api.get<{ availability: TimeRange[] }>("/api/provider-availability").then((r) => r.data.availability),
  saveHours: (schedule: TimeRange[]) =>
    api.put<{ availability: TimeRange[] }>("/api/provider-availability", { schedule }).then((r) => r.data.availability),

  myDocuments: () =>
    api.get<{ verification: MyDocument[]; document_types: string[] }>("/api/provider-verification").then((r) => r.data),
  uploadDocument: (form: FormData) =>
    api
      .post("/api/provider-verification", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      .then((r) => r.data),
  documentFile: (id: number) =>
    api.get<Blob>(`/api/provider-verification/${id}/file`, { responseType: "blob" }).then((r) => r.data),
};

export function getSlots(providerId: number, date: string) {
  return api
    .get<{ has_schedule: boolean; slots: string[] }>("/api/provider-availability/slots", {
      params: { provider_id: providerId, date },
    })
    .then((r) => r.data);
}
