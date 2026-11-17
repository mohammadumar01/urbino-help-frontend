"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Loader2, RotateCcw, ShieldCheck, X } from "lucide-react";
import { apiError } from "@/lib/api";
import {
  getPaymentConfig,
  markCashCollected,
  mockCheckout,
  openRazorpay,
  reportPaymentFailure,
  startPayment,
  verifyPayment,
  type GatewayOrder,
  type PaymentConfig,
  type PaymentStatus,
} from "@/lib/paymentsApi";

const NOT_PAYABLE = ["cancelled"];

export function PaymentBadge({ status, method }: { status?: PaymentStatus | null; method?: string | null }) {
  if (!status) return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Unpaid</span>;
  const cash = (method || "").toUpperCase() === "CASH";
  const map: Record<PaymentStatus, [string, string]> = {
    successful: ["Paid", "bg-emerald-50 text-emerald-700"],
    pending: [cash ? "Cash on service" : "Payment pending", cash ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"],
    failed: ["Payment failed", "bg-rose-50 text-rose-700"],
    refund_pending: ["Refund in progress", "bg-violet-50 text-violet-700"],
    refunded: ["Refunded", "bg-violet-50 text-violet-700"],
  };
  const [label, cls] = map[status] ?? ["Unpaid", "bg-gray-100 text-gray-600"];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

/** Razorpay keys na hon (development) tab ka test checkout. */
function TestCheckout({
  order,
  onDone,
  onClose,
}: {
  order: GatewayOrder;
  onDone: (outcome: "success" | "failure") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-4" role="dialog" aria-modal="true" aria-label="Test payment">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Test mode</p>
            <h3 className="mt-1 text-lg font-bold text-gray-950">{order.name}</h3>
            <p className="text-sm text-gray-500">{order.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <p className="mt-5 text-3xl font-bold text-gray-950">₹{(order.amount / 100).toLocaleString("en-IN")}</p>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Razorpay keys are not set, so no real money moves. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend to use real checkout.
        </p>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => onDone("success")} className="rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800">
            Pay (test success)
          </button>
          <button type="button" onClick={() => onDone("failure")} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Simulate failed payment
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer ke liye: "Pay online" / "Pay cash after service".
 * onChange = payment status badla, list refresh karo.
 */
export default function PaymentActions({
  bookingId,
  bookingStatus,
  amount,
  paymentStatus: paymentStatusProp,
  paymentMethod: paymentMethodProp,
  onChange,
}: {
  bookingId: number;
  bookingStatus?: string;
  amount?: number | string | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: string | null;
  onChange?: () => void;
}) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [busy, setBusy] = useState<"" | "online" | "cash">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [testOrder, setTestOrder] = useState<GatewayOrder | null>(null);
  // Parent refresh na kare tab bhi turant sahi state dikhe
  const [local, setLocal] = useState<{ status: PaymentStatus; method: string } | null>(null);
  const paymentStatus = local?.status ?? paymentStatusProp;
  const paymentMethod = local?.method ?? paymentMethodProp;

  useEffect(() => {
    getPaymentConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  const status = (bookingStatus || "").toLowerCase();
  const isCashChosen = paymentStatus === "pending" && (paymentMethod || "").toUpperCase() === "CASH";

  if (paymentStatus === "successful") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={17} /> Paid{amount != null ? ` ₹${Number(amount).toLocaleString("en-IN")}` : ""}
      </p>
    );
  }
  if (paymentStatus === "refunded" || paymentStatus === "refund_pending") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-violet-700">
        <RotateCcw size={16} /> {paymentStatus === "refunded" ? "Payment refunded" : "Refund in progress (5-7 working days)"}
      </p>
    );
  }
  if (NOT_PAYABLE.includes(status) || amount == null) return null;

  async function finishOnline(orderId: string, run: () => Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }>) {
    try {
      const result = await run();
      await verifyPayment(result);
      setLocal({ status: "successful", method: "ONLINE" });
      setMessage("Payment successful. Thank you!");
      onChange?.();
    } catch (e) {
      const msg = e instanceof Error && !("response" in e) ? e.message : apiError(e, "Payment failed.");
      await reportPaymentFailure(orderId, msg);
      setError(msg);
      onChange?.();
    } finally {
      setBusy("");
    }
  }

  async function payOnline() {
    setError("");
    setMessage("");
    setBusy("online");
    try {
      const { order } = await startPayment(bookingId, "ONLINE");
      if (!order) throw new Error("Could not start payment.");
      if (order.gateway === "mock") {
        setTestOrder(order); // busy rehta hai jab tak test window band na ho
        return;
      }
      await finishOnline(order.id, () => openRazorpay(order));
    } catch (e) {
      setError(apiError(e, "Could not start payment."));
      setBusy("");
    }
  }

  async function onTestDone(outcome: "success" | "failure") {
    const order = testOrder!;
    setTestOrder(null);
    await finishOnline(order.id, async () => {
      const r = await mockCheckout(order.id, outcome);
      if (!r.success) throw new Error(r.error?.description || "Payment failed.");
      return r;
    });
  }

  async function chooseCash() {
    setError("");
    setMessage("");
    setBusy("cash");
    try {
      await startPayment(bookingId, "CASH");
      setLocal({ status: "pending", method: "CASH" });
      setMessage("Okay! Pay in cash to the professional after the service.");
      onChange?.();
    } catch (e) {
      setError(apiError(e, "Could not save your choice."));
    } finally {
      setBusy("");
    }
  }

  const online = config?.online !== false;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {online && (
          <button
            type="button"
            onClick={payOnline}
            disabled={!!busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {busy === "online" ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
            Pay ₹{Number(amount).toLocaleString("en-IN")} online
          </button>
        )}
        {!isCashChosen && (
          <button
            type="button"
            onClick={chooseCash}
            disabled={!!busy}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {busy === "cash" ? <Loader2 size={17} className="animate-spin" /> : <Banknote size={17} />}
            Pay cash after service
          </button>
        )}
      </div>
      {isCashChosen && !message && (
        <p className="text-xs text-gray-500">You chose cash. You can still pay online any time before the service.</p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck size={13} /> UPI, cards and wallets via Razorpay{config?.test_mode ? " (test mode)" : ""}
      </p>
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {testOrder && (
        <TestCheckout
          order={testOrder}
          onDone={onTestDone}
          onClose={() => {
            void reportPaymentFailure(testOrder.id, "Payment was cancelled");
            setTestOrder(null);
            setBusy("");
          }}
        />
      )}
    </div>
  );
}

/** Provider / agent: payment ka haal + "Cash received" button. */
export function CashCollect({
  bookingId,
  bookingStatus,
  amount,
  paymentStatus,
  paymentMethod,
  onChange,
}: {
  bookingId: number;
  bookingStatus?: string;
  amount?: number | string | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: string | null;
  onChange?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const status = (bookingStatus || "").toLowerCase();
  const paid = done || paymentStatus === "successful";
  const canCollect = !paid && (status === "in_progress" || status === "completed") && amount != null;

  async function collect() {
    if (!window.confirm(`Confirm you received ₹${Number(amount).toLocaleString("en-IN")} in cash for booking #${bookingId}?`)) return;
    setBusy(true);
    setError("");
    try {
      await markCashCollected(bookingId);
      setDone(true);
      onChange?.();
    } catch (e) {
      setError(apiError(e, "Could not record the payment."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-gray-600">
          Amount{amount != null ? `: ₹${Number(amount).toLocaleString("en-IN")}` : ""}
        </span>
        <PaymentBadge status={done ? "successful" : paymentStatus} method={done ? "CASH" : paymentMethod} />
      </div>
      {canCollect && (
        <button
          type="button"
          onClick={collect}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
          Cash received
        </button>
      )}
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
