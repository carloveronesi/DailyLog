import { useMemo } from "react";
import {
  AFTERNOON_SLOTS,
  MORNING_SLOTS,
  SLOT_MINUTES,
  WORK_SLOTS,
  badgePresentation,
  displayLabel,
  hasAfternoonHours,
  hasMorningHours,
  hourKey,
  hourLabel,
  isSameTaskEntry,
} from "../domain/tasks";
import { ymd } from "../utils/date";
import { Button, Icon } from "./ui";

const ROW_HEIGHT = 35;
const WEEKDAY_NAMES = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"];

const BREAK_START = 13 * 60;
const BREAK_END = 14 * 60;

const DAY_SLOTS = [...MORNING_SLOTS, BREAK_START, BREAK_START + SLOT_MINUTES, ...AFTERNOON_SLOTS];

// Helper functions (same logic as DayView, re-implemented here context-free)
function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

function normalizeEntryValue(value) {
  return (value || "").trim().toLocaleLowerCase("it-IT");
}

function isSameHourEntry(a, b) {
  if (!a || !b) return false;
  return (
    normalizeEntryValue(a.type) === normalizeEntryValue(b.type) &&
    normalizeEntryValue(a.title) === normalizeEntryValue(b.title) &&
    normalizeEntryValue(a.client) === normalizeEntryValue(b.client) &&
    normalizeEntryValue(a.notes) === normalizeEntryValue(b.notes) &&
    normalizeEntryValue(a.wentWrong) === normalizeEntryValue(b.wentWrong) &&
    normalizeEntryValue(a.nextSteps) === normalizeEntryValue(b.nextSteps)
  );
}

function buildHourBlocks(dayData) {
  if (!dayData?.hours) return [];
  const blocks = [];
  let current = null;
  const hourKeys = Object.keys(dayData.hours || {});
  const hasHalfSlots = hourKeys.some((k) => k.endsWith(":30"));

  const slotsToScan = hasHalfSlots
    ? WORK_SLOTS
    : WORK_SLOTS.filter((slot) => slot % 60 === 0);
  const stepMinutes = hasHalfSlots ? SLOT_MINUTES : 60;
  const spanStep = hasHalfSlots ? 1 : 2;

  for (const slot of slotsToScan) {
    const entry = dayData.hours[hourKey(slot)] || null;
    if (!entry) {
      current = null;
      continue;
    }

    if (current && isSameHourEntry(current.entry, entry) && current.end === slot) {
      current.end += stepMinutes;
      current.span += spanStep;
      continue;
    }

    const label = hourLabel(slot);
    current = {
      entry,
      start: slot,
      end: slot + stepMinutes,
      span: spanStep,
      label,
    };
    blocks.push(current);
  }

  return blocks.map((block) => {
    if (block.span <= spanStep) return block;
    return {
      ...block,
      label: `${hourLabel(block.start)} - ${hourLabel(block.end)}`,
    };
  });
}

function buildBlocks(dayData) {
  if (!dayData) return [];
  const am = dayData.AM || null;
  const pm = dayData.PM || null;
  const morningHoursActive = hasMorningHours(dayData);
  const afternoonHoursActive = hasAfternoonHours(dayData);
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  if (isFullDay && am) {
    return [
      {
        entry: am,
        start: MORNING_SLOTS[0],
        end: AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES,
        span: DAY_SLOTS.length,
        slot: "AM",
        label: "Giornata intera",
      },
    ];
  }

  if (morningHoursActive || afternoonHoursActive) {
    return buildHourBlocks(dayData).map((b) => ({
      ...b,
      slot: b.start,
    }));
  }

  const blocks = [];
  if (am) {
    blocks.push({
      entry: am,
      start: MORNING_SLOTS[0],
      end: MORNING_SLOTS[MORNING_SLOTS.length - 1] + SLOT_MINUTES,
      span: MORNING_SLOTS.length,
      slot: "AM",
      label: "Mattina",
    });
  }

  if (pm) {
    blocks.push({
      entry: pm,
      start: AFTERNOON_SLOTS[0],
      end: AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES,
      span: AFTERNOON_SLOTS.length,
      slot: "PM",
      label: "Pomeriggio",
    });
  }

  return blocks;
}

function slotIndex(slotMin) {
  return DAY_SLOTS.indexOf(slotMin);
}

function getWorkweekDays(date) {
  // Returns an array of 5 Date objects (Mon-Fri) for the week containing 'date'.
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so Monday is 0. JS getDay: Sun=0, Mon=1...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const week = [];
  for (let i = 0; i < 5; i++) {
    const wd = new Date(monday);
    wd.setDate(monday.getDate() + i);
    week.push(wd);
  }
  return week;
}

export function WeekView({
  activeDate,
  monthDataByDate,
  clientColors = {},
  onOpenSlot,
  goPrevWeek,
  goNextWeek,
  goToday
}) {
  const weekDays = useMemo(() => getWorkweekDays(activeDate), [activeDate]);
  
  // Create an array mapping each weekday index (0-4) to its blocks
  const dayColumns = useMemo(() => {
    return weekDays.map((d) => {
      const key = ymd(d);
      const data = monthDataByDate[key] || null;
      return buildBlocks(data);
    });
  }, [weekDays, monthDataByDate]);

  // Week header label (e.g. "4 - 8 Marzo 2026")
  const weekTitle = useMemo(() => {
    const monday = weekDays[0];
    const friday = weekDays[4];
    const startMonth = monday.toLocaleString('it-IT', { month: 'short' });
    const startYear = monday.getFullYear();
    const endMonth = friday.toLocaleString('it-IT', { month: 'short' });
    const endYear = friday.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${monday.getDate()} - ${friday.getDate()} ${endMonth} ${endYear}`;
    } else if (startYear === endYear) {
      return `${monday.getDate()} ${startMonth} - ${friday.getDate()} ${endMonth} ${endYear}`;
    } else {
      return `${monday.getDate()} ${startMonth} ${startYear} - ${friday.getDate()} ${endMonth} ${endYear}`;
    }
  }, [weekDays]);

  return (
    <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur px-5 pt-4 pb-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Vista settimanale</div>
          <div className="text-xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{weekTitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={goPrevWeek}
            type="button"
            title="Settimana precedente"
          >
            <Icon name="chev-left" />
          </Button>
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={goNextWeek}
            type="button"
            title="Settimana successiva"
          >
            <Icon name="chev-right" />
          </Button>
          <Button
            className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={goToday}
            type="button"
          >
            Oggi
          </Button>
        </div>
      </div>

      <div className="mt-5 flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[50px_1fr] lg:grid-cols-[60px_1fr] gap-3 pb-8">
          
          {/* Time axis */}
          <div className="pt-[40px]">
            <div
              className="relative grid text-[11px] font-semibold text-slate-500 dark:text-slate-400"
              style={{ gridTemplateRows: `repeat(${DAY_SLOTS.length}, ${ROW_HEIGHT}px)` }}
            >
              {DAY_SLOTS.map((slot) => (
                <div key={slot} className="flex items-center justify-end pr-2 pt-0 h-[35px] -mt-[18px]">
                  {slot % 60 === 0 ? hourLabel(slot) : ""}
                </div>
              ))}
              <div 
                className="absolute left-0 right-0 flex items-center justify-end pr-2 pt-0 h-[35px] -mt-[18px]"
                style={{ top: `${DAY_SLOTS.length * ROW_HEIGHT}px` }}
              >
                {hourLabel(DAY_SLOTS[DAY_SLOTS.length - 1] + SLOT_MINUTES)}
              </div>
            </div>
          </div>

          {/* Days columns container */}
          <div className="grid grid-cols-5 gap-1.5 lg:gap-3 lg:pr-3">
             
             {weekDays.map((date, colIdx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                const blocks = dayColumns[colIdx];
                return (
                  <div key={colIdx} className="flex flex-col">
                    {/* Day Header */}
                    <div className="flex flex-col items-center justify-center h-[40px] mb-2 cursor-pointer group" onClick={() => onOpenSlot?.({ date, slot: null })}>
                       <div className={`text-[11px] lg:text-xs font-semibold uppercase ${isToday ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800'}`}>{WEEKDAY_NAMES[colIdx]}</div>
                       <div className={`text-lg lg:text-xl font-bold ${isToday ? 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 rounded-full w-8 h-8 flex items-center justify-center' : 'text-slate-700 dark:text-slate-200'}`}>
                         {date.getDate()}
                       </div>
                    </div>

                    {/* Day Grid */}
                    <div
                      className="relative grid flex-1 rounded-xl border border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/40 opacity-95 hover:opacity-100 transition-opacity"
                      style={{ gridTemplateRows: `repeat(${DAY_SLOTS.length}, ${ROW_HEIGHT}px)` }}
                    >
                        {DAY_SLOTS.map((slot, idx) => (
                          <div
                            key={`line-${slot}`}
                            className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-slate-300/80 dark:border-slate-600/70"
                            style={{ top: `${idx * ROW_HEIGHT}px` }}
                          />
                        ))}
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-slate-300/80 dark:border-slate-600/70"
                          style={{ top: `${DAY_SLOTS.length * ROW_HEIGHT}px` }}
                        />

                        {/* Interactive Clickable Background Slots */}
                        {DAY_SLOTS.map((slot, idx) => {
                            const isBreak = slot >= BREAK_START && slot < BREAK_END;
                            return (
                                <div
                                    key={`slot-${slot}`}
                                    className={`relative z-10 w-full h-full cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 ${isBreak ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}`}
                                    style={{ gridRow: idx + 1 }}
                                    onClick={() => {
                                        if (isBreak) return;
                                        onOpenSlot?.({ date, slot });
                                    }}
                                />
                            );
                        })}

                        {/* Task Blocks */}
                        {blocks.map((block, idx) => {
                          const badge = badgePresentation(block.entry, clientColors);
                          const label = displayLabel(block.entry);
                          const startIdx = slotIndex(block.start);
                          const span = block.span || 1;
                          
                          return (
                            <div
                              key={`${block.start}-${idx}`}
                              className={
                                "group absolute z-20 rounded-xl px-1.5 shadow-sm transition hover:brightness-95 dark:hover:brightness-110 flex flex-col justify-center select-none overflow-hidden " +
                                (span === 1 ? "py-0 " : "py-1 ") +
                                badge.className
                              }
                              style={{
                                top: `${startIdx * ROW_HEIGHT + 1}px`,
                                height: `${span * ROW_HEIGHT - 2}px`,
                                left: '4%',
                                right: '4%',
                                ...badge.style,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (block.end && block.end > block.start + SLOT_MINUTES) {
                                  onOpenSlot?.({ date, start: block.start, end: block.end });
                                } else {
                                  onOpenSlot?.({ date, slot: block.slot });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              {hasMissingNotes(block.entry) ? (
                                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85" />
                              ) : null}
                              {span === 1 ? (
                                <div className="text-[10px] lg:text-[11px] font-bold leading-[1.1] line-clamp-2 truncate">{label}</div>
                              ) : (
                                <>
                                  <div className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider opacity-70 whitespace-nowrap overflow-hidden text-ellipsis">{block.label}</div>
                                  <div className="mt-0.5 text-[10px] lg:text-xs font-bold leading-tight line-clamp-2">{label}</div>
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
             })}
          </div>
        </div>
      </div>
    </section>
  );
}
