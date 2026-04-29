import { useMemo } from "react";
import { getClientColor, getInternalColor, SLOT, getSubtypeLabel } from "../domain/tasks";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";
import { getItalianHolidays } from "../utils/holidays";

function isClientFilterActive(activeFilter, clientName) {
  return activeFilter?.kind === "client" && activeFilter.client === clientName;
}

function isTypeFilterActive(activeFilter, type) {
  return activeFilter?.kind === "type" && activeFilter.type === type;
}

function isClientFilterFaded(fixedFilter, clientName) {
  if (!fixedFilter) return false;
  if (fixedFilter.kind === "client") {
    return fixedFilter.client !== clientName;
  }
  // Se il filtro fisso è su un tipo, oscura tutti i clienti
  return fixedFilter.kind === "type";
}

function isTypeFilterFaded(fixedFilter, type) {
  if (!fixedFilter) return false;
  if (fixedFilter.kind === "type") {
    return fixedFilter.type !== type;
  }
  // Se il filtro fisso è su un cliente, oscura tutti i tipi
  return fixedFilter.kind === "client";
}

export function SummaryPanel({
  year,
  monthIndex0,
  data,
  onHoverFilterChange,
  activeFilter = null,
  fixedFilter = null,
  onFixedFilterChange,
}) {
  const { settings } = useSettings();
  const { WORK_SLOTS } = useWorkSlots();
  const clientColors = settings?.clientColors || {};
  const internalColors = settings?.internalColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};
  const totals = useMemo(() => {
    const byClient = new Map();
    let internal = { total: 0, bySubtype: {} };
    let vacation = { total: 0, bySubtype: {} };
    let event = { total: 0, bySubtype: {} };

    function addTime(typeObj, weight, subtypeId) {
      typeObj.total += weight;
      const st = subtypeId || "generico";
      typeObj.bySubtype[st] = (typeObj.bySubtype[st] || 0) + weight;
    }

    const lastDayOfMonth = new Date(year, monthIndex0 + 1, 0).getDate();
    const holidays = getItalianHolidays(year);
    let workingDaysInMonth = 0;
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const d = new Date(year, monthIndex0, day);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
      const key = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (holidays.has(key)) continue;
      workingDaysInMonth += 1;
    }

    const byDate = data?.byDate || {};
    for (const dateKey of Object.keys(byDate)) {
      const day = byDate[dateKey];
      for (const s of [SLOT.AM, SLOT.PM]) {
        const e = day?.[s];
        if (!e) continue;
        const weight = 0.5;
        if (e.type === "client") {
          const c = (e.client || "(senza nome)").trim() || "(senza nome)";
          let clientData = byClient.get(c);
          if (!clientData) {
            clientData = { total: 0, bySubtype: {} };
            byClient.set(c, clientData);
          }
          addTime(clientData, weight, e.subtypeId);
        } else if (e.type === "internal") {
          addTime(internal, weight, e.subtypeId);
        } else if (e.type === "vacation") {
          addTime(vacation, weight, e.subtypeId);
        } else if (e.type === "event") {
          addTime(event, weight, e.subtypeId);
        }
      }
      for (const e of Object.values(day?.hours || {})) {
        if (!e) continue;
        const weight = 1 / WORK_SLOTS.length;
        if (e.type === "client") {
          const c = (e.client || "(senza nome)").trim() || "(senza nome)";
          let clientData = byClient.get(c);
          if (!clientData) {
            clientData = { total: 0, bySubtype: {} };
            byClient.set(c, clientData);
          }
          addTime(clientData, weight, e.subtypeId);
        } else if (e.type === "internal") {
          addTime(internal, weight, e.subtypeId);
        } else if (e.type === "vacation") {
          addTime(vacation, weight, e.subtypeId);
        } else if (e.type === "event") {
          addTime(event, weight, e.subtypeId);
        }
      }
    }

    const clients = Array.from(byClient.entries())
      .map(([client, data]) => ({ client, data }))
      .sort((a, b) => b.data.total - a.data.total);

    const clientDays = clients.reduce((sum, c) => sum + c.data.total, 0);
    const worked = clientDays + internal.total + event.total;
    const otherActivities = [
      { key: "internal", label: "Internal", data: internal, dotClassName: "bg-slate-400 dark:bg-slate-500" },
      { key: "vacation", label: "Ferie", data: vacation, dotClassName: "bg-emerald-400 dark:bg-emerald-500" },
      { key: "event", label: "Eventi", data: event, dotClassName: "bg-purple-400 dark:bg-purple-500" },
    ].filter((activity) => activity.data.total > 0);

    return { clients, internal: internal.total, vacation: vacation.total, event: event.total, worked, workingDaysInMonth, otherActivities };
  }, [data, year, monthIndex0, WORK_SLOTS]);

  return (
    <div
      className="rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur p-4 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80"
      onMouseLeave={() => onHoverFilterChange?.(null)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Riepilogo mese</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giorni lavorativi totali</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.workingDaysInMonth} gg</div>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giorni compilati</div>
          <div className="mt-1 text-lg font-bold dark:text-slate-100">{totals.worked.toFixed(1)} gg</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clienti</div>
        {totals.clients.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-1.5 py-4 text-center">
            <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nessuna giornata cliente</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Registra le tue attività nel calendario</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {totals.clients.map((c) => (
              <div key={c.client}>
                <div
                  onMouseEnter={() => !fixedFilter && onHoverFilterChange?.({ kind: "client", client: c.client })}
                  onMouseLeave={() => !fixedFilter && onHoverFilterChange?.(null)}
                  onClick={() => {
                    if (fixedFilter?.kind === "client" && fixedFilter.client === c.client) {
                      onFixedFilterChange?.(null);
                    } else {
                      onFixedFilterChange?.({ kind: "client", client: c.client });
                    }
                  }}
                  className={
                    "flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/50 cursor-pointer transition-opacity " +
                    (isClientFilterActive(activeFilter, c.client)
                      ? "ring-2 ring-sky-300 dark:ring-sky-500"
                      : "hover:border-sky-200 dark:hover:border-sky-700") +
                    (isClientFilterFaded(fixedFilter, c.client) ? " opacity-40 dark:opacity-40" : "")
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20" style={{ backgroundColor: getClientColor(c.client, clientColors) }} />
                    <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{c.client}</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.data.total.toFixed(1)} gg</div>
                </div>
                {Object.keys(c.data.bySubtype).length > 1 || (Object.keys(c.data.bySubtype)[0] && Object.keys(c.data.bySubtype)[0] !== "generico") ? (
                  <div className="ml-[22px] mt-2 mb-1 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-700/50 pl-2">
                    {Object.entries(c.data.bySubtype).sort((a,b) => b[1] - a[1]).map(([st, days]) => {
                      const stLabel = st === "generico" ? "Generico" : getSubtypeLabel("client", st, taskSubtypes);
                      return (
                        <div key={st} className="flex items-center justify-between">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stLabel}</div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{days.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Altre attività</div>
        {totals.otherActivities.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-1.5 py-3 text-center">
            <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">Nessuna altra attività questo mese</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {totals.otherActivities.map((activity) => (
              <div key={activity.key}>
                <div
                  onMouseEnter={() => !fixedFilter && onHoverFilterChange?.({ kind: "type", type: activity.key })}
                  onMouseLeave={() => !fixedFilter && onHoverFilterChange?.(null)}
                  onClick={() => {
                    if (fixedFilter?.kind === "type" && fixedFilter.type === activity.key) {
                      onFixedFilterChange?.(null);
                    } else {
                      onFixedFilterChange?.({ kind: "type", type: activity.key });
                    }
                  }}
                  className={
                    "flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-800/50 cursor-pointer transition-opacity " +
                    (isTypeFilterActive(activeFilter, activity.key)
                      ? "ring-2 ring-sky-300 dark:ring-sky-500"
                      : "hover:border-sky-200 dark:hover:border-sky-700") +
                    (isTypeFilterFaded(fixedFilter, activity.key) ? " opacity-40 dark:opacity-40" : "")
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={"h-2.5 w-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20 " + activity.dotClassName}
                    />
                    <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{activity.label}</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{activity.data.total.toFixed(1)} gg</div>
                </div>
                {Object.keys(activity.data.bySubtype).length > 1 || (Object.keys(activity.data.bySubtype)[0] && Object.keys(activity.data.bySubtype)[0] !== "generico") ? (
                  <div className="ml-[22px] mt-2 mb-1 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-700/50 pl-2">
                    {Object.entries(activity.data.bySubtype).sort((a,b) => b[1] - a[1]).map(([st, days]) => {
                      const stLabel = st === "generico" ? "Generico" : getSubtypeLabel(activity.key, st, taskSubtypes);
                      const subtypeColor = activity.key === "internal" ? getInternalColor(st, internalColors) : null;
                      return (
                        <div key={st} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {subtypeColor && (
                              <span className="h-2 w-2 rounded-full shrink-0 border border-black/10 dark:border-white/20" style={{ backgroundColor: subtypeColor }} />
                            )}
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{stLabel}</div>
                          </div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">{days.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
