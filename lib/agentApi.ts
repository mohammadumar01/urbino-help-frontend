import api from "./api";
import type { PaymentStatus } from "./paymentsApi";

export type JobStatus = "agent_assigned" | "agent_accepted" | "on_the_way" | "in_progress" | "completed" | "cancelled";

export interface AgentJob {
  id: number;
  status: JobStatus;
  service_name: string;
  address: string;
  booking_date: string;
  booking_time: string;
  price: string | number | null;
  customer_name: string;
  customer_phone: string | null;
  provider_name: string | null;
  provider_phone: string | null;
  agent_assigned_at: string | null;
  agent_accepted_at: string | null;
  on_the_way_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  payment_status: PaymentStatus | null;
  payment_method: string | null;
}

export interface AgentSummary {
  new: number;
  active: number;
  completed: number;
  completed_today: number;
  today: number;
  rating: number | null;
}

export type JobGroup = "new" | "active" | "done";

export const agentApi = {
  summary: () => api.get<{ summary: AgentSummary }>("/api/agent/summary").then((r) => r.data.summary),
  jobs: (group: JobGroup, search = "") =>
    api
      .get<{ jobs: AgentJob[]; total: number }>("/api/agent/jobs", { params: { group, search, limit: 50 } })
      .then((r) => r.data),
  accept: (id: number) => api.put<{ job: AgentJob; message: string }>(`/api/agent/accept/${id}`).then((r) => r.data),
  onTheWay: (id: number) => api.put<{ job: AgentJob; message: string }>(`/api/agent/on-the-way/${id}`).then((r) => r.data),
  start: (id: number, otp: string) =>
    api.put<{ job: AgentJob; message: string }>(`/api/agent/start/${id}`, { otp }).then((r) => r.data),
  complete: (id: number) => api.put<{ job: AgentJob; message: string }>(`/api/agent/complete/${id}`).then((r) => r.data),
  decline: (id: number, reason: string) =>
    api.put<{ message: string }>(`/api/agent/decline/${id}`, { reason }).then((r) => r.data),
};
