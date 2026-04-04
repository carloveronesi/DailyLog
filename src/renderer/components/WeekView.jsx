import { useMemo } from "react";
import { SLOT_MINUTES, hourLabel } from "../domain/tasks";
import { buildBlocks } from "../domain/calendar";
import { useCalendarDrag } from "../hooks/useCalendarDrag";
import { TaskBlock, computeBlockGeometry } from "./TaskBlock";
import { ymd } from "../utils/date";
import { Button, Icon } from "./ui";
import { useWorkSlots } from "../contexts/SettingsContext";

const ROW_HEIGHT = 35;
const WEEKDAY_NAMES = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"];

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
  onOpenSlot,
  goPrevWeek,
  goNextWeek,
  goToday,
  onMoveTask,
  onResizeTask,
  onDeleteSlot,
  onToggleLocation
}) {
  const workSlots = useWorkSlots();
  const { DAY_SLOTS, BREAK_START, BREAK_END } = workSlots;
  const weekDays = useMemo(() => getWorkweekDays(activeDate), [activeDate]);

  // Create an array mapping each weekday index (0-4) to its blocks
  const dayColumns = useMemo(() => {
    return weekDays.map((d) => {
      const key = ymd(d);
      const data = monthDataByDate[key] || null;
      return buildBlocks(data, workSlots);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, monthDataByDate, workSlots]);

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

  const getColDate = (colIdx) => weekDays[colIdx];

  const {
    activeDragCol, setActiveDragCol,
    dragStart, setDragStart,
    dragHover, setDragHover,
    moveTaskBlock, setMoveTaskBlock,
    moveTaskDelta, setMoveTaskDelta,
    resizeTaskBlock, setResizeTaskBlock,
    resizeTaskDelta, setResizeTaskDelta,
    resizeTaskDirection, setResizeTaskDirection,
    pendingMoveRef,
    isDraggingEmpty, isMoving, isResizing, isAnyDragging, selection
  } = useCalendarDrag({
    onOpenSlot,
    onMoveTask,
    onResizeTask,
    getColDate
  });

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
                       <div className="flex items-center gap-1.5">
                         <div className={`text-[11px] lg:text-xs font-semibold uppercase ${isToday ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800'}`}>{WEEKDAY_NAMES[colIdx]}</div>
                         <button
                           onClick={(e) => { e.stopPropagation(); onToggleLocation?.(date); }}
                           className={`flex items-center justify-center rounded-lg p-0.5 transition-all ${
                             monthDataByDate[ymd(date)]?.location && monthDataByDate[ymd(date)].location !== "remote"
                               ? "text-sky-500 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 opacity-100"
                               : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                           }`}
                           title={monthDataByDate[ymd(date)]?.location === "office" ? "In Ufficio" : monthDataByDate[ymd(date)]?.location === "client" ? "Sede Cliente" : "Imposta sede (Remoto)"}
                         >
                           <Icon name={monthDataByDate[ymd(date)]?.location === "office" ? "building" : "home"} className="w-3.5 h-3.5" />
                         </button>
                       </div>
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

                        {selection && activeDragCol === colIdx ? (
                          <div
                            className="pointer-events-none absolute left-1 right-1 z-10 rounded-xl border border-sky-400/70 bg-sky-200/30 dark:border-sky-500/60 dark:bg-sky-500/10"
                            style={{
                              top: `${selection.startIndex * ROW_HEIGHT + 6}px`,
                              height: `${selection.span * ROW_HEIGHT - 12}px`,
                            }}
                          />
                        ) : null}

                        {/* Interactive Clickable Background Slots */}
                        {DAY_SLOTS.map((slot, idx) => {
                            const isBreak = slot >= BREAK_START && slot < BREAK_END;
                            return (
                                <div
                                    key={`slot-${slot}`}
                                    className={`relative z-10 w-full h-full cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 ${isBreak ? 'bg-slate-50/50 dark:bg-slate-900/30 cursor-default' : ''}`}
                                    style={{ gridRow: idx + 1 }}
                                    onMouseDown={(e) => {
                                        if (isBreak) return;
                                        e.preventDefault();
                                        setDragStart(slot);
                                        setDragHover(slot);
                                        setActiveDragCol(colIdx);
                                    }}
                                    onMouseEnter={() => {
                                        if (isDraggingEmpty && activeDragCol === colIdx) {
                                            setDragHover(slot);
                                        } else if (isMoving && moveTaskBlock && activeDragCol === colIdx) {
                                            const delta = slot - moveTaskBlock.start;
                                            setMoveTaskDelta(delta);
                                        } else if (isResizing && resizeTaskBlock && activeDragCol === colIdx) {
                                            if (resizeTaskDirection === 'top') {
                                                const delta = slot - resizeTaskBlock.start;
                                                setResizeTaskDelta(delta);
                                            } else {
                                                const delta = (slot + SLOT_MINUTES) - resizeTaskBlock.end;
                                                setResizeTaskDelta(delta);
                                            }
                                        }
                                    }}
                                />
                            );
                        })}

                        {blocks.map((block, idx) => {
                          const isActiveCol = activeDragCol === colIdx;
                          const geo = computeBlockGeometry(block, {
                            isMoving, isResizing, isActiveCol,
                            moveTaskBlock, moveTaskDelta,
                            resizeTaskBlock, resizeTaskDelta, resizeTaskDirection,
                          }, DAY_SLOTS);
                          return (
                            <TaskBlock
                              key={`${block.start}-${idx}`}
                              block={block}
                              {...geo}
                              isAnyDragging={isAnyDragging}
                              moveTaskDelta={moveTaskDelta}
                              resizeTaskDelta={resizeTaskDelta}
                              ROW_HEIGHT={ROW_HEIGHT}
                              variant="week"
                              onMouseDownBlock={(e) => {
                                if (typeof block.start === "number" && block.end && !e.target.closest(".resize-handle") && !e.target.closest(".delete-btn")) {
                                  e.stopPropagation();
                                  pendingMoveRef.current = { startY: e.clientY, block: { ...block }, colIdx };
                                }
                              }}
                              onOpen={() => {
                                if (block.end && block.end > block.start + SLOT_MINUTES) {
                                  onOpenSlot?.({ date, start: block.start, end: block.end });
                                } else {
                                  onOpenSlot?.({ date, slot: block.slot });
                                }
                              }}
                              onDelete={onDeleteSlot ? () => {
                                onDeleteSlot(date, { start: block.start, end: block.end ?? (block.start + SLOT_MINUTES) });
                              } : null}
                              onResizeMouseDown={(direction) => {
                                setActiveDragCol(colIdx);
                                setResizeTaskBlock({ ...block });
                                setResizeTaskDirection(direction);
                                setResizeTaskDelta(0);
                              }}
                            />
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





