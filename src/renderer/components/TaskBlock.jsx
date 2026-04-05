import { SLOT_MINUTES, badgePresentation, displayLabel, getSubtypeLabel } from "../domain/tasks";
import { hasMissingNotes, slotIndex, DAY_SLOTS } from "../domain/calendar";
import { useSettings } from "../contexts/SettingsContext";
import { Icon } from "./ui";

const STYLES = {
  week: {
    rounded: "rounded-xl",
    px: "px-1.5",
    pySingle: "py-0",
    pyMulti: "py-1",
    leftRight: { left: "4%", right: "4%" },
    missingNotes: "absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85",
    deleteBtn: "delete-btn absolute right-1 bottom-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-5 w-5 rounded bg-red-500/90 hover:bg-red-600 text-white shadow-sm",
    deleteIcon: "w-2.5 h-2.5",
    copyBtn: "copy-btn absolute left-1 bottom-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-5 w-5 rounded bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 shadow-sm",
    copyIcon: "w-2.5 h-2.5",
    resizeTop: "resize-handle absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-t-xl shadow-sm",
    resizeBottom: "resize-handle absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-b-xl shadow-sm",
  },
  day: {
    rounded: "rounded-2xl",
    px: "px-3",
    pySingle: "py-0.5",
    pyMulti: "py-2",
    leftRight: { left: "15%", right: "15%" },
    missingNotes: "absolute right-2 top-2 h-2 w-2 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85",
    deleteBtn: "delete-btn absolute right-2 bottom-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-7 w-7 rounded-lg bg-red-500/90 hover:bg-red-600 text-white shadow-sm",
    deleteIcon: "w-3.5 h-3.5",
    copyBtn: "copy-btn absolute left-2 bottom-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-7 w-7 rounded-lg bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 shadow-sm",
    copyIcon: "w-3.5 h-3.5",
    resizeTop: "resize-handle absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-t-2xl shadow-sm",
    resizeBottom: "resize-handle absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize transition-opacity z-40 opacity-0 group-hover:opacity-100 bg-sky-500 rounded-b-2xl shadow-sm",
  },
};

/**
 * Calcola la posizione e lo span visivi di un blocco in base allo stato drag corrente.
 * Usato sia da WeekView che da DayView.
 *
 * @param {object} block
 * @param {object} dragState - { isMoving, isResizing, isActiveCol, moveTaskBlock, moveTaskDelta,
 *                               resizeTaskBlock, resizeTaskDelta, resizeTaskDirection }
 * @returns {{ currentTopIdx, currentSpan, isGhost, isBeingMoved, isBeingResized }}
 */
export function computeBlockGeometry(block, dragState, daySlots = DAY_SLOTS) {
  const {
    isMoving, isResizing, isActiveCol = true,
    moveTaskBlock, moveTaskDelta,
    resizeTaskBlock, resizeTaskDelta, resizeTaskDirection,
  } = dragState;

  const startIdx = slotIndex(block.start, daySlots);
  const span = block.span || 1;

  const isBeingMoved = isMoving && isActiveCol && moveTaskBlock?.start === block.start;
  const isBeingResized = isResizing && isActiveCol && resizeTaskBlock?.start === block.start;

  let currentTopIdx = startIdx;
  let currentSpan = span;
  let isGhost = false;

  if (isBeingMoved) {
    const newStartIdx = slotIndex(block.start + moveTaskDelta, daySlots);
    if (newStartIdx >= 0) currentTopIdx = newStartIdx;
    isGhost = true;
  } else if (isBeingResized) {
    if (resizeTaskDirection === "top") {
      const newStartIdx = slotIndex(block.start + resizeTaskDelta, daySlots);
      const endIdx = slotIndex(block.end - SLOT_MINUTES, daySlots);
      if (newStartIdx <= endIdx && newStartIdx >= 0) {
        currentTopIdx = newStartIdx;
        currentSpan = endIdx - newStartIdx + 1;
      }
    } else {
      const newEndIdx = slotIndex(block.end + resizeTaskDelta - SLOT_MINUTES, daySlots);
      if (newEndIdx >= startIdx) currentSpan = newEndIdx - startIdx + 1;
    }
  }

  return { currentTopIdx, currentSpan, isGhost, isBeingMoved, isBeingResized };
}

/**
 * Blocco task riutilizzabile per WeekView e DayView.
 *
 * Props:
 *   block            - dati del blocco (start, end, span, entry, label, slot)
 *   currentTopIdx    - indice riga del bordo superiore (pre-calcolato da computeBlockGeometry)
 *   currentSpan      - numero di righe occupate (pre-calcolato)
 *   isGhost          - blocco in stato "grab" (movimento in corso)
 *   isBeingMoved     - questo blocco è in fase di spostamento
 *   isBeingResized   - questo blocco è in fase di resize
 *   isAnyDragging    - qualsiasi drag attivo (disabilita pointer-events)
 *   moveTaskDelta    - delta corrente del movimento (per guard sul click)
 *   resizeTaskDelta  - delta corrente del resize (per guard sul click)
 *   ROW_HEIGHT       - altezza in px di ogni riga
 *   variant          - "week" | "day"
 *   onOpen()         - apre l'editor
 *   onDelete()       - elimina il blocco (null = nascondi tasto)
 *   onMouseDownBlock(e)
 *   onResizeMouseDown(direction)  - "top" | "bottom"
 */
export function TaskBlock({
  block,
  currentTopIdx,
  currentSpan,
  isGhost,
  isBeingMoved,
  isBeingResized,
  isAnyDragging,
  moveTaskDelta,
  resizeTaskDelta,
  ROW_HEIGHT,
  variant = "day",
  onOpen,
  onDelete,
  onCopy,
  onMouseDownBlock,
  onResizeMouseDown,
}) {
  const { settings } = useSettings();
  const clientColors = settings?.clientColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};

  const s = STYLES[variant];
  const badge = badgePresentation(block.entry, clientColors);
  const label = displayLabel(block.entry);

  return (
    <div
      className={
        "group absolute z-20 " + s.rounded + " " + s.px + " shadow-sm flex flex-col justify-center select-none overflow-hidden " +
        (currentSpan === 1 ? s.pySingle + " " : s.pyMulti + " ") +
        badge.className + " " +
        (isGhost ? "opacity-70 scale-[0.98] ring-2 ring-sky-400 cursor-grabbing " : "transition hover:brightness-95 dark:hover:brightness-110 cursor-grab ") +
        (isAnyDragging ? "pointer-events-none " : "")
      }
      style={{
        top: `${currentTopIdx * ROW_HEIGHT + 1}px`,
        height: `${currentSpan * ROW_HEIGHT - 2}px`,
        ...s.leftRight,
        ...badge.style,
      }}
      onMouseDown={onMouseDownBlock}
      onClick={(e) => {
        if ((isBeingMoved && moveTaskDelta !== 0) || (isBeingResized && resizeTaskDelta !== 0)) return;
        if (e.target.closest(".resize-handle") || e.target.closest(".delete-btn")) return;
        e.stopPropagation();
        onOpen?.();
      }}
      role="button"
      tabIndex={0}
    >
      {hasMissingNotes(block.entry) ? <span className={s.missingNotes} /> : null}

      {variant === "week" ? (
        currentSpan === 1 ? (
          <div className="flex flex-col h-full justify-center overflow-hidden">
            {block.entry.subtypeId && (
              <div className="w-fit h-4 px-1.5 mb-0.5 rounded bg-black/5 dark:bg-white/10 text-[9px] font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300 truncate">
                {getSubtypeLabel(block.entry.type, block.entry.subtypeId, taskSubtypes)}
              </div>
            )}
            <div className="text-[10px] lg:text-[11px] font-bold leading-[1.1] line-clamp-1 truncate">{block.entry.title || label}</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <div className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-wider opacity-70 whitespace-nowrap overflow-hidden text-ellipsis">{block.label}</div>
              {block.entry.subtypeId && (
                <div className="h-4 px-1.5 rounded bg-black/5 dark:bg-white/10 text-[9px] font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300 shrink-0">
                  {getSubtypeLabel(block.entry.type, block.entry.subtypeId, taskSubtypes)}
                </div>
              )}
            </div>
            <div className="mt-0.5 text-[10px] lg:text-xs font-bold leading-tight line-clamp-2">{block.entry.title || label}</div>
          </>
        )
      ) : (
        currentSpan === 1 ? (
          <div className="flex items-center gap-2 overflow-hidden py-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 shrink-0">{block.label}</div>
            {block.entry.subtypeId && (
              <div className="flex items-center h-5 px-2 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300 shrink-0">
                {getSubtypeLabel(block.entry.type, block.entry.subtypeId, taskSubtypes)}
              </div>
            )}
            <div className="text-sm font-bold truncate">{block.entry.title || label}</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{block.label}</div>
              {block.entry.subtypeId && (
                <div className="flex items-center h-5 px-2 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300">
                  {getSubtypeLabel(block.entry.type, block.entry.subtypeId, taskSubtypes)}
                </div>
              )}
            </div>
            <div className="mt-1 text-sm font-bold leading-tight line-clamp-2">{block.entry.title || label}</div>
          </>
        )
      )}

      {onCopy && !isBeingMoved && !isBeingResized ? (
        <button
          type="button"
          className={s.copyBtn}
          title="Copia task"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
        >
          <Icon name="clipboard" className={s.copyIcon} />
        </button>
      ) : null}

      {onDelete && !isBeingMoved && !isBeingResized ? (
        <button
          type="button"
          className={s.deleteBtn}
          title="Elimina task"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Icon name="trash" className={s.deleteIcon} />
        </button>
      ) : null}

      {block.end && typeof block.start === "number" && !isBeingMoved ? (
        <div
          className={s.resizeTop}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeMouseDown?.("top"); }}
        />
      ) : null}

      {block.end && typeof block.start === "number" && !isBeingMoved ? (
        <div
          className={s.resizeBottom}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeMouseDown?.("bottom"); }}
        />
      ) : null}
    </div>
  );
}
