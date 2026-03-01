import { useMemo } from "react";
import { getClientColor, SLOT } from "../domain/tasks";
import { monthNameIT } from "../utils/date";

export function SummaryPanel({ year, monthIndex0, data, clientColors = {} }) {
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

    const clientDays = clients.reduce((sum, c) => sum + c.days, 0);
    const worked = clientDays + internal + event;
    const otherActivities = [
      { key: "internal", label: "Internal", days: internal, dotClassName: "bg-slate-400 dark:bg-slate-500" },
      { key: "event", label: "Eventi", days: event, dotClassName: "bg-purple-400 dark:bg-purple-500" },
    ].filter((activity) => activity.days > 0);

    return { clients, internal, vacation, event, worked, otherActivities };
  }, [data]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur p-4 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Riepilogo mese</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giorni lavorati</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.worked.toFixed(1)} gg</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ferie</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.vacation.toFixed(1)} gg</div>
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20" style={{ backgroundColor: getClientColor(c.client, clientColors) }} />
                  <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{c.client}</div>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.days.toFixed(1)} gg</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Altre attivita</div>
        {totals.otherActivities.length === 0 ? (
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nessuna altra attivita registrata.</div>
        ) : (
          <div className="mt-2 space-y-2">
            {totals.otherActivities.map((activity) => (
              <div
                key={activity.key}
                className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={"h-2.5 w-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20 " + activity.dotClassName}
                  />
                  <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{activity.label}</div>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{activity.days.toFixed(1)} gg</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
