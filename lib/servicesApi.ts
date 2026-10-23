import api from "./api";

export interface Service {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  base_price: string;
  created_at: string;
}

export interface ServicesResponse {
  success: boolean;
  currentPage: number;
  limit: number;
  totalServices: number;
  totalPages: number;
  services: Service[];
}

export interface ServiceResponse {
  success: boolean;
  service: Service;
}

export async function getServices(params?: {
  search?: string;
  category_id?: number;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ServicesResponse>(
    "/api/services",
    {
      params,
    }
  );

  return response.data;
}

export async function getServiceById(id: number) {
  const response = await api.get<ServiceResponse>(
    `/api/services/${id}`
  );

  return response.data;
}