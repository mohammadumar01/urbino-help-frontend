"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock3, Loader2, Phone, Send, UserPlus, X } from "lucide-react";
import ProviderShell, { btnPrimary, Card, inputCls, Notice } from "@/components/provider/ProviderShell";
import api, { apiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

type Member = {
  agent_id: number;
  agent_name: string;
  agent_email: string;
  agent_phone: string | null;
  verification_status: "pending" | "approved" | "rejected" | null;
  experience_years: number | null;
  active_jobs: number;
  completed_jobs: number;
};

type Invite = { id: number; agent_name: string; agent_email: string; agent_phone: string | null; created_at: string };

export default function ProviderTeamPage() {
  return (
    <ProviderShell title="Your team" subtitle="Invite professionals who work with you. They join after accepting.">
      <Team />
    </ProviderShell>
  );
}

function Team() {
  const t = useT();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ agents: Member[]; invites: Invite[] }>("/api/provider/agents");
      setMembers(r.data.agents);
      setInvites(r.data.invites || []);
    } catch (e) {
      setNotice({ tone: "error", text: apiError(e, "Could not load your team.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    const v = contact.trim();
    if (!v) return;
    setBusy(true);
    setNotice(null);
    try {
      const body = v.includes("@") ? { email: v } : { phone: v };
      const r = await api.post<{ message: string }>("/api/provider/agents", body);
      setNotice({ tone: "success", text: r.data.message });
      setContact("");
      await load();
    } catch (err) {
      setNotice({ tone: "error", text: apiError(err, "Could not send the invite.") });
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: number) {
    try {
      await api.delete(`/api/provider/agents/invites/${id}`);
      await load();
    } catch (e) {
      setNotice({ tone: "error", text: apiError(e, "Could not cancel the invite.") });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

        <Card className="p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-950">{t("Team members")} ({members.length})</h2>
          </div>
          {loading ? (
            <p className="flex items-center gap-2 px-6 py-8 text-sm text-gray-500">
              <Loader2 size={15} className="animate-spin" /> {t("Loading…")}
            </p>
          ) : members.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">{t("No one in your team yet. Invite your first professional.")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {members.map((m) => (
                <li key={m.agent_id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">{m.agent_name[0]}</span>
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-gray-950">
                        {m.agent_name}
                        {m.verification_status === "approved" && <BadgeCheck size={16} className="text-blue-600" aria-label="Documents verified" />}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t(m.verification_status === "approved" ? "Documents verified" : m.verification_status === "pending" ? "Documents under review" : "Documents not uploaded")}
                        {m.experience_years != null ? ` · ${m.experience_years} yrs` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <b className="text-gray-950">{m.active_jobs}</b> {t("active")} · <b className="text-gray-950">{m.completed_jobs}</b> {t("done")}
                    </span>
                    {m.agent_phone && (
                      <a href={`tel:${m.agent_phone}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700">
                        <Phone size={13} /> {t("Call")}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {invites.length > 0 && (
          <Card className="p-0">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-950">{t("Waiting to accept")} ({invites.length})</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{i.agent_name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock3 size={12} /> {t("Invite sent")} · {i.agent_email}
                    </p>
                  </div>
                  <button type="button" onClick={() => void cancel(i.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100">
                    <X size={13} /> {t("Cancel")}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card className="h-fit">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
          <UserPlus size={19} /> {t("Invite a professional")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("They need an Urbino professional account. Ask them to sign up with \"I work as a pro\", then invite them here.")}
        </p>
        <form onSubmit={invite} className="mt-4 space-y-3">
          <label htmlFor="contact" className="block text-sm font-semibold text-gray-800">
            {t("Email or phone")}
          </label>
          <input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="ravi@example.com or 98765 43210" className={inputCls} />
          <button type="submit" disabled={busy || !contact.trim()} className={btnPrimary + " w-full"}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t("Send invite")}
          </button>
        </form>
      </Card>
    </div>
  );
}
