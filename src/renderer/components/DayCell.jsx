import { badgeStyle, displayLabel } from "../domain/tasks";

export function DayCell({ date, isCurrentMonth, isWeekend, entries, onClick }) {
  const d = date.getDate();
  const am = entries?.AM;
  const pm = entries?.PM;
  const isFullDay = am && pm && JSON.stringify(am) === JSON.stringify(pm);

  const base =
    "rounded-[22px] border p-3 transition-all duration-200 cursor-pointer select-none min-h-[132px] flex flex-col gap-2";
  const bg = !isCurrentMonth
    ? "bg-slate-300/70 border-slate-400 text-slate-600"
    : "bg-white/88 border-slate-200/90 hover:shadow-soft hover:-translate-y-[1px]";

  const dayNumCls = !isCurrentMonth
    ? "text-sm font-semibold text-slate-600"
    : "text-sm font-semibold " + (isWeekend ? "text-rose-600" : "text-slate-700");

  return (
    <div className={base + " " + bg} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className={dayNumCls}>{d}</div>
        {isCurrentMonth && (am || pm) ? (
          <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            modifica
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {isFullDay ? (
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-50 to-white px-2.5 py-2.5 flex items-center justify-center">
            <div
              className={
                "inline-flex max-w-full truncate rounded-xl px-3 py-1.5 text-sm font-semibold " +
                badgeStyle(am.type)
              }
            >
              {displayLabel(am)}
            </div>
          </div>
        ) : (
          <>
            {am ? (
              <div className="rounded-xl bg-slate-50/90 px-2 py-2">
                <div
                  className={
                    "inline-flex max-w-full truncate rounded-lg px-2 py-1 text-xs font-semibold " +
                    badgeStyle(am.type)
                  }
                >
                  {displayLabel(am)}
                </div>
              </div>
            ) : null}

            {pm ? (
              <div className="rounded-xl bg-slate-50/90 px-2 py-2">
                <div
                  className={
                    "inline-flex max-w-full truncate rounded-lg px-2 py-1 text-xs font-semibold " +
                    badgeStyle(pm.type)
                  }
                >
                  {displayLabel(pm)}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
