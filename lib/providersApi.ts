import api from "./api";

export interface Provider {
  provider_id: number;
  provider_name: string;
  service_id: number;
  service_name: string;
  price: string;
  service_area: string;
  experience_years: number;
  profile_image: string;
  is_verified: boolean;
  average_rating: string;
  total_reviews: string;
  /** Customer ki location bheji ho tab */
  distance_km?: number | null;
  in_range?: boolean | null;
  service_radius_km?: number | null;
}

export interface ProvidersResponse {
  success: boolean;
  totalProviders: number;
  providers: Provider[];
}

export async function getProvidersByService(
  serviceId: number,
  serviceArea?: string
) {
  const response = await api.get<ProvidersResponse>(
    "/api/service-discovery/providers",
    {
      params: {
        service_id: serviceId,
        ...(serviceArea ? { service_area: serviceArea } : {}),
      },
    }
  );

  return response.data;
}