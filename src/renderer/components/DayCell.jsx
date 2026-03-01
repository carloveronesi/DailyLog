import { badgePresentation, displayLabel, isSameTaskEntry } from "../domain/tasks";

function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

function MissingNotesLed() {
  return (
    <div
      className="absolute right-[0.3rem] top-[0.3rem] z-10 group"
      title="Mancano i dettagli del log"
      aria-label="Mancano i dettagli del log"
    >
      <span
        aria-hidden="true"
        className="block h-2.5 w-2.5 rounded-full border border-[#F2A19A] bg-[#FFF9F8] dark:border-[#E88D86] dark:bg-slate-800/85"
      />
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900">
        Mancano i dettagli del log
      </div>
    </div>
  );
}

export function DayCell({ date, isCurrentMonth, isWeekend, entries, onClick, clientColors = {} }) {
  const d = date.getDate();
  const am = entries?.AM;
  const pm = entries?.PM;
  const isFullDay = isSameTaskEntry(am, pm);
  const isWeekendDay = isCurrentMonth && isWeekend;
  const isClickable = isCurrentMonth && !isWeekend && typeof onClick === "function";
  const amBadge = badgePresentation(am, clientColors);
  const pmBadge = badgePresentation(pm, clientColors);

  const base =
    "rounded-[22px] border p-3 transition-all duration-200 select-none min-h-[100px] lg:min-h-0 lg:h-full flex flex-col gap-2";
  const cursor = isClickable ? "cursor-pointer" : "cursor-default";
  const bg = !isCurrentMonth
    ? "bg-slate-300/70 border-slate-400 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-500"
    : isWeekendDay
      ? "bg-rose-100/70 border-rose-200/90 text-slate-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-slate-300"
      : "bg-white/88 border-slate-200/90 hover:shadow-soft hover:-translate-y-[1px] dark:bg-slate-800/90 dark:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-black/20";

  const dayNumCls = !isCurrentMonth
    ? "text-sm font-semibold text-slate-600 dark:text-slate-500"
    : "text-sm font-semibold " + (isWeekend ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300");

  const handleSlotClick = (e, slot) => {
    e.stopPropagation();
    if (!isClickable) return;
    onClick(slot);
  };

  return (
    <div className={base + " " + cursor + " " + bg} onClick={isClickable ? () => onClick() : undefined}>
      <div className="flex items-center justify-between px-0.5">
        <div className={dayNumCls}>{d}</div>
      </div>

      {isCurrentMonth && !isWeekend ? (
        <div className="flex flex-1 flex-col gap-1.5 mt-1.5">
          {isFullDay ? (
            <div
              onClick={(e) => handleSlotClick(e, "AM")}
              className={"relative flex-1 rounded-xl flex items-center justify-center px-1.5 py-1 min-h-[44px] shadow-sm transition-transform hover:scale-[1.01] " + amBadge.className}
              style={amBadge.style}
            >
              {hasMissingNotes(am) ? <MissingNotesLed /> : null}
              <div className="w-full text-center truncate text-sm font-bold tracking-tight">
                {displayLabel(am)}
              </div>
            </div>
          ) : (
            <>
              {am ? (
                <div
                  onClick={(e) => handleSlotClick(e, "AM")}
                  className={"relative flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + amBadge.className}
                  style={amBadge.style}
                >
                  {hasMissingNotes(am) ? <MissingNotesLed /> : null}
                  <div className="w-full text-center text-ellipsis overflow-hidden text-[11.5px] font-bold leading-tight">
                    {displayLabel(am)}
                  </div>
                </div>
              ) : (
                <div
                  onClick={(e) => handleSlotClick(e, "AM")}
                  className="flex-1 rounded border border-dashed border-slate-300/80 hover:bg-slate-100/50 dark:border-slate-600/60 dark:hover:bg-slate-700/30 transition-colors opacity-60 min-h-[36px]" />
              )}

              {pm ? (
                <div
                  onClick={(e) => handleSlotClick(e, "PM")}
                  className={"relative flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + pmBadge.className}
                  style={pmBadge.style}
                >
                  {hasMissingNotes(pm) ? <MissingNotesLed /> : null}
                  <div className="w-full text-center text-ellipsis overflow-hidden text-[11.5px] font-bold leading-tight">
                    {displayLabel(pm)}
                  </div>
                </div>
              ) : (
                <div
                  onClick={(e) => handleSlotClick(e, "PM")}
                  className="flex-1 rounded border border-dashed border-slate-300/80 hover:bg-slate-100/50 dark:border-slate-600/60 dark:hover:bg-slate-700/30 transition-colors opacity-60 min-h-[36px]" />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
