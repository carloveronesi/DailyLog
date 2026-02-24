import { DayCell } from "./DayCell";
import { ymd } from "../utils/date";

export function CalendarGrid({ year, month, gridDates, monthDataByDate, openEditor, clientColors = {} }) {
    const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

    return (
        <section className="rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur p-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="grid grid-cols-7 gap-2">
                {weekDays.map((w) => (
                    <div key={w} className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {w}
                    </div>
                ))}
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
                {gridDates.map((d) => {
                    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const key = ymd(d);
                    const entries = monthDataByDate[key] || null;
                    return (
                        <DayCell
                            key={key}
                            date={d}
                            isCurrentMonth={isCurrentMonth}
                            isWeekend={isWeekend}
                            entries={entries}
                            onClick={(slot) => openEditor(d, slot)}
                            clientColors={clientColors}
                        />
                    );
                })}
            </div>
        </section>
    );
}
