"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Headset, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import UrbinoLogo from "@/components/brand/UrbinoLogo";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = ["How do I reschedule?", "Where is my professional?", "Refund kab aayega?", "How does the start code work?"];
const STORE_KEY = "urbino:helpchat";

/** Har page par neeche-daayein "Help" button: AI assistant + insaan se baat. */
export default function HelpChat() {
  const pathname = usePathname();
  const user = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "human" | "sent">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestHuman, setSuggestHuman] = useState(false);
  const [ticketMsg, setTicketMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("booking");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Baatcheet tab band karne par bhi yaad rahe (sirf is browser tab mein)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setMsgs(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-20)));
    } catch {
      /* ignore */
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, open]);

  // Admin aur agent app mein nahi (unke liye alag tools hain)
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setError("");
    const history = msgs.slice(-10);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setBusy(true);
    try {
      const r = await api.post<{ reply: string; handoff: boolean }>("/api/chatbot/message", { message, history });
      setMsgs((m) => [...m, { role: "assistant", content: r.data.reply }]);
      if (r.data.handoff) setSuggestHuman(true);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, I couldn't answer that right now. You can talk to a person instead." }]);
      setSuggestHuman(true);
      setError(apiError(e, ""));
    } finally {
      setBusy(false);
    }
  }

  function openHuman() {
    const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.content || "";
    setTicketMsg(lastUser);
    setMode("human");
  }

  async function submitTicket(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ message: string }>("/api/support/tickets", {
        message: ticketMsg,
        category,
        phone: user ? undefined : phone,
        transcript: msgs.slice(-20),
      });
      setNotice(r.data.message);
      setMode("sent");
    } catch (err) {
      setError(apiError(err, "Could not send your request."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-gray-800"
          aria-label="Open help chat"
        >
          <MessageCircle size={18} /> Help
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Urbino help"
          className="fixed inset-x-0 bottom-0 z-[60] flex h-[85vh] flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[380px] sm:rounded-3xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-white p-0.5">
                <UrbinoLogo className="h-8 w-8" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Urbino Help</p>
                <p className="flex items-center gap-1 text-xs text-gray-300">
                  <Sparkles size={11} /> Assistant · people on standby
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close help" className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </header>

          {mode === "chat" && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4" aria-live="polite">
                <Bubble role="assistant">
                  Namaste{user?.name ? ` ${user.name.split(" ")[0]}` : ""}! I can help with bookings, payments, refunds and your start code. Ask in Hindi or English.
                </Bubble>
                {msgs.length === 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {msgs.map((m, i) => (
                  <Bubble key={i} role={m.role}>
                    {m.content}
                  </Bubble>
                ))}
                {busy && (
                  <Bubble role="assistant">
                    <Loader2 size={14} className="animate-spin" />
                  </Bubble>
                )}
                {suggestHuman && (
                  <button
                    type="button"
                    onClick={openHuman}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-800 hover:bg-orange-100"
                  >
                    <Headset size={16} /> Talk to a person
                  </button>
                )}
                <div ref={endRef} />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-center gap-2 border-t border-gray-100 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question"
                  aria-label="Your message"
                  maxLength={1000}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="rounded-xl bg-gray-950 p-2.5 text-white disabled:opacity-40">
                  <Send size={17} />
                </button>
              </form>
              {!suggestHuman && (
                <button type="button" onClick={openHuman} className="border-t border-gray-100 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900">
                  Prefer a person? Request a call back
                </button>
              )}
            </>
          )}

          {mode === "human" && (
            <form onSubmit={submitTicket} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div>
                <h3 className="font-bold text-gray-950">Talk to our team</h3>
                <p className="mt-1 text-sm text-gray-500">A real person will call you within 2 hours (9 AM – 9 PM).</p>
              </div>
              <label className="text-sm font-semibold text-gray-800">
                Topic
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-900">
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="professional">Professional / service quality</option>
                  <option value="safety">Safety concern</option>
                  <option value="account">My account</option>
                  <option value="other">Something else</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-800">
                What happened?
                <textarea
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  placeholder="Booking number and the problem"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900"
                />
              </label>
              {!user && (
                <label className="text-sm font-semibold text-gray-800">
                  Phone number
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    required
                    placeholder="10-digit mobile"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal text-gray-900"
                  />
                </label>
              )}
              {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <div className="mt-auto flex gap-2">
                <button type="button" onClick={() => setMode("chat")} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">
                  Back
                </button>
                <button type="submit" disabled={busy || ticketMsg.trim().length < 5} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {busy && <Loader2 size={16} className="animate-spin" />} Request call back
                </button>
              </div>
            </form>
          )}

          {mode === "sent" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Headset size={22} />
              </span>
              <p className="font-semibold text-gray-950">We&apos;ve got it</p>
              <p className="text-sm text-gray-600">{notice}</p>
              <button type="button" onClick={() => { setMode("chat"); setSuggestHuman(false); }} className="mt-2 text-sm font-semibold text-gray-700 underline">
                Back to chat
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
          role === "user" ? "rounded-br-md bg-gray-950 text-white" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
