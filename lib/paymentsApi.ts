import api from "./api";

export type PaymentStatus = "pending" | "successful" | "failed" | "refund_pending" | "refunded";

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  gateway: string;
  transaction_id?: string | null;
  paid_at?: string | null;
  refunded_at?: string | null;
  failure_reason?: string | null;
}

export interface PaymentConfig {
  online: boolean;
  gateway: "razorpay" | "mock" | "disabled";
  test_mode: boolean;
  commission_percent: number;
}

export interface GatewayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
  gateway: "razorpay" | "mock";
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
}

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

let configPromise: Promise<PaymentConfig> | null = null;

export function getPaymentConfig() {
  configPromise ??= api
    .get<PaymentConfig & { success: boolean }>("/api/payment/config")
    .then((r) => r.data)
    .catch((e) => {
      configPromise = null;
      throw e;
    });
  return configPromise;
}

export async function startPayment(bookingId: number, method: "ONLINE" | "CASH") {
  const r = await api.post<{ payment: Payment; order: GatewayOrder | null }>("/api/payment/order", {
    booking_id: bookingId,
    method,
  });
  return r.data;
}

export async function verifyPayment(result: CheckoutResult) {
  const r = await api.post<{ payment: Payment; message: string }>("/api/payment/verify", result);
  return r.data;
}

export async function reportPaymentFailure(orderId: string, reason: string) {
  await api.post("/api/payment/failed", { razorpay_order_id: orderId, reason }).catch(() => {});
}

export async function mockCheckout(orderId: string, outcome: "success" | "failure") {
  const r = await api.post<CheckoutResult & { success: boolean; error?: { description: string } }>(
    "/api/payment/mock-checkout",
    { order_id: orderId, outcome }
  );
  return r.data;
}

export async function markCashCollected(bookingId: number) {
  const r = await api.put<{ payment: Payment; message: string }>(`/api/payment/booking/${bookingId}/cash-collected`);
  return r.data;
}

/* ---------------- Razorpay checkout.js loader ---------------- */

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (r: CheckoutResult) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Razorpay ka popup kholo. Resolve = success data, reject = cancel/fail. */
export async function openRazorpay(order: GatewayOrder): Promise<CheckoutResult> {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.id,
      prefill: order.prefill,
      theme: { color: "#E8692A" },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r?.error?.description || "Payment failed.")));
    rzp.open();
  });
}
