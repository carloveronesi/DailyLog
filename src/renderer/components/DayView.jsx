import { useEffect, useMemo, useRef, useState } from "react";
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
import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const ROW_HEIGHT = 35;

const BREAK_START = 13 * 60;
const BREAK_END = 14 * 60;

const DAY_SLOTS = [...MORNING_SLOTS, BREAK_START, BREAK_START + SLOT_MINUTES, ...AFTERNOON_SLOTS];

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

function slotSection(slotMin) {
  if (slotMin >= BREAK_START && slotMin < BREAK_END) return "break";
  return slotMin < BREAK_START ? "AM" : "PM";
}

function clampToSection(section, min) {
  if (section === "AM") {
    return Math.min(Math.max(min, MORNING_SLOTS[0]), MORNING_SLOTS[MORNING_SLOTS.length - 1] + SLOT_MINUTES);
  }
  return Math.min(Math.max(min, AFTERNOON_SLOTS[0]), AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES);
}

export function DayView({
  date,
  dayData,
  clientColors = {},
  onOpenSlot,
  onMoveTask,
  onResizeTask,
  onDeleteSlot,
  onPrevDay,
  onNextDay,
  onToday,
}) {
  const dayNum = date.getDate();
  const weekday = WEEKDAY_SHORT[date.getDay()];
  const monthName = monthNameIT(date.getMonth());
  const year = date.getFullYear();

  const blocks = buildBlocks(dayData);

  const [dragStart, setDragStart] = useState(null);
  const [dragHover, setDragHover] = useState(null);
  const [dragSection, setDragSection] = useState(null);

  // New state for moving an existing task
  const [moveTaskBlock, setMoveTaskBlock] = useState(null);
  const [moveTaskDelta, setMoveTaskDelta] = useState(0);
  const pendingMoveRef = useRef(null);

  // New state for resizing an existing task
  const [resizeTaskBlock, setResizeTaskBlock] = useState(null);
  const [resizeTaskDelta, setResizeTaskDelta] = useState(0);
  const [resizeTaskDirection, setResizeTaskDirection] = useState(null);

  const isDraggingEmpty = dragStart !== null && dragHover !== null && dragSection;
  const isMoving = moveTaskBlock !== null;
  const isResizing = resizeTaskBlock !== null;
  const isAnyDragging = dragStart !== null || isMoving || isResizing;

  useEffect(() => {
    function handleUp() {
      if (isDraggingEmpty) {
        const start = Math.min(dragStart, dragHover);
        const end = Math.max(dragStart, dragHover) + SLOT_MINUTES;
        const section = dragSection;
        const clampedStart = clampToSection(section, start);
        const clampedEnd = clampToSection(section, end);
        setDragStart(null);
        setDragHover(null);
        setDragSection(null);
        onOpenSlot?.({ start: clampedStart, end: clampedEnd });
      } else if (isMoving) {
        if (moveTaskDelta !== 0 && onMoveTask) {
           const newStart = moveTaskBlock.start + moveTaskDelta;
           onMoveTask({ start: moveTaskBlock.start, end: moveTaskBlock.end, newStart });
        }
        setMoveTaskBlock(null);
        setMoveTaskDelta(0);
        pendingMoveRef.current = null;
      } else if (isResizing) {
        if (resizeTaskDelta !== 0 && onResizeTask) {
           let newStart = resizeTaskBlock.start;
           let newEnd = resizeTaskBlock.end;
           
           if (resizeTaskDirection === 'top') {
              newStart = resizeTaskBlock.start + resizeTaskDelta;
           } else {
              newEnd = resizeTaskBlock.end + resizeTaskDelta;
           }

           if (newEnd > newStart) {
              onResizeTask({ start: resizeTaskBlock.start, end: resizeTaskBlock.end, newStart, newEnd });
           }
        }
        setResizeTaskBlock(null);
        setResizeTaskDelta(0);
        setResizeTaskDirection(null);
      } else if (pendingMoveRef.current) {
        pendingMoveRef.current = null;
      }
    }

    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [dragStart, dragHover, dragSection, isDraggingEmpty, isMoving, isResizing, moveTaskBlock, moveTaskDelta, resizeTaskBlock, resizeTaskDelta, resizeTaskDirection, onOpenSlot, onMoveTask, onResizeTask]);

  useEffect(() => {
    function handleMove(e) {
      if (!pendingMoveRef.current || isMoving || isResizing || isDraggingEmpty) return;
      const { startY, block } = pendingMoveRef.current;
      if (Math.abs(e.clientY - startY) < 5) return;
      setMoveTaskBlock({ ...block });
      setMoveTaskDelta(0);
      pendingMoveRef.current = null;
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [isMoving, isResizing, isDraggingEmpty]);

  const selection = useMemo(() => {
    if (!isDraggingEmpty) return null;
    const start = Math.min(dragStart, dragHover);
    const end = Math.max(dragStart, dragHover) + SLOT_MINUTES;
    const startIndex = slotIndex(start);
    const endIndex = slotIndex(end - SLOT_MINUTES);
    if (startIndex < 0 || endIndex < 0) return null;
    return {
      startIndex,
      span: endIndex - startIndex + 1,
    };
  }, [dragStart, dragHover, isDraggingEmpty]);

  return (
    <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur px-5 pt-4 pb-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
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
        <div className="grid grid-cols-[60px_1fr] gap-3 pt-6 pb-8">
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

          <div
            className="relative grid rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/40"
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

            {selection ? (
              <div
                className="pointer-events-none absolute left-2 right-2 z-10 rounded-2xl border border-sky-400/70 bg-sky-200/30 dark:border-sky-500/60 dark:bg-sky-500/10"
                style={{
                  top: `${selection.startIndex * ROW_HEIGHT + 6}px`,
                  height: `${selection.span * ROW_HEIGHT - 12}px`,
                }}
              />
            ) : null}

            {DAY_SLOTS.map((slot, idx) => {
              const section = slotSection(slot);
              const isBreak = section === "break";
              return (
                <button
                  key={slot}
                  className={
                    "relative z-10 w-full h-full text-left " +
                    (isBreak
                      ? "cursor-default bg-slate-50/50 dark:bg-slate-900/30"
                      : "hover:bg-slate-100/60 dark:hover:bg-slate-800/60")
                  }
                  style={{ gridRow: idx + 1 }}
                  onMouseDown={(e) => {
                    if (isBreak) return;
                    e.preventDefault();
                    setDragStart(slot);
                    setDragHover(slot);
                    setDragSection(section);
                  }}
                  onMouseEnter={() => {
                    if (isDraggingEmpty) {
                      if (section !== dragSection) return;
                      setDragHover(slot);
                    } else if (isMoving && moveTaskBlock) {
                       const delta = slot - moveTaskBlock.start;
                       setMoveTaskDelta(delta);
                    } else if (isResizing && resizeTaskBlock) {
                       if (resizeTaskDirection === 'top') {
                          const delta = slot - resizeTaskBlock.start;
                          setResizeTaskDelta(delta);
                       } else {
                          const delta = (slot + SLOT_MINUTES) - resizeTaskBlock.end;
                          setResizeTaskDelta(delta);
                       }
                    }
                  }}
                  type="button"
                  title={isBreak ? "Pausa" : `Aggiungi task ${hourLabel(slot)}`}
                  aria-disabled={isBreak}
                  tabIndex={isBreak ? -1 : 0}
                >
                  {isBreak && slot === BREAK_START ? (
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
              const startIdx = slotIndex(block.start);
              const span = block.span || 1;
              
              const isBeingMoved = isMoving && moveTaskBlock?.start === block.start;
              const isBeingResized = isResizing && resizeTaskBlock?.start === block.start;
              
              let currentTopIdx = startIdx;
              let currentSpan = span;
              let isGhost = false;

              if (isBeingMoved) {
                 const newStart = block.start + moveTaskDelta;
                 const newStartIdx = slotIndex(newStart);
                 if (newStartIdx >= 0) {
                   currentTopIdx = newStartIdx;
                 }
                 isGhost = true;
              } else if (isBeingResized) {
                 if (resizeTaskDirection === 'top') {
                     const newStart = block.start + resizeTaskDelta;
                     const newStartIdx = slotIndex(newStart);
                     const endIdx = slotIndex(block.end - SLOT_MINUTES);
                     if (newStartIdx <= endIdx && newStartIdx >= 0) {
                         currentTopIdx = newStartIdx;
                         currentSpan = endIdx - newStartIdx + 1;
                     }
                 } else {
                     const newEnd = block.end + resizeTaskDelta;
                     const newEndIdx = slotIndex(newEnd - SLOT_MINUTES);
                     if (newEndIdx >= startIdx) {
                       currentSpan = newEndIdx - startIdx + 1;
                     }
                 }
              }

              return (
                <div
                  key={`${block.start}-${idx}`}
                  className={
                    "group absolute z-20 rounded-2xl px-3 shadow-sm flex flex-col justify-center select-none overflow-hidden " +
                    (currentSpan === 1 ? "py-0.5 " : "py-2 ") +
                    badge.className + " " +
                    (isGhost ? "opacity-70 scale-[0.98] ring-2 ring-sky-400 cursor-grabbing " : "transition hover:brightness-95 dark:hover:brightness-110 cursor-grab ") +
                    (isAnyDragging ? "pointer-events-none " : "")
                  }
                  style={{
                    top: `${currentTopIdx * ROW_HEIGHT + 1}px`,
                    height: `${currentSpan * ROW_HEIGHT - 2}px`,
                    left: '15%',
                    right: '15%',
                    ...badge.style,
                  }}
                  onMouseDown={(e) => {
                     // Only allow moving blocks that are mapped to hours (not full AM/PM blocks)
                     if (typeof block.start === 'number' && block.end && !e.target.closest('.resize-handle') && !e.target.closest('.delete-btn')) {
                       e.stopPropagation();
                       pendingMoveRef.current = { startY: e.clientY, block: { ...block } };
                     }
                  }}
                  onClick={(e) => {
                    // Prevent click if we were dragging
                    if ((isBeingMoved && moveTaskDelta !== 0) || (isBeingResized && resizeTaskDelta !== 0)) {
                       return;
                    }
                    if (e.target.closest('.resize-handle') || e.target.closest('.delete-btn')) return;
                    
                    if (block.end && block.end > block.start + SLOT_MINUTES) {
                      onOpenSlot?.({ start: block.start, end: block.end });
                    } else {
                      onOpenSlot?.(block.slot);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {hasMissingNotes(block.entry) ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85" />
                  ) : null}
                  {block.span === 1 ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 shrink-0">{block.label}</div>
                      <div className="text-sm font-bold truncate">{label}</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{block.label}</div>
                      <div className="mt-1 text-sm font-bold leading-tight">{label}</div>
                    </>
                  )}

                  {/* Trash button visible on hover */}
                  {onDeleteSlot && !isBeingMoved && !isBeingResized ? (
                    <button
                      type="button"
                      className="delete-btn absolute right-2 bottom-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-7 w-7 rounded-lg bg-red-500/90 hover:bg-red-600 text-white shadow-sm"
                      title="Elimina task"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const start = block.start;
                        const end = block.end ?? (block.start + SLOT_MINUTES);
                        onDeleteSlot({ start, end });
                      }}
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  {/* Top Resize handle */}
                  {block.end && typeof block.start === 'number' && !isBeingMoved ? (
                     <div 
                        className="resize-handle absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-t-2xl shadow-sm"
                        onMouseDown={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                           setResizeTaskBlock({ ...block });
                           setResizeTaskDirection('top');
                           setResizeTaskDelta(0);
                        }}
                     />
                  ) : null}

                  {/* Bottom Resize handle */}
                  {block.end && typeof block.start === 'number' && !isBeingMoved ? (
                     <div 
                        className="resize-handle absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-b-2xl shadow-sm"
                        onMouseDown={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                           setResizeTaskBlock({ ...block });
                           setResizeTaskDirection('bottom');
                           setResizeTaskDelta(0);
                        }}
                     />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
