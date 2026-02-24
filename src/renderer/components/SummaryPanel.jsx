import { useMemo } from "react";
import { SLOT } from "../domain/tasks";
import { monthNameIT } from "../utils/date";

export function SummaryPanel({ year, monthIndex0, data }) {
  const totals = useMemo(() => {
    const byClient = new Map();
    let internal = 0;
    let vacation = 0;
    let event = 0;

    const byDate = data?.byDate || {};
    for (const dateKey of Object.keys(byDate)) {
      const day = byDate[dateKey];
      for (const s of [SLOT.AM, SLOT.PM]) {
        const e = day?.[s];
        if (!e) continue;
        const weight = 0.5;
        if (e.type === "client") {
          const c = (e.client || "(senza nome)").trim() || "(senza nome)";
          byClient.set(c, (byClient.get(c) || 0) + weight);
        } else if (e.type === "internal") {
          internal += weight;
        } else if (e.type === "vacation") {
          vacation += weight;
        } else if (e.type === "event") {
          event += weight;
        }
      }
    }

    const clients = Array.from(byClient.entries())
      .map(([client, days]) => ({ client, days }))
      .sort((a, b) => b.days - a.days);

    return { clients, internal, vacation, event };
  }, [data]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur p-4 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Riepilogo mese</div>
          <div className="mt-1 text-lg font-bold tracking-tight dark:text-slate-100">
            {monthNameIT(monthIndex0)} {year}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Internal</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.internal.toFixed(1)} gg</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ferie</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.vacation.toFixed(1)} gg</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Eventi</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.event.toFixed(1)} gg</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clienti</div>
        {totals.clients.length === 0 ? (
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nessuna giornata cliente registrata.</div>
        ) : (
          <div className="mt-2 space-y-2">
            {totals.clients.map((c) => (
              <div
                key={c.client}
                className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/50"
              >
                <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{c.client}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.days.toFixed(1)} gg</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Nota: 1 slot (mattina/pomeriggio) vale 0.5 giornata.</div>
    </div>
  );
}
