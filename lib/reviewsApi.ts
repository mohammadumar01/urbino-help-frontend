
import api from "./api";

export interface ProviderReview {
  id: number;
  booking_id: number;
  customer_id: number;
  customer_name: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderReviewsResponse {
  success: boolean;
  reviews: ProviderReview[];
}

export async function getProviderReviews(providerId: number) {
  const response = await api.get<ProviderReviewsResponse>(
    `/api/reviews/provider/${providerId}`
  );

  return response.data;
}
