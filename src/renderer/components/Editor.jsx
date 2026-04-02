import { useEffect, useRef, useState } from "react";
import {
  AFTERNOON_SLOTS,
  LOCATION_TYPES,
  MORNING_SLOTS,
  SLOT_MINUTES,
  WORK_SLOTS,
  defaultEntry,
  hourKey,
  hourLabel,
  isSameTaskEntry,
  slotMinutes,
} from "../domain/tasks";
import { Button, Icon } from "./ui";
import { EntryForm } from "./EntryForm";
import { useSettings } from "../contexts/SettingsContext";

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
  const entryAM = existingEntries?.AM ? { ...defaultEntry(), ...existingEntries.AM } : defaultEntry();
  const entryPM = existingEntries?.PM ? { ...defaultEntry(), ...existingEntries.PM } : defaultEntry();

  const allHourEntries = {};
  for (const h of WORK_SLOTS) {
    const k = hourKey(h);
    const existing = hours[k];
    allHourEntries[k] = existing ? { ...defaultEntry(), ...existing } : defaultEntry();
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

function buildEndOptions(startMinute, sectionBoundaries) {
  const options = [];
  for (const end of sectionBoundaries) {
    if (end > startMinute) options.push(end);
  }
  return options;
}

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [], initialSlot, initialRange, allPeople = [], onSavePeople, allClients = [] }) {
  const { settings } = useSettings();
  const clientColors = settings?.clientColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};
  const initialSlotMin = typeof initialSlot === "number" || typeof initialSlot === "string" ? slotMinutes(initialSlot) : null;
  const initialRangeStart = initialRange?.start ?? initialSlotMin;
  const initialRangeEnd = initialRange?.end ?? null;

  const [entryAM, setEntryAM] = useState(defaultEntry());
  const [entryPM, setEntryPM] = useState(defaultEntry());
  const [hourEntries, setHourEntries] = useState(() => {
    const init = {};
    for (const h of WORK_SLOTS) init[hourKey(h)] = defaultEntry();
    return init;
  });
  const [draftEntry, setDraftEntry] = useState(defaultEntry());
  const lastRangeRef = useRef({ start: MORNING_SLOTS[0], end: MORNING_SLOTS[0] + SLOT_MINUTES });
  const isInitializingRef = useRef(false);
  const [rangeStartMin, setRangeStartMin] = useState(MORNING_SLOTS[0]);
  const [rangeEndMin, setRangeEndMin] = useState(MORNING_SLOTS[0] + SLOT_MINUTES);
  const [fullDay, setFullDay] = useState(false);
  const [location, setLocation] = useState(existingEntries?.location || LOCATION_TYPES.REMOTE);
  const [autoAdjusted, setAutoAdjusted] = useState(false);

  useEffect(() => {
    const init = initFromExisting(existingEntries);
    setEntryAM(init.entryAM);
    setEntryPM(init.entryPM);
    setHourEntries(init.hourEntries);
    setFullDay(init.fullDay);
    setLocation(existingEntries?.location || LOCATION_TYPES.REMOTE);

    const hourKeys = Object.keys(existingEntries?.hours || {}).map(slotMinutes).filter((v) => Number.isFinite(v));
    let start = MORNING_SLOTS[0];
    let end = MORNING_SLOTS[0] + SLOT_MINUTES;

    if (initialRangeStart !== null) {
      start = initialRangeStart;
      end = initialRangeEnd ?? (initialRangeStart + SLOT_MINUTES);
    } else if (hourKeys.length > 0) {
      const sorted = hourKeys.sort((a, b) => a - b);
      start = sorted[0];
      end = sorted[sorted.length - 1] + SLOT_MINUTES;
    } else if (init.fullDay) {
      start = MORNING_SLOTS[0];
      end = AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES;
    } else if (existingEntries?.AM && !existingEntries?.PM) {
      start = MORNING_SLOTS[0];
      end = MORNING_SLOTS[MORNING_SLOTS.length - 1] + SLOT_MINUTES;
    } else if (existingEntries?.PM && !existingEntries?.AM) {
      start = AFTERNOON_SLOTS[0];
      end = AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES;
    }

    isInitializingRef.current = true;
    setRangeStartMin(start);
    setRangeEndMin(end);
    lastRangeRef.current = { start, end };

    const seedEntry = init.fullDay ? init.entryAM : (init.hourEntries[hourKey(start)] || defaultEntry());
    setDraftEntry(seedEntry);
  }, [existingEntries, initialRangeStart, initialRangeEnd]);

  const activeEntry = fullDay ? entryAM : draftEntry;

  const startSection = rangeStartMin < 13 * 60 ? "AM" : "PM";
  const sectionStartOptions = startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS;
  const sectionEndBoundary = startSection === "AM" ? 13 * 60 : 18 * 60;
  const endOptions = buildEndOptions(rangeStartMin, [...new Set([...sectionStartOptions.map((v) => v + SLOT_MINUTES), sectionEndBoundary])]);

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

  useEffect(() => {
    if (isInitializingRef.current) {
      isInitializingRef.current = false;
      return;
    }
    if (fullDay) {
      lastRangeRef.current = { start: rangeStartMin, end: rangeEndMin };
      return;
    }
    const prev = lastRangeRef.current;
    if (prev.start === rangeStartMin && prev.end === rangeEndMin) return;
    setHourEntries((prevEntries) => {
      const next = { ...prevEntries };
      const blank = defaultEntry();
      const prevStart = Math.min(prev.start, prev.end);
      const prevEnd = Math.max(prev.start, prev.end);
      for (let m = prevStart; m < prevEnd; m += SLOT_MINUTES) {
        next[hourKey(m)] = blank;
      }
      if (hasMeaning(draftEntry)) {
        const start = Math.min(rangeStartMin, rangeEndMin);
        const end = Math.max(rangeStartMin, rangeEndMin);
        for (let m = start; m < end; m += SLOT_MINUTES) {
          next[hourKey(m)] = draftEntry;
        }
      }
      return next;
    });
    lastRangeRef.current = { start: rangeStartMin, end: rangeEndMin };
  }, [rangeStartMin, rangeEndMin, draftEntry, fullDay]);

  function handleEntryChange(newEntry) {
    setDraftEntry(newEntry);
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
  function handleDeleteSlot() {
    const nextHours = {};
    const start = Math.min(rangeStartMin, rangeEndMin);
    const end = Math.max(rangeStartMin, rangeEndMin);
    for (const [key, entry] of Object.entries(hourEntries)) {
      const slotMin = WORK_SLOTS.find((s) => hourKey(s) === key);
      if (slotMin !== undefined && slotMin >= start && slotMin < end) continue; 
      if (!hasMeaning(entry)) continue;
      nextHours[key] = normalizeForType(entry);
    }
    onSave({ AM: null, PM: null, location, hours: Object.keys(nextHours).length > 0 ? nextHours : undefined });
  }

  function handleSave() {
    if (fullDay) {
      const cleanAM = hasMeaning(entryAM) ? normalizeForType(entryAM) : null;
      if (!cleanAM) return;
      onSave({ AM: cleanAM, PM: cleanAM, location, hours: undefined });
      return;
    }

    const nextHours = {};
    for (const [key, entry] of Object.entries(hourEntries)) {
      if (!hasMeaning(entry)) continue;
      nextHours[key] = normalizeForType(entry);
    }

    onSave({ AM: null, PM: null, location, hours: Object.keys(nextHours).length > 0 ? nextHours : undefined });
  }

  const rangeDuration = formatDurationHours(Math.max(rangeEndMin - rangeStartMin, SLOT_MINUTES));

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-4">
      <EntryForm
        entry={activeEntry}
        onChange={handleEntryChange}
        topClients={topClients}
        allClients={allClients}
        allPeople={allPeople}
        onSavePeople={onSavePeople}
        fullDay={fullDay}
        setFullDay={setFullDay}
        rangeStartMin={rangeStartMin}
        setRangeStartMin={setRangeStartMin}
        rangeEndMin={rangeEndMin}
        setRangeEndMin={setRangeEndMin}
        startSection={startSection}
        endOptions={endOptions}
        rangeDuration={rangeDuration}
        autoAdjusted={autoAdjusted}
        hourLabel={hourLabel}
      />

      <div className="sticky bottom-0 -mx-5 -mb-5 px-5 pb-5 pt-4 bg-white/95 dark:bg-slate-800/95 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
        <Button
          className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 px-8 py-2.5 text-base font-bold shadow-lg shadow-slate-900/10 dark:shadow-blue-500/10"
          onClick={handleSave}
          type="button"
        >
          Salva
        </Button>

        {fullDay ? (
          <Button
            className="bg-white text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-all font-medium"
            onClick={onDeleteDay}
            type="button"
          >
            <Icon name="trash" className="mr-2" />
            Elimina giornata
          </Button>
        ) : (
          <Button
            className="bg-white text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-all font-medium"
            onClick={handleDeleteSlot}
            type="button"
          >
            <Icon name="trash" className="mr-2" />
            Elimina task
          </Button>
        )}
      </div>
    </div>
  );
}
