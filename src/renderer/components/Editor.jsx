import { useEffect, useMemo, useState } from "react";
import {
  AFTERNOON_SLOTS,
  MORNING_SLOTS,
  SLOT_MINUTES,
  TASK_TYPES,
  WORK_SLOTS,
  badgePresentation,
  defaultEntry,
  displayLabel,
  hourKey,
  hourLabel,
  isSameTaskEntry,
  slotMinutes,
} from "../domain/tasks";
import { pad2 } from "../utils/date";
import { Button, Icon } from "./ui";

function hasMeaning(e) {
  if (!e) return false;
  return (
    (e.title && e.title.trim()) ||
    (e.client && e.client.trim()) ||
    (e.notes && e.notes.trim()) ||
    (e.wentWrong && e.wentWrong.trim()) ||
    (e.nextSteps && e.nextSteps.trim()) ||
    e.type === "vacation"
  );
}

function normalizeForType(e) {
  const t = e.type;
  const out = { ...e };
  if (t !== "client") out.client = "";
  if (t === "vacation" && !out.title.trim()) out.title = "Ferie";
  if (t === "internal" && !out.title.trim()) out.title = "Internal";
  if (t === "event" && !out.title.trim()) out.title = "Evento";
  return out;
}

function initFromExisting(existingEntries) {
  const hours = existingEntries?.hours || {};
  const entryAM = existingEntries?.AM || defaultEntry();
  const entryPM = existingEntries?.PM || defaultEntry();

  const allHourEntries = {};
  for (const h of WORK_SLOTS) {
    const k = hourKey(h);
    allHourEntries[k] = hours[k] || defaultEntry();
  }

  const fullDay =
    existingEntries?.AM &&
    existingEntries?.PM &&
    isSameTaskEntry(existingEntries.AM, existingEntries.PM);

  return { entryAM, entryPM, hourEntries: allHourEntries, fullDay };
}

function formatDurationHours(minutes) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function EntryForm({ entry, onChange, topClients, clientColors }) {
  const setField = (k, v) => onChange({ ...entry, [k]: v });
  const badge = badgePresentation(entry, clientColors);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tipo</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
            value={entry.type}
            onChange={(e) => setField("type", e.target.value)}
          >
            {TASK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {entry.type === "client" ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cliente</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              value={entry.client}
              onChange={(e) => setField("client", e.target.value)}
              placeholder="Es. Generali"
            />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Titolo task</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              value={entry.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Es. Refactor codice"
            />
            {topClients.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topClients.map((clientName) => {
                  const isSelected = (entry.client || "").trim().toLowerCase() === clientName.toLowerCase();
                  return (
                    <button
                      key={clientName}
                      type="button"
                      onClick={() => setField("client", clientName)}
                      className={
                        "rounded-full px-3 py-1 text-[11px] font-bold transition " +
                        (isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700")
                      }
                    >
                      {clientName}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Titolo</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              value={entry.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder={entry.type === "event" ? "Es. Meetup" : "Es. Support"}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5 flex flex-col h-full min-h-[120px]">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Note</label>
        <textarea
          className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
          value={entry.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Dettagli..."
        />
      </div>

      <div className="space-y-3 md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cosa è andato male</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              rows={3}
              value={entry.wentWrong}
              onChange={(e) => setField("wentWrong", e.target.value)}
              placeholder="Blocchi, criticità, errori..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Next steps</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              rows={3}
              value={entry.nextSteps}
              onChange={(e) => setField("nextSteps", e.target.value)}
              placeholder="Azioni concrete per andare avanti..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildEndOptions(startMinute, sectionBoundaries) {
  const options = [];
  for (const end of sectionBoundaries) {
    if (end > startMinute) options.push(end);
  }
  return options;
}

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [], initialSlot, initialRange, clientColors = {} }) {
  const initialSlotMin = typeof initialSlot === "number" || typeof initialSlot === "string" ? slotMinutes(initialSlot) : null;
  const initialRangeStart = initialRange?.start ?? initialSlotMin;

  const [entryAM, setEntryAM] = useState(defaultEntry());
  const [entryPM, setEntryPM] = useState(defaultEntry());
  const [hourEntries, setHourEntries] = useState(() => {
    const init = {};
    for (const h of WORK_SLOTS) init[hourKey(h)] = defaultEntry();
    return init;
  });
  const [rangeStartMin, setRangeStartMin] = useState(MORNING_SLOTS[0]);
  const [rangeEndMin, setRangeEndMin] = useState(MORNING_SLOTS[0] + SLOT_MINUTES);
  const [fullDay, setFullDay] = useState(false);
  const [autoAdjusted, setAutoAdjusted] = useState(false);

  useEffect(() => {
    const init = initFromExisting(existingEntries);
    setEntryAM(init.entryAM);
    setEntryPM(init.entryPM);
    setHourEntries(init.hourEntries);
    setFullDay(init.fullDay);

    const hourKeys = Object.keys(existingEntries?.hours || {}).map(slotMinutes).filter((v) => Number.isFinite(v));
    if (hourKeys.length > 0) {
      const sorted = hourKeys.sort((a, b) => a - b);
      const start = sorted[0];
      const end = sorted[sorted.length - 1] + SLOT_MINUTES;
      setRangeStartMin(start);
      setRangeEndMin(end);
    } else if (init.fullDay) {
      setRangeStartMin(MORNING_SLOTS[0]);
      setRangeEndMin(AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES);
    } else if (existingEntries?.AM && !existingEntries?.PM) {
      setRangeStartMin(MORNING_SLOTS[0]);
      setRangeEndMin(MORNING_SLOTS[MORNING_SLOTS.length - 1] + SLOT_MINUTES);
    } else if (existingEntries?.PM && !existingEntries?.AM) {
      setRangeStartMin(AFTERNOON_SLOTS[0]);
      setRangeEndMin(AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES);
    }
  }, [existingEntries]);

  useEffect(() => {
    if (initialRangeStart !== null) {
      setFullDay(false);
      setRangeStartMin(initialRangeStart);
      setRangeEndMin((initialRange?.end ?? (initialRangeStart + SLOT_MINUTES)));
    }
  }, [initialRangeStart, initialRange]);

  const activeEntry = useMemo(() => {
    if (!fullDay) {
      const k = hourKey(rangeStartMin);
      return hourEntries[k] || defaultEntry();
    }
    return entryAM;
  }, [fullDay, entryAM, hourEntries, rangeStartMin]);

  const startSection = rangeStartMin < 13 * 60 ? "AM" : "PM";
  const sectionStartOptions = startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS;
  const sectionEndBoundary = startSection === "AM" ? 13 * 60 : 18 * 60;
  const endOptions = buildEndOptions(rangeStartMin, [...sectionStartOptions.map((v) => v + SLOT_MINUTES), sectionEndBoundary]);

  useEffect(() => {
    if (rangeEndMin <= rangeStartMin) {
      const fallback = rangeStartMin + SLOT_MINUTES;
      setRangeEndMin(fallback);
      setAutoAdjusted(true);
      const timer = setTimeout(() => setAutoAdjusted(false), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [rangeStartMin, rangeEndMin]);

  function handleEntryChange(newEntry) {
    if (fullDay) {
      setEntryAM(newEntry);
      setEntryPM(newEntry);
      return;
    }
    setHourEntries((prev) => {
      const next = { ...prev };
      const start = Math.min(rangeStartMin, rangeEndMin);
      const end = Math.max(rangeStartMin, rangeEndMin);
      for (let m = start; m < end; m += SLOT_MINUTES) {
        next[hourKey(m)] = newEntry;
      }
      return next;
    });
  }

  function handleSave() {
    if (fullDay) {
      const cleanAM = hasMeaning(entryAM) ? normalizeForType(entryAM) : null;
      if (!cleanAM) return;
      onSave({ AM: cleanAM, PM: cleanAM, hours: undefined });
      return;
    }

    const nextHours = {};
    for (const [key, entry] of Object.entries(hourEntries)) {
      if (!hasMeaning(entry)) continue;
      nextHours[key] = normalizeForType(entry);
    }

    onSave({ AM: null, PM: null, hours: Object.keys(nextHours).length > 0 ? nextHours : undefined });
  }
  const fmt = (d) => {
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  const rangeDuration = formatDurationHours(Math.max(rangeEndMin - rangeStartMin, SLOT_MINUTES));

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-500 font-medium">{fmt(date)}</div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Giornata intera</div>
          <button
            type="button"
            onClick={() => setFullDay((prev) => !prev)}
            className={
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none " +
              (fullDay ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")
            }
          >
            <span
              className={
                "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " +
                (fullDay ? "translate-x-6" : "translate-x-1")
              }
            />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[180px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di inizio</div>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={rangeStartMin}
                onChange={(e) => setRangeStartMin(Number(e.target.value))}
                disabled={fullDay}
              >
                {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map((slot) => (
                  <option key={slot} value={slot}>
                    {hourLabel(slot)}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di fine</div>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={rangeEndMin}
                onChange={(e) => setRangeEndMin(Number(e.target.value))}
                disabled={fullDay}
              >
                {endOptions.map((end) => (
                  <option key={end} value={end}>
                    {hourLabel(end)}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-auto">
              {hourLabel(rangeStartMin)} - {hourLabel(rangeEndMin)} ({rangeDuration}h)
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="absolute top-0 h-full rounded-full bg-slate-900 dark:bg-blue-500"
                style={{
                  left: `${((rangeStartMin - MORNING_SLOTS[0]) / (18 * 60 - MORNING_SLOTS[0])) * 100}%`,
                  width: `${((rangeEndMin - rangeStartMin) / (18 * 60 - MORNING_SLOTS[0])) * 100}%`,
                }}
              />
            </div>
            {autoAdjusted ? (
              <div className="text-[11px] font-semibold text-amber-600">Fine aggiornata</div>
            ) : null}
          </div>
        </div>

        <EntryForm
          entry={activeEntry}
          onChange={handleEntryChange}
          topClients={topClients}
          clientColors={clientColors}
        />

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 px-8 py-2.5 text-base font-bold shadow-lg shadow-slate-900/10 dark:shadow-blue-500/10"
            onClick={handleSave}
            type="button"
          >
            Salva
          </Button>

          <Button
            className="bg-white text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-all font-medium"
            onClick={onDeleteDay}
            type="button"
          >
            <Icon name="trash" className="mr-2" />
            Elimina
          </Button>
        </div>
      </div>
    </div>
  );
}
