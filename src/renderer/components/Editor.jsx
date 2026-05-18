import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCATION_TYPES,
  SLOT_MINUTES,
  defaultEntry,
  hourKey,
  hourLabel,
  isSameTaskEntry,
  normalizeClientKey,
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


function seedDefaultEntry(topClients, lastUsedByClient) {
  const base = defaultEntry();
  const topClient = topClients?.[0];
  if (!topClient) return base;
  const key = normalizeClientKey(topClient);
  const last = lastUsedByClient?.[key] || {};
  return {
    ...base,
    client: topClient,
    subtypeId: last.subtypeId ?? null,
    milestone: last.milestone ?? null,
  };
}

function initFromExisting(existingEntries, workSlots, seed) {
  const hours = existingEntries?.hours || {};
  const entryAM = existingEntries?.AM ? { ...defaultEntry(), ...existingEntries.AM } : seed();
  const entryPM = existingEntries?.PM ? { ...defaultEntry(), ...existingEntries.PM } : seed();

  const allHourEntries = {};
  for (const h of workSlots) {
    const k = hourKey(h);
    const existing = hours[k];
    allHourEntries[k] = existing ? { ...defaultEntry(), ...existing } : seed();
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

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [], initialSlot, initialRange, allPeople = [], onSavePeople, allClients = [], onDirtyChange }) {
  const { settings, setSettings } = useSettings();
  const compact = settings?.editorCompact !== false;
  const toggleCompact = () => setSettings(prev => ({ ...prev, editorCompact: !(prev?.editorCompact !== false) }));
  const [dirty, setDirty] = useState(false);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  const markDirty = useCallback(() => { setDirty(true); }, []);
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
    const lastUsedByClient = settings?.lastUsedByClient || {};
    const seed = () => seedDefaultEntry(topClients, lastUsedByClient);
    const init = initFromExisting(existingEntries, WORK_SLOTS, seed);
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
    } else {
      const now = new Date();
      const isToday = date && new Date(date).toDateString() === now.toDateString();
      if (isToday) {
        const nowMin = now.getHours() * 60 + Math.floor(now.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES;
        const candidate = WORK_SLOTS.find((s) => s >= nowMin) ?? WORK_SLOTS[0];
        if (candidate !== undefined) {
          start = candidate;
          end = candidate + SLOT_MINUTES;
        }
      }
    }

    isInitializingRef.current = true;
    setRangeStartMin(start);
    setRangeEndMin(end);
    lastRangeRef.current = { start, end };

    const seedEntry = init.fullDay ? init.entryAM : (init.hourEntries[hourKey(start)] || seed());
    setDraftEntry(seedEntry);
    setDirty(false);
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
    markDirty();
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

  function rememberLastUsed(entries) {
    const updates = {};
    for (const e of entries) {
      if (!e || e.type !== "client" || !e.client?.trim()) continue;
      const key = normalizeClientKey(e.client);
      if (!key) continue;
      updates[key] = { subtypeId: e.subtypeId ?? null, milestone: e.milestone ?? null };
    }
    if (Object.keys(updates).length === 0) return;
    setSettings(prev => ({
      ...prev,
      lastUsedByClient: { ...(prev?.lastUsedByClient || {}), ...updates },
    }));
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
          rememberLastUsed([cleanAM]);
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

      rememberLastUsed(Object.values(nextHours));
      onSave({ AM: null, PM: null, location, hours: Object.keys(nextHours).length > 0 ? nextHours : undefined });
    } catch (err) {
      setSaveError(err?.message || "Errore durante il salvataggio");
    }
  }

  const rangeDuration = formatDurationHours(Math.max(rangeEndMin - rangeStartMin, SLOT_MINUTES));

  const activeNormalized = normalizeForType(activeEntry);
  const isSaveDisabled = !activeNormalized.title?.trim();

  const wrapDirty = (setter) => (val) => { markDirty(); setter(val); };
  const entryFormProps = {
    entry: activeEntry,
    onChange: handleEntryChange,
    topClients, allClients, allPeople, onSavePeople,
    fullDay, setFullDay: wrapDirty(setFullDay),
    rangeStartMin, setRangeStartMin: wrapDirty(setRangeStartMin),
    rangeEndMin, setRangeEndMin: wrapDirty(setRangeEndMin),
    startSection, endOptions, rangeDuration, autoAdjusted, hourLabel,
    location, setLocation: wrapDirty(setLocation),
    compact,
  };

  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === "Enter" && !isSaveDisabled) {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSaveDisabled, fullDay, entryAM, hourEntries, location]);

  return (
    <div className="flex flex-col min-h-0 flex-1 max-w-screen-xl w-full mx-auto">
      {/* Titolo full-width */}
      <div className="flex flex-col gap-1 pb-4 border-b border-si-border mb-4 shrink-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent">Voce</div>
        <input
          className="bg-transparent text-2xl font-bold text-si-ink placeholder:text-si-grayLight focus:outline-none"
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
            <EntryForm {...entryFormProps} section="meta" />
            {!compact && (
              <RecurringTaskSection
                date={date}
                fullDay={fullDay}
                entryAM={entryAM}
                draftEntry={draftEntry}
                rangeStartMin={rangeStartMin}
                rangeEndMin={rangeEndMin}
              />
            )}
          </div>
          {/* Colonna destra: note, feedback, trascrizione */}
          <div className="flex flex-col gap-4 lg:border-l lg:border-si-border lg:pl-8">
            <EntryForm {...entryFormProps} section="notes" />
          </div>
        </div>
        <div className="pb-2">
          <button
            type="button"
            onClick={toggleCompact}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-si-gray hover:text-si-ink transition-colors border-0 bg-transparent cursor-pointer px-0"
          >
            <Icon name={compact ? "chev-down" : "chev-up"} className="w-3.5 h-3.5" />
            {compact ? "Mostra dettagli" : "Nascondi dettagli"}
          </button>
        </div>
      </div>


      {/* Footer sticky */}
      <div className="shrink-0 -mx-5 -mb-5 px-5 pb-5 pt-4 bg-si-bg/95 border-t border-si-border flex items-center justify-between gap-3 rounded-b-[20px]">
        <div className="flex items-center gap-3">
          <button
            className="px-8 py-2.5 text-base font-semibold text-white rounded-full bg-si-ink hover:bg-si-inkSoft disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-si-ink border-0 cursor-pointer transition-colors"
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
