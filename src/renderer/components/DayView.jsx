import { useMemo, useRef, useEffect, useState } from "react";
import { SLOT_MINUTES, hourLabel } from "../domain/tasks";
import { buildBlocks } from "../domain/calendar";
import { useCalendarDrag } from "../hooks/useCalendarDrag";
import { TaskBlock, computeBlockGeometry } from "./TaskBlock";
import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";
import { useWorkSlots, useSettings } from "../contexts/SettingsContext";

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
  const { settings } = useSettings();
  const effectiveLocation = dayData?.location || settings?.defaultLocation || "remote";

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
    <section className="flex flex-col lg:flex-1 lg:min-h-0 rounded-[20px] bg-si-surface shadow-si px-5 pt-4 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent">Vista giornaliera</div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-bold tracking-tight text-si-ink">{dayNum}</div>
              <div className="text-lg font-semibold text-si-inkSoft">{weekday}</div>
              <div className="text-lg font-semibold text-si-gray">{monthName} {year}</div>
            </div>
            <button
               onClick={() => onToggleLocation?.(date)}
               className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 transition-all cursor-pointer ${
                 effectiveLocation !== "remote"
                   ? "bg-si-accentSoft text-si-accent"
                   : "bg-si-muted text-si-gray hover:bg-si-border hover:text-si-inkSoft"
               }`}
               title="Cambia sede di lavoro"
            >
              <Icon name={effectiveLocation === "office" ? "building" : "home"} className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {effectiveLocation === "office" ? "In Ufficio" : effectiveLocation === "client" ? "Sede Cliente" : "Da Remoto"}
              </span>
            </button>
            {onGoToTodo && (
              <button
                onClick={onGoToTodo}
                className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 bg-si-muted hover:bg-si-border transition-all cursor-pointer"
                title="Vai alle attività"
              >
                <Icon name="list-check" className="w-4 h-4 text-si-gray" />
                <span className={`text-xs font-bold uppercase tracking-wider ${pendingTodoCount > 0 ? "text-si-accent" : "text-si-gray"}`}>
                  {pendingTodoCount} {pendingTodoCount === 1 ? "attività" : "attività"}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGoToMonth && (
            <Button
              className="bg-si-muted text-si-inkSoft hover:bg-si-border flex items-center gap-1.5 text-xs font-semibold"
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
              className="bg-si-ink hover:bg-si-inkSoft text-white flex items-center gap-1.5 transition-colors"
              onClick={onPasteDay}
              type="button"
            >
              <Icon name="clipboard" className="w-4 h-4" />
              Incolla qui
            </Button>
          ) : (
            <Button
              className="bg-si-muted text-si-gray hover:bg-si-border"
              onClick={onCopyDay}
              type="button"
              title="Copia questo giorno"
            >
              <Icon name="clipboard" className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-0.5 p-1 bg-si-muted rounded-full shadow-si">
            <Button className="w-8 h-8 !px-0 !py-0 bg-transparent text-si-ink hover:bg-si-surface" onClick={onPrevDay} type="button" title="Giorno precedente">
              <Icon name="chev-left" className="w-4 h-4" />
            </Button>
            <Button className="h-8 !px-3 bg-transparent text-si-ink text-[12.5px] hover:bg-si-surface" onClick={onToday} type="button">Oggi</Button>
            <Button className="w-8 h-8 !px-0 !py-0 bg-transparent text-si-ink hover:bg-si-surface" onClick={onNextDay} type="button" title="Giorno successivo">
              <Icon name="chev-right" className="w-4 h-4" />
            </Button>
          </div>
          {onNewTask && (
            <Button
              className="h-9 !px-4 bg-si-ink hover:bg-si-inkSoft text-white text-[13px] font-semibold transition-colors"
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
            className="relative grid text-[11px] font-semibold text-si-gray"
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
            className="relative grid rounded-2xl border border-si-border bg-si-muted/60"
            style={{ gridTemplateRows: `repeat(${DAY_SLOTS.length}, ${rowHeight}px)` }}
          >
            {DAY_SLOTS.map((slot, idx) => (
              <div
                key={`line-${slot}`}
                className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-si-border"
                style={{ top: `${idx * rowHeight}px` }}
              />
            ))}
            <div
              className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-si-border"
              style={{ top: `${DAY_SLOTS.length * rowHeight}px` }}
            />

            {selection ? (
              <div
                className="pointer-events-none absolute left-2 right-2 z-10 rounded-2xl border border-si-accent/60 bg-si-accentBg"
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
                      ? "cursor-default bg-si-border/40"
                      : "hover:bg-si-accentBg/60")
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
                    <span className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-[0.14em] text-si-grayLight">
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
