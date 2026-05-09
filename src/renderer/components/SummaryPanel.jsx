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
      { key: "internal", label: "Internal", data: internal, dotClassName: "bg-si-gray" },
      { key: "vacation", label: "Ferie", data: vacation, dotClassName: "bg-si-success" },
      { key: "event", label: "Eventi", data: event, dotClassName: "bg-si-violet" },
    ].filter((activity) => activity.data.total > 0);

    return { clients, internal: internal.total, vacation: vacation.total, event: event.total, worked, workingDaysInMonth, otherActivities };
  }, [data, year, monthIndex0, WORK_SLOTS]);

  const pct = totals.workingDaysInMonth > 0
    ? Math.min(100, Math.round((totals.worked / totals.workingDaysInMonth) * 100))
    : 0;

  return (
    <div
      className="rounded-[20px] bg-si-surface shadow-si p-5 flex flex-col gap-5"
      onMouseLeave={() => onHoverFilterChange?.(null)}
    >
      {/* Hero completion card */}
      <div
        className="rounded-2xl p-4 text-white"
        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] opacity-75 mb-1">Completamento mese</div>
        <div className="text-3xl font-bold leading-none mb-3">{pct}%</div>
        <div className="h-1.5 rounded-full bg-white/30">
          <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-[11px] opacity-70">{totals.worked.toFixed(1)} / {totals.workingDaysInMonth} giorni lavorativi</div>
      </div>

      {fixedFilter && (
        <button
          onClick={() => onFixedFilterChange?.(null)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-si-accent bg-si-accentSoft px-2.5 py-1 rounded-full border-0 cursor-pointer"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Rimuovi filtro
        </button>
      )}

      {/* Clients */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-gray mb-2">Clienti</div>
        {totals.clients.length === 0 ? (
          <p className="text-xs text-si-grayLight italic">Nessuna attività cliente questo mese</p>
        ) : (
          <div className="space-y-2">
            {totals.clients.map((c) => {
              const color = getClientColor(c.client, clientColors);
              const clientPct = totals.workingDaysInMonth > 0 ? Math.min(100, (c.data.total / totals.workingDaysInMonth) * 100) : 0;
              return (
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
                    className={`flex flex-col rounded-xl px-3 py-2.5 cursor-pointer transition-opacity border ${
                      isClientFilterActive(activeFilter, c.client)
                        ? "border-si-accent bg-si-accentBg"
                        : "border-si-border bg-si-muted hover:border-si-accent/40"
                    }${isClientFilterFaded(fixedFilter, c.client) ? " opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="text-[13px] font-semibold text-si-ink truncate">{c.client}</div>
                      </div>
                      <div className="text-[13px] font-bold text-si-ink ml-2 shrink-0">{c.data.total.toFixed(1)} gg</div>
                    </div>
                    <div className="h-1 rounded-full bg-si-border">
                      <div className="h-1 rounded-full transition-all" style={{ width: `${clientPct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  {Object.keys(c.data.bySubtype).length > 1 || (Object.keys(c.data.bySubtype)[0] && Object.keys(c.data.bySubtype)[0] !== "generico") ? (
                    <div className="ml-4 mt-1.5 mb-1 space-y-1 border-l-2 border-si-border pl-2">
                      {Object.entries(c.data.bySubtype).sort((a,b) => b[1] - a[1]).map(([st, days]) => {
                        const stLabel = st === "generico" ? "Generico" : getSubtypeLabel("client", st, taskSubtypes);
                        return (
                          <div key={st} className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-si-gray">{stLabel}</div>
                            <div className="text-[11px] font-bold text-si-inkSoft">{days.toFixed(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other activities */}
      {totals.otherActivities.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-gray mb-2">Altre attività</div>
          <div className="space-y-1.5">
            {totals.otherActivities.map((activity) => {
              const dotColor = activity.key === "vacation" ? "#10B981" : activity.key === "event" ? "#8B5CF6" : "#7676A0";
              return (
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
                    className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-opacity border ${
                      isTypeFilterActive(activeFilter, activity.key)
                        ? "border-si-accent bg-si-accentBg"
                        : "border-si-border bg-si-muted hover:border-si-accent/40"
                    }${isTypeFilterFaded(fixedFilter, activity.key) ? " opacity-40" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <div className="text-[13px] font-semibold text-si-ink truncate">{activity.label}</div>
                    </div>
                    <div className="text-[13px] font-bold text-si-ink">{activity.data.total.toFixed(1)} gg</div>
                  </div>
                  {Object.keys(activity.data.bySubtype).length > 1 || (Object.keys(activity.data.bySubtype)[0] && Object.keys(activity.data.bySubtype)[0] !== "generico") ? (
                    <div className="ml-4 mt-1.5 mb-1 space-y-1 border-l-2 border-si-border pl-2">
                      {Object.entries(activity.data.bySubtype).sort((a,b) => b[1] - a[1]).map(([st, days]) => {
                        const stLabel = st === "generico" ? "Generico" : getSubtypeLabel(activity.key, st, taskSubtypes);
                        const subtypeColor = activity.key === "internal" ? getInternalColor(st, internalColors) : null;
                        return (
                          <div key={st} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {subtypeColor && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: subtypeColor }} />}
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-si-gray truncate">{stLabel}</div>
                            </div>
                            <div className="text-[11px] font-bold text-si-inkSoft shrink-0">{days.toFixed(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
