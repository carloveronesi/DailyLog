import { badgePresentation, displayLabel, hasAfternoonHours, hasMorningHours, hourKey, hourLabel, isSameTaskEntry, MORNING_HOURS, AFTERNOON_HOURS } from "../domain/tasks";
import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";

const DAY_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const ROW_HEIGHT = 56;

function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

function buildBlocks(dayData) {
  if (!dayData) return [];
  const am = dayData.AM || null;
  const pm = dayData.PM || null;
  const morningHoursActive = hasMorningHours(dayData);
  const afternoonHoursActive = hasAfternoonHours(dayData);
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  const blocks = [];
  const addHourBlock = (hour, entry) => {
    if (!entry) return;
    const row = DAY_HOURS.indexOf(hour) + 1;
    if (row <= 0) return;
    blocks.push({
      entry,
      start: row,
      span: 1,
      slot: hour,
      label: hourLabel(hour),
    });
  };

  if (isFullDay && am) {
    blocks.push({
      entry: am,
      start: 1,
      span: DAY_HOURS.length,
      slot: "AM",
      label: "Giornata intera",
    });
    return blocks;
  }

  if (morningHoursActive) {
    MORNING_HOURS.forEach((hour) => addHourBlock(hour, dayData?.hours?.[hourKey(hour)] || null));
  } else if (am) {
    blocks.push({
      entry: am,
      start: 1,
      span: MORNING_HOURS.length,
      slot: "AM",
      label: "Mattina",
    });
  }

  if (afternoonHoursActive) {
    AFTERNOON_HOURS.forEach((hour) => addHourBlock(hour, dayData?.hours?.[hourKey(hour)] || null));
  } else if (pm) {
    const start = DAY_HOURS.indexOf(AFTERNOON_HOURS[0]) + 1;
    blocks.push({
      entry: pm,
      start,
      span: AFTERNOON_HOURS.length,
      slot: "PM",
      label: "Pomeriggio",
    });
  }

  return blocks;
}

export function DayView({
  date,
  dayData,
  clientColors = {},
  onOpenSlot,
  onPrevDay,
  onNextDay,
  onToday,
}) {
  const dayNum = date.getDate();
  const weekday = WEEKDAY_SHORT[date.getDay()];
  const monthName = monthNameIT(date.getMonth());
  const year = date.getFullYear();

  const blocks = buildBlocks(dayData);

  return (
    <section className="flex flex-col lg:h-full rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur px-5 pt-4 pb-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Vista giornaliera</div>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{dayNum}</div>
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">{weekday}</div>
            <div className="text-lg font-semibold text-slate-500 dark:text-slate-400">{monthName} {year}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onPrevDay}
            type="button"
            title="Giorno precedente"
          >
            <Icon name="chev-left" />
          </Button>
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onNextDay}
            type="button"
            title="Giorno successivo"
          >
            <Icon name="chev-right" />
          </Button>
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onToday}
            type="button"
          >
            Oggi
          </Button>
        </div>
      </div>

      <div className="mt-5 flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr] gap-3">
          <div
            className="grid text-[11px] font-semibold text-slate-500 dark:text-slate-400"
            style={{ gridTemplateRows: `repeat(${DAY_HOURS.length}, minmax(${ROW_HEIGHT}px, 1fr))` }}
          >
            {DAY_HOURS.map((h) => (
              <div key={h} className="flex items-start justify-end pr-2 pt-2">
                {hourLabel(h)}
              </div>
            ))}
          </div>

          <div
            className="relative grid rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/40"
            style={{ gridTemplateRows: `repeat(${DAY_HOURS.length}, minmax(${ROW_HEIGHT}px, 1fr))` }}
          >
            {DAY_HOURS.map((h, idx) => (
              <div
                key={`line-${h}`}
                className="pointer-events-none absolute left-0 right-0 z-20 border-t border-dashed border-slate-300/80 dark:border-slate-600/70"
                style={{ top: `${idx * ROW_HEIGHT}px` }}
              />
            ))}

            {DAY_HOURS.map((h, idx) => {
              const isBreak = h === 13;
              const row = idx + 1;
              return (
                <button
                  key={h}
                  className={
                    "relative w-full h-full text-left " +
                    (isBreak
                      ? "cursor-default bg-slate-50/50 dark:bg-slate-900/30"
                      : "hover:bg-slate-100/60 dark:hover:bg-slate-800/60")
                  }
                  style={{ gridRow: row }}
                  onClick={() => {
                    if (isBreak) return;
                    onOpenSlot?.(h);
                  }}
                  type="button"
                  title={isBreak ? "Pausa" : `Aggiungi task ${hourLabel(h)}`}
                  aria-disabled={isBreak}
                  tabIndex={isBreak ? -1 : 0}
                >
                  {isBreak ? (
                    <span className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400/80">
                      Pausa
                    </span>
                  ) : null}
                </button>
              );
            })}

            {blocks.map((block, idx) => {
              const badge = badgePresentation(block.entry, clientColors);
              const label = displayLabel(block.entry);
              return (
                <div
                  key={`${block.start}-${idx}`}
                  className={
                    "relative z-10 mx-auto h-full w-[70%] max-w-[560px] rounded-2xl px-3 py-2 shadow-sm transition hover:brightness-95 dark:hover:brightness-110 flex flex-col justify-center " +
                    badge.className
                  }
                  style={{
                    gridRow: `${block.start} / span ${block.span}`,
                    ...badge.style,
                  }}
                  onClick={() => onOpenSlot?.(block.slot)}
                  role="button"
                  tabIndex={0}
                >
                  {hasMissingNotes(block.entry) ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85" />
                  ) : null}
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{block.label}</div>
                  <div className="mt-1 text-sm font-bold leading-tight">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
