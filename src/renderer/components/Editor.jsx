import { useEffect, useRef, useState } from "react";
import {
  LOCATION_TYPES,
  SLOT_MINUTES,
  defaultEntry,
  hourKey,
  hourLabel,
  isSameTaskEntry,
  normalizeForType,
  slotMinutes,
} from "../domain/tasks";
import { Button, Icon } from "./ui";
import { EntryForm } from "./EntryForm";
import { RecurringTaskSection } from "./RecurringTaskSection";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";

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


function initFromExisting(existingEntries, workSlots) {
  const hours = existingEntries?.hours || {};
  const entryAM = existingEntries?.AM ? { ...defaultEntry(), ...existingEntries.AM } : defaultEntry();
  const entryPM = existingEntries?.PM ? { ...defaultEntry(), ...existingEntries.PM } : defaultEntry();

  const allHourEntries = {};
  for (const h of workSlots) {
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
  const { MORNING_SLOTS, AFTERNOON_SLOTS, WORK_SLOTS } = useWorkSlots();
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
  const [location, setLocation] = useState(existingEntries?.location || settings?.defaultLocation || LOCATION_TYPES.REMOTE);
  const [autoAdjusted, setAutoAdjusted] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const init = initFromExisting(existingEntries, WORK_SLOTS);
    setEntryAM(init.entryAM);
    setEntryPM(init.entryPM);
    setHourEntries(init.hourEntries);
    setFullDay(init.fullDay);
    setLocation(existingEntries?.location || settings?.defaultLocation || LOCATION_TYPES.REMOTE);

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

  const morningEnd = settings.workHours?.morningEnd ?? (13 * 60);
  const afternoonEnd = settings.workHours?.afternoonEnd ?? (18 * 60);
  const startSection = rangeStartMin < morningEnd ? "AM" : "PM";
  const sectionStartOptions = startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS;
  const sectionEndBoundary = startSection === "AM" ? morningEnd : afternoonEnd;
  const endOptions = buildEndOptions(rangeStartMin, [...new Set([...sectionStartOptions.map((v) => v + SLOT_MINUTES), sectionEndBoundary])]);

  useEffect(() => {
    const sectionMax = rangeStartMin < morningEnd ? morningEnd : afternoonEnd;
    if (rangeEndMin <= rangeStartMin || rangeEndMin > sectionMax) {
      const fallback = rangeStartMin + SLOT_MINUTES;
      setRangeEndMin(fallback);
      setAutoAdjusted(true);
      const timer = setTimeout(() => setAutoAdjusted(false), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [rangeStartMin, rangeEndMin, morningEnd, afternoonEnd]);

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
    setSaveError(null);
    try {
      if (fullDay) {
        if (hasMeaning(entryAM)) {
          const cleanAM = normalizeForType(entryAM);
          if (!cleanAM.title?.trim()) {
            setSaveError("Il titolo è obbligatorio");
            return;
          }
          onSave({ AM: cleanAM, PM: cleanAM, location, hours: undefined });
          return;
        }
        onSave({ AM: null, PM: null, location, hours: undefined });
        return;
      }

      const nextHours = {};
      for (const [key, entry] of Object.entries(hourEntries)) {
        if (!hasMeaning(entry)) continue;
        const normalized = normalizeForType(entry);
        if (!normalized.title?.trim()) {
          setSaveError("Il titolo è obbligatorio");
          return;
        }
        nextHours[key] = normalized;
      }

      onSave({ AM: null, PM: null, location, hours: Object.keys(nextHours).length > 0 ? nextHours : undefined });
    } catch (err) {
      setSaveError(err?.message || "Errore durante il salvataggio");
    }
  }

  const rangeDuration = formatDurationHours(Math.max(rangeEndMin - rangeStartMin, SLOT_MINUTES));

  const activeNormalized = normalizeForType(activeEntry);
  const isSaveDisabled = !activeNormalized.title?.trim();

  const entryFormProps = {
    entry: activeEntry,
    onChange: handleEntryChange,
    topClients, allClients, allPeople, onSavePeople,
    fullDay, setFullDay,
    rangeStartMin, setRangeStartMin,
    rangeEndMin, setRangeEndMin,
    startSection, endOptions, rangeDuration, autoAdjusted, hourLabel,
    location, setLocation,
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 max-w-screen-xl w-full mx-auto">
      {/* Titolo full-width */}
      <div className="flex items-center gap-3 pb-4 border-b border-si-border mb-4 shrink-0">
        <div className="w-[3px] self-stretch rounded-full bg-si-accent shrink-0" />
        <input
          className="flex-1 bg-transparent text-2xl font-bold text-si-ink placeholder:text-si-grayLight focus:outline-none"
          value={activeEntry.title}
          onChange={(e) => handleEntryChange({ ...activeEntry, title: e.target.value })}
          placeholder="Titolo del task..."
          autoFocus
        />
      </div>

      {/* Body: due colonne scrollabili */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1fr)_1.6fr] gap-x-8 items-start pb-4">
          {/* Colonna sinistra: metadata + ricorrenza */}
          <div className="flex flex-col gap-4">
            <EntryForm {...entryFormProps} column="right" />
            <RecurringTaskSection
              date={date}
              fullDay={fullDay}
              entryAM={entryAM}
              draftEntry={draftEntry}
              rangeStartMin={rangeStartMin}
              rangeEndMin={rangeEndMin}
            />
          </div>
          {/* Colonna destra: note, feedback, trascrizione */}
          <div className="flex flex-col gap-4 lg:border-l lg:border-si-border lg:pl-8">
            <EntryForm {...entryFormProps} column="left" />
          </div>
        </div>
      </div>

      {/* Scroll fade indicator */}
      <div className="shrink-0 -mx-5 h-8 bg-gradient-to-t from-si-bg to-transparent pointer-events-none" />

      {/* Footer sticky */}
      <div className="shrink-0 -mx-5 -mb-5 px-5 pb-5 pt-4 bg-si-bg/95 border-t border-si-border flex items-center justify-between gap-3 rounded-b-[20px]">
        <div className="flex items-center gap-3">
          <button
            className="px-8 py-2.5 text-base font-bold text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 6px 16px rgba(99,102,241,0.32)" }}
            onClick={handleSave}
            type="button"
            disabled={isSaveDisabled}
          >
            Salva
          </button>
          {saveError && (
            <span className="text-sm text-si-rose">{saveError}</span>
          )}
        </div>
        {fullDay ? (
          <Button
            className="bg-transparent text-si-gray border border-si-border hover:bg-si-rose/10 hover:text-si-rose hover:border-si-rose/30 transition-all font-medium"
            onClick={onDeleteDay}
            type="button"
          >
            <Icon name="trash" className="mr-2" />
            Elimina giornata
          </Button>
        ) : (
          <Button
            className="bg-transparent text-si-gray border border-si-border hover:bg-si-rose/10 hover:text-si-rose hover:border-si-rose/30 transition-all font-medium"
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
