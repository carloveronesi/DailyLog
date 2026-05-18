import { useMemo } from "react";
import { DayCell } from "./DayCell";
import { useSettings } from "../contexts/SettingsContext";
import { ymd } from "../utils/date";
import { getItalianHolidays } from "../utils/holidays";

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
    pasteMode,
    onApplyRecurring,
}) {
    const { settings } = useSettings();
    const clientColors = useMemo(() => settings?.clientColors || {}, [settings?.clientColors]);
    const patronDay = settings?.patronDay ?? "12-07";
    const holidays = useMemo(() => getItalianHolidays(year, patronDay), [year, patronDay]);
    const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

    return (
        <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-[20px] bg-si-surface border border-si-border px-4 pt-4 pb-4">
            <div className="grid grid-cols-7 gap-2 shrink-0">
                {weekDays.map((w, i) => (
                    <div key={w} className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${i >= 5 ? "text-si-gray" : "text-si-inkSoft"}`}>
                        {w}
                    </div>
                ))}
            </div>

            <div className="my-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 lg:auto-rows-fr gap-2.5 flex-1 min-h-0 py-1">
                {gridDates.map((d) => {
                    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const key = ymd(d);
                    const isHoliday = isCurrentMonth && !isWeekend && holidays.has(key);
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
                            isHoliday={isHoliday}
                            entries={entries}
                            onDayClick={onDayClick}
                            clientColors={clientColors}
                            onToggleLocation={onToggleLocation}
                            pasteMode={pasteMode && isCurrentMonth && !isWeekend && !isHoliday}
                            onApplyRecurring={onApplyRecurring}
                        />
                    );
                })}
            </div>
        </section>
    );
}
