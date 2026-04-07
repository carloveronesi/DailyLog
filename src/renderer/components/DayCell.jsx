import { memo } from "react";
import { badgePresentation, displayLabel, isSameTaskEntry, hourKey, TASK_TYPES } from "../domain/tasks";
import { matchesRecurringPattern } from "../domain/calendar";
import { Icon } from "./ui";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";
import { dowMon0 } from "../utils/date";

function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

function MissingNotesLed() {
  return (
    <div
      className="absolute right-[0.3rem] top-[0.3rem] z-10 group"
      title="Mancano i dettagli del log"
      aria-label="Mancano i dettagli del log"
    >
      <span
        aria-hidden="true"
        className="block h-2.5 w-2.5 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85"
      />
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
        Mancano i dettagli del log
      </div>
    </div>
  );
}

function HourStrip({ entry, clientColors, internalColors }) {
  const badge = badgePresentation(entry, clientColors, internalColors);
  if (!entry) {
    return (
      <div
        className="flex-1 rounded border border-dashed border-slate-300/80 dark:border-slate-600/60 transition-colors opacity-60"
      />
    );
  }
  return (
    <div
      className={"relative flex-1 rounded flex items-center justify-center px-1 min-h-0 shadow-sm transition-all overflow-hidden " + badge.className}
      style={badge.style}
    >
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="w-full text-center truncate text-[9px] font-bold leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function HalfBlock({ entry, clientColors, internalColors, emptyClass }) {
  const badge = badgePresentation(entry, clientColors, internalColors);
  if (!entry) {
    return (
      <div
        className={"flex-1 rounded border border-dashed border-slate-300/80 dark:border-slate-600/60 transition-colors opacity-60 min-h-[36px] " + (emptyClass || "")}
      />
    );
  }
  return (
    <div
      className={"relative flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm transition-all overflow-hidden " + badge.className}
      style={badge.style}
    >
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="w-full text-center truncate text-[11.5px] font-bold leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function normalizeEntryValue(value) {
  return (value || "").trim().toLocaleLowerCase("it-IT");
}

function groupKey(entry) {
  if (!entry) return "";
  if (entry.type === "client") {
    return "client|" + normalizeEntryValue(entry.client || "");
  }
  return entry.type || "";
}

function buildHourSummary(hours) {
  const groups = new Map();
  for (const entry of Object.values(hours || {})) {
    if (!entry) continue;
    const key = groupKey(entry);
    if (!key) continue;
    const current = groups.get(key);
    if (current) current.count += 1;
    else groups.set(key, { entry, count: 1 });
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export const DayCell = memo(function DayCell({ date, isCurrentMonth, isWeekend, isHoliday = false, entries, onDayClick, clientColors = {}, onToggleLocation, pasteMode, onApplyRecurring }) {
  const { MORNING_SLOTS, AFTERNOON_SLOTS } = useWorkSlots();
  const { settings } = useSettings();
  const recurringTasks = settings?.recurringTasks || [];
  const internalColors = settings?.internalColors || {};
  const dow = dowMon0(date);
  const d = date.getDate();
  const isToday = isCurrentMonth && date.toDateString() === new Date().toDateString();
  const am = entries?.AM;
  const pm = entries?.PM;
  const hours = entries?.hours || {};
  const morningHoursActive = MORNING_SLOTS.some((h) => hours[hourKey(h)]);
  const afternoonHoursActive = AFTERNOON_SLOTS.some((h) => hours[hourKey(h)]);
  const hasHourly = !!entries?.hours && Object.keys(entries.hours).length > 0;

  // Full day: AM === PM, no hourly entries
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  const isWeekendDay = isCurrentMonth && isWeekend;
  const isNonWorkday = isWeekendDay || isHoliday;
  const isClickable = isCurrentMonth && !isNonWorkday && (typeof onDayClick === "function" || pasteMode);

  const hasEntries = !!(am || pm || hasHourly);
  const isEmptyWorkday = isCurrentMonth && !isNonWorkday && !hasEntries;
  const recurringTask = isEmptyWorkday ? (recurringTasks.find(t => matchesRecurringPattern(t, date)) || null) : null;
  const recurringEntry = recurringTask
    ? (recurringTask.AM || recurringTask.PM || (recurringTask.hours ? Object.values(recurringTask.hours)[0] : null))
    : null;

  const base =
    "group relative overflow-hidden rounded-[22px] border p-3 transition-all duration-200 select-none min-h-[100px] lg:min-h-0 lg:h-full flex flex-col gap-2";
  const cursor = isClickable ? "cursor-pointer" : "cursor-default";
  const bg = !isCurrentMonth
    ? "bg-slate-300/70 border-slate-400 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-500"
    : isWeekendDay
      ? "bg-rose-100/70 border-rose-200/90 text-slate-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-slate-300"
      : isHoliday
        ? "bg-amber-50/80 border-amber-200/80 text-slate-700 dark:bg-amber-900/15 dark:border-amber-700/40 dark:text-slate-300"
        : pasteMode
          ? "bg-white/88 border-sky-200 hover:border-sky-400 hover:bg-sky-50/40 dark:bg-slate-800/90 dark:border-sky-700/50 dark:hover:border-sky-500 dark:hover:bg-sky-900/20"
          : "bg-white/88 border-slate-200/90 hover:shadow-soft hover:-translate-y-[1px] dark:bg-slate-800/90 dark:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-black/20";
  const todayRing = isToday
    ? "ring-2 ring-sky-300/60 ring-offset-2 ring-offset-white dark:ring-sky-500/40 dark:ring-offset-slate-900"
    : "";

  const dayNumCls = !isCurrentMonth
    ? "text-sm font-semibold text-slate-600 dark:text-slate-500"
    : "text-sm font-semibold " + (isWeekend ? "text-rose-600 dark:text-rose-400" : isHoliday ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300");
  const dayNumTodayCls = isToday
    ? "text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 rounded-full w-6 h-6 flex items-center justify-center"
    : dayNumCls;

  const hourSummary = hasHourly ? buildHourSummary(entries.hours) : [];
  const summaryVisible = hourSummary.slice(0, 3);
  const remaining = hourSummary.length - summaryVisible.length;

  return (
    <div className={base + " " + cursor + " " + bg + " " + todayRing} onClick={isClickable ? () => onDayClick(date) : undefined}>
      <div className="flex items-center justify-between px-0.5">
        <div className={dayNumTodayCls}>{d}</div>
        {isCurrentMonth && !isNonWorkday && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLocation?.(date); }}
              className={`flex items-center justify-center rounded-lg p-1 transition-all ${
                entries?.location && entries.location !== "remote"
                  ? "text-sky-500 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 opacity-100"
                  : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
              title={entries?.location === "office" ? "In Ufficio" : entries?.location === "client" ? "Sede Cliente" : "Imposta sede (Remoto)"}
            >
              <Icon name={entries?.location === "office" ? "building" : "home"} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isCurrentMonth && isHoliday && (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500/80 dark:text-amber-400/70">Festività</span>
        </div>
      )}

      {isCurrentMonth && !isNonWorkday ? (
        <div className="flex flex-1 flex-col gap-1.5 mt-1.5">
          {isFullDay ? (
            // Full day: single large block
            <div
              className={"relative flex-1 rounded-xl flex items-center justify-center px-1.5 py-1 min-h-[44px] shadow-sm transition-transform " + badgePresentation(am, clientColors, internalColors).className}
              style={badgePresentation(am, clientColors, internalColors).style}
            >
              {hasMissingNotes(am) ? <MissingNotesLed /> : null}
              <div className="w-full text-center truncate text-sm font-bold tracking-tight">
                {displayLabel(am)}
              </div>
            </div>
          ) : hasHourly ? (
            <div className="flex flex-col gap-1">
              {summaryVisible.map((item, idx) => {
                const badge = badgePresentation(item.entry, clientColors, internalColors);
                let label = displayLabel(item.entry);

                // If grouped (or even if single, for month view pills), 
                // simplify the label to client name or type label
                if (item.entry.type === "client") {
                  label = (item.entry.client || "").trim() || "Cliente";
                } else {
                  const typeObj = TASK_TYPES.find(t => t.id === item.entry.type);
                  if (typeObj) label = typeObj.label;
                }

                return (
                  <div
                    key={idx}
                    className={"truncate rounded-full px-2 py-1 text-[11px] font-bold shadow-sm " + badge.className}
                    style={badge.style}
                  >
                    {label}
                  </div>
                );
              })}
              {remaining > 0 ? (
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">+{remaining} altri</div>
              ) : null}
            </div>
          ) : (!am && !pm && recurringTask && recurringEntry) ? (
            <div
              className={"relative flex-1 rounded-xl flex items-center justify-center px-1.5 py-1 min-h-[44px] border-2 border-dashed opacity-30 hover:opacity-60 transition-opacity cursor-pointer " + badgePresentation(recurringEntry, clientColors, internalColors).className}
              style={badgePresentation(recurringEntry, clientColors, internalColors).style}
              onClick={(e) => { e.stopPropagation(); onApplyRecurring?.(date); }}
              title="Applica modello ricorrente"
            >
              <div className="w-full text-center truncate text-sm font-bold">
                {displayLabel(recurringEntry)}
              </div>
            </div>
          ) : (
            <>
              {/* Morning section */}
              {morningHoursActive ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {MORNING_SLOTS.map((h) => {
                    const entry = entries?.hours?.[hourKey(h)] || null;
                    return (
                      <HourStrip
                        key={h}
                        entry={entry}
                        clientColors={clientColors}
                        internalColors={internalColors}
                      />
                    );
                  })}
                </div>
              ) : (
                <HalfBlock
                  entry={am}
                  clientColors={clientColors}
                  internalColors={internalColors}
                />
              )}

              {/* Afternoon section */}
              {afternoonHoursActive ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {AFTERNOON_SLOTS.map((h) => {
                    const entry = entries?.hours?.[hourKey(h)] || null;
                    return (
                      <HourStrip
                        key={h}
                        entry={entry}
                        clientColors={clientColors}
                        internalColors={internalColors}
                      />
                    );
                  })}
                </div>
              ) : (
                <HalfBlock
                  entry={pm}
                  clientColors={clientColors}
                  internalColors={internalColors}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
});

