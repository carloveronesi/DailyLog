import { useMemo, useRef, useEffect, useState } from "react";
import { SLOT_MINUTES, hourLabel } from "../domain/tasks";
import { buildBlocks } from "../domain/calendar";
import { useCalendarDrag } from "../hooks/useCalendarDrag";
import { TaskBlock, computeBlockGeometry } from "./TaskBlock";
import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";
import { useWorkSlots } from "../contexts/SettingsContext";

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const DEFAULT_ROW_HEIGHT = 35;
const MIN_ROW_HEIGHT = 28;
// Padding inside the inner grid (pt-6=24 + pb-4=16)
const INNER_PADDING = 40;

export function DayView({
  date,
  dayData,
  onOpenSlot,
  onOpenTask,
  onMoveTask,
  onResizeTask,
  onDeleteSlot,
  onPrevDay,
  onNextDay,
  onToday,
  onNewTask,
  onGoToMonth,
  onToggleLocation,
  onCopyDay,
  pasteMode,
  onPasteDay,
  onCopyEntry,
  pendingTodoCount = 0,
  onGoToTodo,
}) {
  const workSlots = useWorkSlots();
  const { MORNING_SLOTS, AFTERNOON_SLOTS, DAY_SLOTS, BREAK_START, BREAK_END } = workSlots;

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
  const dayNum = date.getDate();
  const weekday = WEEKDAY_SHORT[date.getDay()];
  const monthName = monthNameIT(date.getMonth());
  const year = date.getFullYear();

  const blocks = buildBlocks(dayData, workSlots);

  const {
    activeDragCol: dragSection,
    setActiveDragCol: setDragSection,
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
    clampToSection
  });

  // Altezza riga dinamica: si adatta allo spazio disponibile senza scroll
  const containerRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const h = el.clientHeight;
      if (h <= 0) return;
      const ideal = (h - INNER_PADDING) / DAY_SLOTS.length;
      setRowHeight(Math.max(MIN_ROW_HEIGHT, ideal));
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();
    return () => ro.disconnect();
  }, [DAY_SLOTS.length]);

  const needsScroll = rowHeight <= MIN_ROW_HEIGHT;

  return (
    <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur px-5 pt-4 pb-5 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Vista giornaliera</div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{dayNum}</div>
              <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">{weekday}</div>
              <div className="text-lg font-semibold text-slate-500 dark:text-slate-400">{monthName} {year}</div>
            </div>
            <button
               onClick={() => onToggleLocation?.(date)}
               className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                 dayData?.location && dayData.location !== "remote"
                   ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400"
                   : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
               }`}
               title="Cambia sede di lavoro"
            >
              <Icon name={dayData?.location === "office" ? "building" : "home"} className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {dayData?.location === "office" ? "In Ufficio" : dayData?.location === "client" ? "Sede Cliente" : "Da Remoto"}
              </span>
            </button>
            {onGoToTodo && (
              <button
                onClick={onGoToTodo}
                className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800 transition-all"
                title="Vai alle attività"
              >
                <Icon name="list-check" className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${pendingTodoCount > 0 ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {pendingTodoCount} {pendingTodoCount === 1 ? "attività" : "attività"}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGoToMonth && (
            <Button
              className="bg-white/95 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 text-xs font-semibold"
              onClick={onGoToMonth}
              type="button"
              title="Torna alla vista mese"
            >
              <Icon name="chev-left" className="w-4 h-4" />
              Mese
            </Button>
          )}
          {pasteMode ? (
            <Button
              className="bg-sky-500 border border-sky-600 text-white hover:bg-sky-600 dark:bg-sky-600 dark:border-sky-700 dark:hover:bg-sky-500 flex items-center gap-1.5"
              onClick={onPasteDay}
              type="button"
            >
              <Icon name="clipboard" className="w-4 h-4" />
              Incolla qui
            </Button>
          ) : (
            <Button
              className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={onCopyDay}
              type="button"
              title="Copia questo giorno"
            >
              <Icon name="clipboard" className="w-4 h-4" />
            </Button>
          )}
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
          {onNewTask && (
            <Button
              className="bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 font-semibold"
              onClick={onNewTask}
              type="button"
            >
              + Nuovo
            </Button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="mt-5 flex-1 min-h-0" style={{ overflowY: needsScroll ? "auto" : "hidden" }}>
        <div className="grid grid-cols-[60px_1fr] gap-3 pt-6 pb-4">
          <div
            className="relative grid text-[11px] font-semibold text-slate-500 dark:text-slate-400"
            style={{ gridTemplateRows: `repeat(${DAY_SLOTS.length}, ${rowHeight}px)` }}
          >
            {DAY_SLOTS.map((slot) => (
              <div key={slot} className="flex items-center justify-end pr-2" style={{ height: `${rowHeight}px`, marginTop: `${-rowHeight / 2}px` }}>
                {slot % 60 === 0 ? hourLabel(slot) : ""}
              </div>
            ))}
            <div
              className="absolute left-0 right-0 flex items-center justify-end pr-2"
              style={{ top: `${DAY_SLOTS.length * rowHeight}px`, height: `${rowHeight}px`, marginTop: `${-rowHeight / 2}px` }}
            >
              {hourLabel(DAY_SLOTS[DAY_SLOTS.length - 1] + SLOT_MINUTES)}
            </div>
          </div>

          <div
            className="relative grid rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/40"
            style={{ gridTemplateRows: `repeat(${DAY_SLOTS.length}, ${rowHeight}px)` }}
          >
            {DAY_SLOTS.map((slot, idx) => (
              <div
                key={`line-${slot}`}
                className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-slate-300/80 dark:border-slate-600/70"
                style={{ top: `${idx * rowHeight}px` }}
              />
            ))}
            <div
              className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-slate-300/80 dark:border-slate-600/70"
              style={{ top: `${DAY_SLOTS.length * rowHeight}px` }}
            />

            {selection ? (
              <div
                className="pointer-events-none absolute left-2 right-2 z-10 rounded-2xl border border-sky-400/70 bg-sky-200/30 dark:border-sky-500/60 dark:bg-sky-500/10"
                style={{
                  top: `${selection.startIndex * rowHeight + 6}px`,
                  height: `${selection.span * rowHeight - 12}px`,
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
              const geo = computeBlockGeometry(block, {
                isMoving, isResizing,
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
                  ROW_HEIGHT={rowHeight}
                  variant="day"
                  onMouseDownBlock={(e) => {
                    const section = slotSection(block.start);
                    if (typeof block.start === "number" && block.end && !e.target.closest(".resize-handle") && !e.target.closest(".delete-btn") && !e.target.closest(".copy-btn")) {
                      e.stopPropagation();
                      pendingMoveRef.current = { startY: e.clientY, block: { ...block }, colIdx: section };
                    }
                  }}
                  onOpen={() => {
                    if (onOpenTask && block.entry) {
                      onOpenTask({ entry: block.entry, start: block.start, end: block.end, slot: block.slot });
                    } else if (block.end && block.end > block.start + SLOT_MINUTES) {
                      onOpenSlot?.({ start: block.start, end: block.end });
                    } else {
                      onOpenSlot?.(block.slot);
                    }
                  }}
                  onCopy={onCopyEntry ? () => onCopyEntry(block.entry, block.start, block.end) : undefined}
                  onDelete={onDeleteSlot ? () => {
                    onDeleteSlot({ start: block.start, end: block.end ?? (block.start + SLOT_MINUTES) });
                  } : null}
                  onResizeMouseDown={(direction) => {
                    const section = slotSection(block.start);
                    setDragSection(section);
                    setResizeTaskBlock({ ...block });
                    setResizeTaskDirection(direction);
                    setResizeTaskDelta(0);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
