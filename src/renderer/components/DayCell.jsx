import { memo } from "react";
import { getClientColor, displayLabel, isSameTaskEntry, hourKey, TASK_TYPES } from "../domain/tasks";
import { matchesRecurringPattern } from "../domain/calendar";
import { Icon } from "./ui";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";
import { dowMon0 } from "../utils/date";

// ── colour helpers ────────────────────────────────────────────────────────────
function getEntryColor(entry, clientColors) {
  if (!entry) return "#B0B0CC";
  if (entry.type === "client")   return getClientColor(entry.client, clientColors);
  if (entry.type === "vacation") return "#10B981";
  if (entry.type === "event")    return "#8B5CF6";
  return "#7676A0"; // internal
}

function hex2rgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── sub-components ────────────────────────────────────────────────────────────
function MissingNotesLed() {
  return (
    <div className="absolute right-[0.3rem] top-[0.3rem] z-10 group"
      title="Mancano i dettagli del log" aria-label="Mancano i dettagli del log">
      <span aria-hidden="true"
        className="block h-2.5 w-2.5 rounded-full bg-si-rose/80 border border-si-rose/40" />
    </div>
  );
}

function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

function Pill({ entry, color, period, full, isHole }) {
  if (!entry) {
    if (isHole) {
      return (
        <div
          className={`flex-1 rounded-lg flex items-center pl-2 text-[10px] font-semibold border border-dashed ${full ? "min-h-[44px]" : "min-h-[22px]"}`}
          style={{ color: "#A16207", borderColor: "#F59E0B", background: "rgba(245,158,11,0.08)" }}
          title="Metà giornata vuota"
        >
          + {period}
        </div>
      );
    }
    return (
      <div className={`flex-1 rounded-lg flex items-center pl-2 text-[10px] font-medium text-si-grayLight border border-dashed border-si-border ${full ? "min-h-[44px]" : "min-h-[22px]"}`}>
        + {period}
      </div>
    );
  }
  return (
    <div
      className={`relative flex-1 flex flex-col justify-center min-w-0 overflow-hidden rounded-lg px-2 py-1 ${full ? "min-h-[44px]" : "min-h-[22px]"}`}
      style={{ background: hex2rgba(color, 0.10) }}
    >
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="text-[8.5px] font-semibold uppercase tracking-[0.04em] leading-none"
        style={{ color, filter: "brightness(0.7) saturate(1.5)" }}>
        {period}
      </div>
      <div className={`font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap ${full ? "text-[13px] mt-0.5" : "text-[11px]"}`}
        style={{ color, filter: "brightness(0.6) saturate(1.5)" }}>
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function HourChip({ entry, color, label }) {
  if (!entry) {
    return <div className="flex-1 rounded border border-dashed border-si-border opacity-60 min-h-[12px]" />;
  }
  return (
    <div className="relative flex-1 min-h-[12px] overflow-hidden rounded"
      style={{ background: hex2rgba(color, 0.14) }}>
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="px-1 text-[9px] font-semibold truncate leading-tight pt-[1px]"
        style={{ color, filter: "brightness(0.65) saturate(1.4)" }}>
        {label}
      </div>
    </div>
  );
}

function normalizeEntryValue(v) { return (v || "").trim().toLocaleLowerCase("it-IT"); }
function groupKey(entry) {
  if (!entry) return "";
  if (entry.type === "client") return "client|" + normalizeEntryValue(entry.client || "");
  return entry.type || "";
}
function buildHourSummary(hours) {
  const groups = new Map();
  for (const entry of Object.values(hours || {})) {
    if (!entry) continue;
    const key = groupKey(entry);
    if (!key) continue;
    const cur = groups.get(key);
    if (cur) cur.count += 1;
    else groups.set(key, { entry, count: 1 });
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

// ── main component ────────────────────────────────────────────────────────────
export const DayCell = memo(function DayCell({
  date, isCurrentMonth, isWeekend, isHoliday = false,
  entries, onDayClick, clientColors = {}, onToggleLocation,
  pasteMode, onApplyRecurring,
}) {
  const { MORNING_SLOTS, AFTERNOON_SLOTS } = useWorkSlots();
  const { settings } = useSettings();
  const recurringTasks = settings?.recurringTasks || [];
  const effectiveLocation = entries?.location || settings?.defaultLocation || "remote";
  const d = date.getDate();
  const isToday = isCurrentMonth && date.toDateString() === new Date().toDateString();
  const am = entries?.AM;
  const pm = entries?.PM;
  const hours = entries?.hours || {};
  const morningHoursActive  = MORNING_SLOTS.some(h => hours[hourKey(h)]);
  const afternoonHoursActive = AFTERNOON_SLOTS.some(h => hours[hourKey(h)]);
  const hasHourly = !!entries?.hours && Object.keys(entries.hours).length > 0;
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);
  const isWeekendDay = isCurrentMonth && isWeekend;
  const isNonWorkday = isWeekendDay || isHoliday;
  const isClickable = isCurrentMonth && !isNonWorkday && (typeof onDayClick === "function" || pasteMode);
  const hasEntries = !!(am || pm || hasHourly);
  const isEmptyWorkday = isCurrentMonth && !isNonWorkday && !hasEntries;
  const recurringTask  = isEmptyWorkday ? (recurringTasks.find(t => matchesRecurringPattern(t, date)) || null) : null;
  const recurringEntry = recurringTask
    ? (recurringTask.AM || recurringTask.PM || (recurringTask.hours ? Object.values(recurringTask.hours)[0] : null))
    : null;

  // ── cell container style ────────────────────────────────────────────────────
  const cellStyle = {
    borderRadius: 16,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    position: "relative",
    overflow: "hidden",
    minHeight: 0,
    cursor: isClickable ? "pointer" : "default",
    transition: "border-color 0.2s, transform 0.15s",
    userSelect: "none",
    border: "1px solid transparent",
  };

  if (!isCurrentMonth) {
    cellStyle.background = "transparent";
    cellStyle.border = "1px solid transparent";
  } else if (isHoliday) {
    cellStyle.background = "#FEF3C7";
  } else if (isWeekendDay) {
    cellStyle.background = "#EFEEF7";
  } else {
    cellStyle.background = "var(--si-surface)";
    cellStyle.border = "1px solid var(--si-border)";
    if (isToday) cellStyle.border = "1px solid #6366F1";
    if (pasteMode) cellStyle.border = "1px solid #6366F1";
  }

  // ── date number ─────────────────────────────────────────────────────────────
  const dateNumStyle = isToday
    ? {
        width: 22, height: 22, borderRadius: 999,
        background: "#6366F1", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11.5, fontWeight: 600,
      }
    : {
        fontSize: 13, fontWeight: 600,
        color: !isCurrentMonth ? "#B0B0CC" : (isWeekendDay || isHoliday) ? "#7676A0" : "#1B1B2E",
      };

  const hourSummary  = hasHourly ? buildHourSummary(entries.hours) : [];
  const summaryVisible = hourSummary.slice(0, 3);
  const remaining    = hourSummary.length - summaryVisible.length;

  return (
    <div
      style={cellStyle}
      className="min-h-[100px] lg:min-h-0 lg:h-full"
      onClick={isClickable ? () => onDayClick(date) : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div style={dateNumStyle}>{d}</div>
        {isCurrentMonth && !isNonWorkday && (
          <button
            onClick={e => { e.stopPropagation(); onToggleLocation?.(date); }}
            className={`flex items-center justify-center rounded-md p-1 border-0 transition-all ${
              effectiveLocation !== "remote"
                ? "text-si-accent bg-si-accentSoft"
                : "text-si-grayLight bg-transparent hover:bg-si-muted"
            }`}
            title={effectiveLocation === "office" ? "In Ufficio" : effectiveLocation === "client" ? "Sede Cliente" : "Remoto"}
            style={{ cursor: "pointer" }}
          >
            <Icon name={effectiveLocation === "office" ? "building" : "home"} className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Holiday label */}
      {isCurrentMonth && isHoliday && (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[10px] font-semibold text-si-amber">Festività</span>
        </div>
      )}

      {/* Entry content */}
      {isCurrentMonth && !isNonWorkday ? (
        <div className="flex flex-1 flex-col gap-1 mt-1">
          {isFullDay ? (
            (() => {
              const color = getEntryColor(am, clientColors);
              return (
                <div
                  className="relative flex-1 flex flex-col justify-center px-2 py-1.5 rounded-lg overflow-hidden min-h-[44px]"
                  style={{ background: hex2rgba(color, 0.10) }}
                >
                  {hasMissingNotes(am) ? <MissingNotesLed /> : null}
                  <div className="text-[8.5px] font-semibold uppercase tracking-[0.04em] leading-none"
                    style={{ color, filter: "brightness(0.7) saturate(1.5)" }}>
                    Giorno intero
                  </div>
                  <div className="text-[13px] font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap mt-0.5"
                    style={{ color, filter: "brightness(0.6) saturate(1.5)" }}>
                    {displayLabel(am)}
                  </div>
                </div>
              );
            })()
          ) : hasHourly ? (
            <div className="flex flex-col gap-1">
              {summaryVisible.map((item, idx) => {
                const color = getEntryColor(item.entry, clientColors);
                let label = displayLabel(item.entry);
                if (item.entry.type === "client") label = (item.entry.client || "").trim() || "Cliente";
                else {
                  const typeObj = TASK_TYPES.find(t => t.id === item.entry.type);
                  if (typeObj) label = typeObj.label;
                }
                return (
                  <div key={idx}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold truncate"
                    style={{ background: hex2rgba(color, 0.10), color, filter: "brightness(0.65) saturate(1.4)" }}>
                    {label}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className="text-[10px] font-medium text-si-gray">+{remaining} altri</div>
              )}
            </div>
          ) : (!am && !pm && recurringTask && recurringEntry) ? (
            (() => {
              const color = getEntryColor(recurringEntry, clientColors);
              return (
                <div
                  className="relative flex-1 rounded-lg flex items-center justify-center px-2 py-1 min-h-[44px] border-2 border-dashed opacity-30 hover:opacity-60 transition-opacity cursor-pointer"
                  style={{ background: hex2rgba(color, 0.10), borderColor: color }}
                  onClick={e => { e.stopPropagation(); onApplyRecurring?.(date); }}
                  title="Applica modello ricorrente"
                >
                  <div className="w-full text-center truncate text-[12px] font-semibold"
                    style={{ color, filter: "brightness(0.65) saturate(1.4)" }}>
                    {displayLabel(recurringEntry)}
                  </div>
                </div>
              );
            })()
          ) : (
            <>
              {(() => {
                const amFilled = morningHoursActive || !!am;
                const pmFilled = afternoonHoursActive || !!pm;
                const amHole = !amFilled && pmFilled;
                const pmHole = !pmFilled && amFilled;
                return (
                  <>
                    {morningHoursActive ? (
                      <div className="flex flex-1 flex-col gap-0.5">
                        {MORNING_SLOTS.map(h => {
                          const e = entries?.hours?.[hourKey(h)] || null;
                          const color = getEntryColor(e, clientColors);
                          return <HourChip key={h} entry={e} color={color} label={displayLabel(e)} />;
                        })}
                      </div>
                    ) : (
                      <Pill entry={am} color={getEntryColor(am, clientColors)} period="AM" isHole={amHole} />
                    )}
                    {afternoonHoursActive ? (
                      <div className="flex flex-1 flex-col gap-0.5">
                        {AFTERNOON_SLOTS.map(h => {
                          const e = entries?.hours?.[hourKey(h)] || null;
                          const color = getEntryColor(e, clientColors);
                          return <HourChip key={h} entry={e} color={color} label={displayLabel(e)} />;
                        })}
                      </div>
                    ) : (
                      <Pill entry={pm} color={getEntryColor(pm, clientColors)} period="PM" isHole={pmHole} />
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
});
