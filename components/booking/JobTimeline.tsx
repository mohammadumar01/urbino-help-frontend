import { Check } from "lucide-react";

/**
 * Booking ki progress: customer, provider aur agent teeno ek hi tarah dekhte hain.
 * Har step ke saath uska time (agar ho chuka hai).
 */
export type TimelineBooking = {
  status?: string | null;
  created_at?: string | null;
  provider_accepted_at?: string | null;
  agent_accepted_at?: string | null;
  on_the_way_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

const ORDER = ["pending", "provider_accepted", "agent_assigned", "agent_accepted", "on_the_way", "in_progress", "completed"];

const STEPS: { key: string; label: string; reachedAt: string; time: keyof TimelineBooking }[] = [
  { key: "booked", label: "Booked", reachedAt: "pending", time: "created_at" },
  { key: "confirmed", label: "Confirmed", reachedAt: "provider_accepted", time: "provider_accepted_at" },
  { key: "assigned", label: "Pro assigned", reachedAt: "agent_accepted", time: "agent_accepted_at" },
  { key: "otw", label: "On the way", reachedAt: "on_the_way", time: "on_the_way_at" },
  { key: "started", label: "Started", reachedAt: "in_progress", time: "started_at" },
  { key: "done", label: "Done", reachedAt: "completed", time: "completed_at" },
];

function timeOf(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function JobTimeline({ booking, compact = false }: { booking: TimelineBooking; compact?: boolean }) {
  const status = booking.status || "pending";
  if (status === "cancelled") {
    return <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600">This booking was cancelled.</p>;
  }
  const idx = ORDER.indexOf(status);

  return (
    <ol className="flex w-full items-start" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const done = idx >= ORDER.indexOf(s.reachedAt);
        const nextUp = !done && (i === 0 || idx >= ORDER.indexOf(STEPS[i - 1].reachedAt));
        const t = timeOf(booking[s.time] as string | null | undefined);
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-3 -z-0 h-0.5 w-full ${done ? "bg-emerald-500" : "bg-gray-200"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : nextUp
                    ? "border-2 border-orange-500 bg-white text-orange-600"
                    : "border-2 border-gray-200 bg-white text-gray-400"
              }`}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`mt-1.5 text-[11px] font-semibold leading-tight ${done ? "text-gray-900" : nextUp ? "text-orange-700" : "text-gray-400"}`}>
              {s.label}
            </span>
            {!compact && t && done && <span className="text-[10px] text-gray-500">{t}</span>}
          </li>
        );
      })}
    </ol>
  );
}
