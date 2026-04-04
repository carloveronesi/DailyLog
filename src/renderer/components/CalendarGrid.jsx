import { useMemo } from "react";
import { DayCell } from "./DayCell";
import { useSettings } from "../contexts/SettingsContext";
import { ymd } from "../utils/date";

function matchesVisibleFilter(entry, visibleFilter) {
    if (!entry || !visibleFilter) return true;
    if (visibleFilter.kind === "client") {
        return entry.type === "client" && (entry.client || "").trim() === visibleFilter.client;
    }
    if (visibleFilter.kind === "type") {
        return entry.type === visibleFilter.type;
    }
    return true;
}

export function CalendarGrid({
    year,
    month,
    gridDates,
    monthDataByDate,
    onDayClick,
    visibleFilter = null,
    onToggleLocation,
}) {
    const { settings } = useSettings();
    const clientColors = useMemo(() => settings?.clientColors || {}, [settings?.clientColors]);
    const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

    return (
        <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur px-5 pt-3 pb-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="grid grid-cols-7 gap-2 shrink-0">
                {weekDays.map((w) => (
                    <div key={w} className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {w}
                    </div>
                ))}
            </div>

            <div className="my-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 lg:auto-rows-fr gap-2.5 flex-1 min-h-0 py-1">
                {gridDates.map((d) => {
                    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const key = ymd(d);
                    const rawEntries = monthDataByDate[key] || null;
                    let entries = rawEntries;
                    if (rawEntries && visibleFilter) {
                        const filteredHours = {};
                        for (const [k, e] of Object.entries(rawEntries.hours || {})) {
                            if (matchesVisibleFilter(e, visibleFilter)) filteredHours[k] = e;
                        }
                        entries = {
                            AM: matchesVisibleFilter(rawEntries.AM, visibleFilter) ? rawEntries.AM : null,
                            PM: matchesVisibleFilter(rawEntries.PM, visibleFilter) ? rawEntries.PM : null,
                            hours: filteredHours,
                        };
                    }
                    return (
                        <DayCell
                            key={key}
                            date={d}
                            isCurrentMonth={isCurrentMonth}
                            isWeekend={isWeekend}
                            entries={entries}
                            onDayClick={onDayClick}
                            clientColors={clientColors}
                            onToggleLocation={onToggleLocation}
                        />
                    );
                })}
            </div>
        </section>
    );
}
