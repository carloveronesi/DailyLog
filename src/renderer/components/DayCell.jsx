import { badgePresentation, displayLabel, hasMorningHours, hasAfternoonHours, hourKey, hourLabel, isSameTaskEntry, MORNING_HOURS, AFTERNOON_HOURS } from "../domain/tasks";

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

function HourStrip({ hour, entry, onClick, clientColors }) {
  const badge = badgePresentation(entry, clientColors);
  if (!entry) {
    return (
      <div
        onClick={onClick}
        className="flex-1 rounded border border-dashed border-slate-300/80 hover:bg-slate-100/50 dark:border-slate-600/60 dark:hover:bg-slate-700/30 transition-colors opacity-60"
        title={hourLabel(hour)}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      className={"relative flex-1 rounded flex items-center justify-center px-1 min-h-0 shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + badge.className}
      style={badge.style}
      title={hourLabel(hour) + " — " + displayLabel(entry)}
    >
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="w-full text-center text-ellipsis overflow-hidden text-[9px] font-bold leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function HalfBlock({ entry, slot, onClick, clientColors, emptyClass }) {
  const badge = badgePresentation(entry, clientColors);
  if (!entry) {
    return (
      <div
        onClick={onClick}
        className={"flex-1 rounded border border-dashed border-slate-300/80 hover:bg-slate-100/50 dark:border-slate-600/60 dark:hover:bg-slate-700/30 transition-colors opacity-60 min-h-[36px] " + (emptyClass || "")}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      className={"relative flex-1 rounded flex items-center justify-center px-1.5 py-1 min-h-[36px] shadow-sm hover:brightness-95 dark:hover:brightness-110 transition-all " + badge.className}
      style={badge.style}
    >
      {hasMissingNotes(entry) ? <MissingNotesLed /> : null}
      <div className="w-full text-center text-ellipsis overflow-hidden text-[11.5px] font-bold leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

export function DayCell({ date, isCurrentMonth, isWeekend, entries, onClick, clientColors = {} }) {
  const d = date.getDate();
  const am = entries?.AM;
  const pm = entries?.PM;
  const morningHoursActive = hasMorningHours(entries);
  const afternoonHoursActive = hasAfternoonHours(entries);

  // Full day: AM === PM, no hourly entries
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  const isWeekendDay = isCurrentMonth && isWeekend;
  const isClickable = isCurrentMonth && !isWeekend && typeof onClick === "function";

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

  const handleClick = (e, slot) => {
    e.stopPropagation();
    if (!isClickable) return;
    onClick(slot);
  };

  const amBadge = badgePresentation(am, clientColors);

  return (
    <div className={base + " " + cursor + " " + bg} onClick={isClickable ? () => onClick() : undefined}>
      <div className="flex items-center justify-between px-0.5">
        <div className={dayNumCls}>{d}</div>
      </div>

      {isCurrentMonth && !isWeekend ? (
        <div className="flex flex-1 flex-col gap-1.5 mt-1.5">
          {isFullDay ? (
            // Full day: single large block
            <div
              onClick={(e) => handleClick(e, "AM")}
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
              {/* Morning section */}
              {morningHoursActive ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {MORNING_HOURS.map((h) => {
                    const key = hourKey(h);
                    const entry = entries?.hours?.[key] || null;
                    return (
                      <HourStrip
                        key={h}
                        hour={h}
                        entry={entry}
                        onClick={(e) => handleClick(e, h)}
                        clientColors={clientColors}
                      />
                    );
                  })}
                </div>
              ) : (
                <HalfBlock
                  entry={am}
                  slot="AM"
                  onClick={(e) => handleClick(e, "AM")}
                  clientColors={clientColors}
                />
              )}

              {/* Afternoon section */}
              {afternoonHoursActive ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {AFTERNOON_HOURS.map((h) => {
                    const key = hourKey(h);
                    const entry = entries?.hours?.[key] || null;
                    return (
                      <HourStrip
                        key={h}
                        hour={h}
                        entry={entry}
                        onClick={(e) => handleClick(e, h)}
                        clientColors={clientColors}
                      />
                    );
                  })}
                </div>
              ) : (
                <HalfBlock
                  entry={pm}
                  slot="PM"
                  onClick={(e) => handleClick(e, "PM")}
                  clientColors={clientColors}
                />
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
