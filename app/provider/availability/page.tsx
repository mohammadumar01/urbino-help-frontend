"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Plus, X } from "lucide-react";
import ProviderShell, { btnPrimary, btnSecondary, Card, Notice } from "@/components/provider/ProviderShell";
import { apiError } from "@/lib/api";
import { DAYS, providerApi, type TimeRange } from "@/lib/providerApi";

type Day = (typeof DAYS)[number];
type Range = { start_time: string; end_time: string };
type Week = Record<Day, Range[]>;

const emptyWeek = (): Week => Object.fromEntries(DAYS.map((d) => [d, [] as Range[]])) as unknown as Week;

function toWeek(rows: TimeRange[]): Week {
  const w = emptyWeek();
  for (const r of rows) {
    if ((DAYS as readonly string[]).includes(r.day_of_week)) {
      w[r.day_of_week as Day].push({ start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5) });
    }
  }
  return w;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Browser mein hi galti pakdo (backend bhi check karta hai). */
function problemsOf(week: Week): Partial<Record<Day, string>> {
  const out: Partial<Record<Day, string>> = {};
  for (const d of DAYS) {
    const list = [...week[d]].sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!r.start_time || !r.end_time) out[d] = "Enter both times";
      else if (toMin(r.end_time) - toMin(r.start_time) < 60) out[d] = "Each range must be at least 1 hour";
      else if (i > 0 && toMin(r.start_time) < toMin(list[i - 1].end_time)) out[d] = "Time ranges overlap";
    }
  }
  return out;
}

export default function ProviderAvailabilityPage() {
  return (
    <ProviderShell title="Working hours" subtitle="Customers can only book 1-hour slots inside these hours.">
      <WeekEditor />
    </ProviderShell>
  );
}

function WeekEditor() {
  const [week, setWeek] = useState<Week>(emptyWeek);
  const [saved, setSaved] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    providerApi
      .myHours()
      .then((rows) => {
        const w = toWeek(rows);
        setWeek(w);
        setSaved(JSON.stringify(w));
      })
      .catch((e) => setError(apiError(e, "Could not load your working hours.")))
      .finally(() => setLoading(false));
  }, []);

  const problems = useMemo(() => problemsOf(week), [week]);
  const dirty = JSON.stringify(week) !== saved;
  const hasProblems = Object.keys(problems).length > 0;

  function update(day: Day, fn: (list: Range[]) => Range[]) {
    setNotice("");
    setWeek((w) => ({ ...w, [day]: fn(w[day]) }));
  }

  function copyToAll(day: Day) {
    setNotice("");
    setWeek((w) => {
      const n = { ...w };
      for (const d of DAYS) if (d !== day && n[d].length > 0) n[d] = w[day].map((r) => ({ ...r }));
      return n;
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const schedule = DAYS.flatMap((d) => week[d].map((r) => ({ day_of_week: d, ...r })));
      const rows = await providerApi.saveHours(schedule);
      const w = toWeek(rows);
      setWeek(w);
      setSaved(JSON.stringify(w));
      setNotice(schedule.length ? "Working hours saved." : "Working hours cleared. Customers can pick any time.");
    } catch (e) {
      setError(apiError(e, "Could not save working hours."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      <Card className="p-0">
        <ul className="divide-y divide-gray-100">
          {DAYS.map((day) => {
            const list = week[day];
            const on = list.length > 0;
            return (
              <li key={day} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <label className="flex w-40 shrink-0 cursor-pointer items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    aria-label={`Open on ${day}`}
                    checked={on}
                    onChange={(e) => update(day, () => (e.target.checked ? [{ start_time: "10:00", end_time: "18:00" }] : []))}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className={`text-sm font-semibold ${on ? "text-gray-950" : "text-gray-400"}`}>{day}</span>
                </label>

                <div className="flex-1 space-y-2">
                  {!on && <p className="pt-2 text-sm text-gray-400">Closed</p>}
                  {list.map((r, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        step={1800}
                        aria-label={`${day} start ${i + 1}`}
                        value={r.start_time}
                        onChange={(e) => update(day, (l) => l.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                      <span className="text-sm text-gray-400">to</span>
                      <input
                        type="time"
                        step={1800}
                        aria-label={`${day} end ${i + 1}`}
                        value={r.end_time}
                        onChange={(e) => update(day, (l) => l.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)))}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${day} range ${i + 1}`}
                        onClick={() => update(day, (l) => l.filter((_, j) => j !== i))}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {problems[day] && <p className="text-xs font-medium text-rose-600">{problems[day]}</p>}
                </div>

                {on && (
                  <div className="flex gap-2 sm:pt-1">
                    {list.length < 3 && (
                      <button
                        type="button"
                        onClick={() =>
                          update(day, (l) => {
                            const last = l[l.length - 1];
                            const start = last ? last.end_time : "10:00";
                            const endMin = Math.min(toMin(start) + 120, 23 * 60 + 30);
                            const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
                            return [...l, { start_time: start, end_time: end }];
                          })
                        }
                        className={btnSecondary + " px-3 py-2 text-xs"}
                      >
                        <Plus size={14} /> Add break/shift
                      </button>
                    )}
                    <button type="button" onClick={() => copyToAll(day)} className={btnSecondary + " px-3 py-2 text-xs"} title="Copy these hours to all open days">
                      <Copy size={14} /> Copy to open days
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
        <p className="text-sm text-gray-500">
          {hasProblems ? "Fix the highlighted days to save." : dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <button type="button" onClick={save} disabled={saving || !dirty || hasProblems} className={btnPrimary}>
          {saving && <Loader2 size={16} className="animate-spin" />} Save hours
        </button>
      </div>
    </div>
  );
}
