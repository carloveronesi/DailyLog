import { badgeStyle, displayLabel } from "../domain/tasks";

export function DayCell({ date, isCurrentMonth, isWeekend, entries, onClick }) {
  const d = date.getDate();
  const am = entries?.AM;
  const pm = entries?.PM;
  const isFullDay = am && pm && JSON.stringify(am) === JSON.stringify(pm);
  const isWeekendDay = isCurrentMonth && isWeekend;
  const isClickable = isCurrentMonth && !isWeekend && typeof onClick === "function";

  const base =
    "rounded-[22px] border p-3 transition-all duration-200 select-none min-h-[132px] flex flex-col gap-2";
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
              className={"flex-1 rounded-xl flex items-center justify-center px-1.5 py-1 min-h-[44px] shadow-sm transition-transform hover:scale-[1.01] " + badgeStyle(am.type)}>
              <div className="w-full text-center truncate text-sm font-bold tracking-tight">
                {displayLabel(am)}
              </div>
            </div>
          ) : (
            <>
              {am ? (
                <div
                  onClick={(e) => handleSlotClick(e, "AM")}
                  className={"flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + badgeStyle(am.type)}>
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
                  className={"flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + badgeStyle(pm.type)}>
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
