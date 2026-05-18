import { useState } from "react";
import { SLOT_MINUTES, displayLabel, hourKey, normalizeForType } from "../domain/tasks";
import { useSettings } from "../contexts/SettingsContext";
import { dowMon0, ymd } from "../utils/date";
import { Icon } from "./ui";

export function RecurringTaskSection({ date, fullDay, entryAM, draftEntry, rangeStartMin, rangeEndMin }) {
  const { settings, setSettings } = useSettings();
  const dow = dowMon0(date);
  const recurringTasks = settings?.recurringTasks || [];

  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [freq, setFreq] = useState("weekly");
  const [recurringDow, setRecurringDow] = useState(dow);
  const [dom, setDom] = useState(date.getDate());
  const [endYmd, setEndYmd] = useState(() => {
    const existing = recurringTasks.find(t => {
      const f = t.frequency || "weekly";
      if (f === "daily") return true;
      if (f === "monthly") return t.dayOfMonth === date.getDate();
      return (t.dowMon0 ?? 0) === dowMon0(date);
    });
    return existing?.endYmd || "";
  });

  const existingRecurring = recurringTasks.find(t => {
    const f = t.frequency || "weekly";
    if (f !== freq) return false;
    if (f === "daily") return true;
    if (f === "monthly") return t.dayOfMonth === dom;
    return (t.dowMon0 ?? 0) === recurringDow;
  }) || null;

  const existingLabel = existingRecurring
    ? displayLabel(existingRecurring.AM || existingRecurring.PM ||
        (existingRecurring.hours ? Object.values(existingRecurring.hours)[0] : null))
    : null;

  function samePatternFilter(t) {
    const f = t.frequency || "weekly";
    if (f !== freq) return true;
    if (f === "daily") return false;
    if (f === "monthly") return t.dayOfMonth !== dom;
    return (t.dowMon0 ?? 0) !== recurringDow;
  }

  function handleSave() {
    let content;
    if (fullDay) {
      const cleanAM = normalizeForType(entryAM);
      if (!cleanAM.title?.trim()) return;
      content = { AM: cleanAM, PM: cleanAM, hours: null };
    } else {
      const cleanEntry = normalizeForType(draftEntry);
      if (!cleanEntry.title?.trim()) return;
      const hours = {};
      const start = Math.min(rangeStartMin, rangeEndMin);
      const end = Math.max(rangeStartMin, rangeEndMin);
      for (let m = start; m < end; m += SLOT_MINUTES) {
        hours[hourKey(m)] = cleanEntry;
      }
      content = { AM: null, PM: null, hours };
    }
    const needsAnchor = freq === "biweekly" || freq === "triweekly";
    const newTask = {
      id: Date.now().toString(),
      frequency: freq,
      dowMon0: freq !== "daily" && freq !== "monthly" ? recurringDow : null,
      dayOfMonth: freq === "monthly" ? dom : null,
      anchorYmd: needsAnchor ? ymd(date) : null,
      endYmd: endYmd || null,
      ...content,
    };
    setSettings(prev => ({
      ...prev,
      recurringTasks: [...(prev.recurringTasks || []).filter(samePatternFilter), newTask],
    }));
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  }

  function handleRemove() {
    setSettings(prev => ({
      ...prev,
      recurringTasks: (prev.recurringTasks || []).filter(samePatternFilter),
    }));
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 flex flex-col gap-2.5 transition-colors ${feedback ? "border-si-success/30 bg-si-success/5" : "border-si-border bg-si-muted"}`}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 min-w-0 border-0 bg-transparent cursor-pointer"
        >
          <Icon name="repeat" className={`w-4 h-4 shrink-0 transition-colors ${feedback ? "text-si-success" : "text-si-gray"}`} />
          <span className={`text-xs font-semibold transition-colors ${feedback ? "text-si-success" : "text-si-inkSoft"}`}>
            {feedback ? "Modello salvato!" : "Ripeti"}
          </span>
          {existingRecurring && !open && !feedback && (
            <span className="text-xs font-normal text-si-grayLight italic truncate">— {existingLabel}</span>
          )}
          <Icon name={open ? "chev-up" : "chev-down"} className="w-3.5 h-3.5 text-si-gray shrink-0" />
        </button>
        {open && (
          <div className="flex items-center gap-3 shrink-0">
            {existingRecurring ? (
              <>
                <button type="button" onClick={handleSave} className="text-xs font-semibold text-si-accent hover:text-si-accentDark transition-colors border-0 bg-transparent cursor-pointer">Aggiorna</button>
                <button type="button" onClick={handleRemove} className="text-xs font-semibold text-si-gray hover:text-si-rose transition-colors border-0 bg-transparent cursor-pointer">Rimuovi</button>
              </>
            ) : (
              <button type="button" onClick={handleSave} className="text-xs font-semibold text-si-accent hover:text-si-accentDark transition-colors border-0 bg-transparent cursor-pointer">Salva modello</button>
            )}
          </div>
        )}
      </div>
      {open && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={freq}
              onChange={e => setFreq(e.target.value)}
              className="text-xs rounded-lg border border-si-border bg-si-surface px-2 py-1 font-medium text-si-inkSoft cursor-pointer outline-none"
            >
              <option value="daily">Ogni giorno (lun-ven)</option>
              <option value="weekly">Ogni settimana</option>
              <option value="biweekly">Ogni 2 settimane</option>
              <option value="triweekly">Ogni 3 settimane</option>
              <option value="monthly">Ogni mese</option>
            </select>
            {(freq === "weekly" || freq === "biweekly" || freq === "triweekly") && (
              <select
                value={recurringDow}
                onChange={e => setRecurringDow(Number(e.target.value))}
                className="text-xs rounded-lg border border-si-border bg-si-surface px-2 py-1 font-medium text-si-inkSoft cursor-pointer outline-none"
              >
                {[["Lunedì", 0], ["Martedì", 1], ["Mercoledì", 2], ["Giovedì", 3], ["Venerdì", 4]].map(([lbl, v]) => (
                  <option key={v} value={v}>{lbl}</option>
                ))}
              </select>
            )}
            {freq === "monthly" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-si-gray">giorno</span>
                <input
                  type="number" min={1} max={31}
                  value={dom}
                  onChange={e => setDom(Math.max(1, Math.min(31, Number(e.target.value))))}
                  className="text-xs w-14 rounded-lg border border-si-border bg-si-surface px-2 py-1 font-medium text-si-inkSoft outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-si-gray">Fino al</span>
            <input
              type="date"
              value={endYmd}
              onChange={e => setEndYmd(e.target.value)}
              min={ymd(date)}
              className="text-xs rounded-lg border border-si-border bg-si-surface px-2 py-1 font-medium text-si-inkSoft outline-none"
            />
            {endYmd && (
              <button type="button" onClick={() => setEndYmd("")} className="text-xs text-si-gray hover:text-si-rose transition-colors border-0 bg-transparent cursor-pointer">Rimuovi</button>
            )}
            {!endYmd && (
              <span className="text-xs text-si-grayLight italic">nessuna scadenza</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
