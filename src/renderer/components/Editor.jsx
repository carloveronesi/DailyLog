import { useEffect, useState } from "react";
import {
  AFTERNOON_HOURS,
  MORNING_HOURS,
  TASK_TYPES,
  WORK_HOURS,
  badgePresentation,
  defaultEntry,
  displayLabel,
  hourKey,
  hourLabel,
  isSameTaskEntry,
} from "../domain/tasks";
import { pad2 } from "../utils/date";
import { Button, Icon, Segmented } from "./ui";

// ─── helpers ────────────────────────────────────────────────────────────────

function hasMeaning(e) {
  if (!e) return false;
  return (
    (e.title && e.title.trim()) ||
    (e.client && e.client.trim()) ||
    (e.notes && e.notes.trim()) ||
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

function hourBoundaries(hours) {
  if (!hours || hours.length === 0) return [];
  return [...hours, hours[hours.length - 1] + 1];
}

function hoursBetween(hours, startHour, endHour) {
  const from = Math.min(startHour, endHour);
  const to = Math.max(startHour, endHour);
  return hours.filter((h) => h >= from && h < to);
}

function nearestHourSlot(hours, boundaryHour) {
  if (!hours || hours.length === 0) return null;
  if (hours.includes(boundaryHour)) return boundaryHour;
  if (boundaryHour > hours[hours.length - 1]) return hours[hours.length - 1];
  return hours[0];
}

function initFromExisting(existingEntries) {
  const hours = existingEntries?.hours || {};
  const hasMorning = MORNING_HOURS.some((h) => hours[hourKey(h)]);
  const hasAfternoon = AFTERNOON_HOURS.some((h) => hours[hourKey(h)]);

  const morningMode = hasMorning ? "hour" : "half";
  const afternoonMode = hasAfternoon ? "hour" : "half";

  const entryAM = existingEntries?.AM || defaultEntry();
  const entryPM = existingEntries?.PM || defaultEntry();

  const allHourEntries = {};
  for (const h of WORK_HOURS) {
    const k = hourKey(h);
    allHourEntries[k] = hours[k] || defaultEntry();
  }

  const fullDay =
    morningMode === "half" &&
    afternoonMode === "half" &&
    existingEntries?.AM &&
    existingEntries?.PM &&
    isSameTaskEntry(existingEntries.AM, existingEntries.PM);

  return { morningMode, afternoonMode, entryAM, entryPM, hourEntries: allHourEntries, fullDay };
}

// ─── Entry form ─────────────────────────────────────────────────────────────

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
    </div>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function PreviewHalfBlock({ entry, clientColors }) {
  const badge = badgePresentation(entry, clientColors);
  if (!entry || !displayLabel(entry)) {
    return <div className="flex-1 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 opacity-40 bg-slate-50/50 dark:bg-transparent" />;
  }
  return (
    <div className={"flex-1 rounded-xl flex items-center justify-center px-2 py-1 shadow-sm " + badge.className} style={badge.style}>
      <div className="w-full text-center text-ellipsis overflow-hidden text-xs font-black leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function PreviewHourStrip({ hour, entry, clientColors }) {
  const badge = badgePresentation(entry, clientColors);
  if (!entry || !displayLabel(entry)) {
    return <div className="flex-1 rounded border border-dashed border-slate-200 dark:border-slate-700 opacity-30" />;
  }
  return (
    <div className={"flex-1 rounded flex items-center justify-center px-1 shadow-sm " + badge.className} style={badge.style}>
      <div className="w-full text-center text-ellipsis overflow-hidden text-[7px] font-black leading-tight">
        {displayLabel(entry)}
      </div>
    </div>
  );
}

function EditorPreview({ date, fullDay, morningMode, afternoonMode, entryAM, entryPM, hourEntries, clientColors }) {
  const amBadge = badgePresentation(entryAM, clientColors);
  return (
    <div className="hidden sm:flex flex-col items-center justify-center self-center h-full">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 pr-1">Preview</div>
      <div className="w-[150px] h-[150px] rounded-[32px] border border-slate-200/80 bg-white p-3.5 flex flex-col shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
        <div className="text-sm font-black text-slate-400 pr-1">{date.getDate()}</div>
        <div className="flex flex-1 flex-col gap-2 mt-2">
          {fullDay ? (
            <div className={"flex-1 rounded-[14px] flex items-center justify-center px-2 py-1 shadow-sm " + amBadge.className} style={amBadge.style}>
              <div className="w-full text-center truncate text-sm font-black tracking-tight">
                {displayLabel(entryAM)}
              </div>
            </div>
          ) : (
            <>
              {/* Morning preview */}
              {morningMode === "hour" ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {MORNING_HOURS.map((h) => (
                    <PreviewHourStrip key={h} hour={h} entry={hourEntries[hourKey(h)]} clientColors={clientColors} />
                  ))}
                </div>
              ) : (
                <PreviewHalfBlock entry={entryAM && displayLabel(entryAM) ? entryAM : null} clientColors={clientColors} />
              )}

              {/* Afternoon preview */}
              {afternoonMode === "hour" ? (
                <div className="flex flex-1 flex-col gap-0.5">
                  {AFTERNOON_HOURS.map((h) => (
                    <PreviewHourStrip key={h} hour={h} entry={hourEntries[hourKey(h)]} clientColors={clientColors} />
                  ))}
                </div>
              ) : (
                <PreviewHalfBlock entry={entryPM && displayLabel(entryPM) ? entryPM : null} clientColors={clientColors} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [], initialSlot, clientColors = {} }) {
  // Which half is being edited ("AM" = mattina, "PM" = pomeriggio)
  const initialSection = typeof initialSlot === "number"
    ? (MORNING_HOURS.includes(initialSlot) ? "AM" : "PM")
    : (initialSlot || "AM");
  const initialHour = typeof initialSlot === "number"
    ? initialSlot
    : (initialSection === "AM" ? MORNING_HOURS[0] : AFTERNOON_HOURS[0]);

  const [section, setSection] = useState(initialSection);
  const [morningMode, setMorningMode] = useState("half");
  const [afternoonMode, setAfternoonMode] = useState("half");
  const [entryAM, setEntryAM] = useState(defaultEntry());
  const [entryPM, setEntryPM] = useState(defaultEntry());
  const [hourEntries, setHourEntries] = useState(() => {
    const init = {};
    for (const h of WORK_HOURS) init[hourKey(h)] = defaultEntry();
    return init;
  });
  const [rangeStartHour, setRangeStartHour] = useState(initialHour);
  const [rangeEndHour, setRangeEndHour] = useState(initialHour + 1);
  const [isPickingRangeEnd, setIsPickingRangeEnd] = useState(false);
  const [fullDay, setFullDay] = useState(false);

  useEffect(() => {
    const init = initFromExisting(existingEntries);
    setMorningMode(init.morningMode);
    setAfternoonMode(init.afternoonMode);
    setEntryAM(init.entryAM);
    setEntryPM(init.entryPM);
    setHourEntries(init.hourEntries);
    setFullDay(init.fullDay);
  }, [existingEntries]);

  // Current selection state for the active section
  const currentMode = section === "AM" ? morningMode : afternoonMode;
  const currentHours = section === "AM" ? MORNING_HOURS : AFTERNOON_HOURS;
  const currentHourBoundaries = hourBoundaries(currentHours);
  const selectedHours = hoursBetween(currentHours, rangeStartHour, rangeEndHour);
  const rangeFrom = Math.min(rangeStartHour, rangeEndHour);
  const rangeTo = Math.max(rangeStartHour, rangeEndHour);

  function handleSectionChange(newSection) {
    setSection(newSection);
    const firstHour = newSection === "AM" ? MORNING_HOURS[0] : AFTERNOON_HOURS[0];
    setRangeStartHour(firstHour);
    setRangeEndHour(firstHour + 1);
    setIsPickingRangeEnd(false);
  }

  function handleModeChange(newMode) {
    if (section === "AM") setMorningMode(newMode);
    else setAfternoonMode(newMode);
    if (newMode === "hour") {
      const firstHour = currentHours[0];
      setRangeStartHour(firstHour);
      setRangeEndHour(firstHour + 1);
      setIsPickingRangeEnd(false);
      setFullDay(false);
    }
  }

  function handleFullDayToggle() {
    const next = !fullDay;
    setFullDay(next);
    if (next) {
      setMorningMode("half");
      setAfternoonMode("half");
    }
  }

  // Active entry for the form
  const activeEntry = (() => {
    if (currentMode === "hour") {
      const fallbackHour = nearestHourSlot(currentHours, rangeFrom) || currentHours[0];
      const sourceHour = selectedHours.length > 0 ? selectedHours[0] : fallbackHour;
      return hourEntries[hourKey(sourceHour)] || defaultEntry();
    }
    return section === "AM" ? entryAM : entryPM;
  })();

  function handleEntryChange(newEntry) {
    if (currentMode === "hour") {
      const fallbackHour = nearestHourSlot(currentHours, rangeFrom) || currentHours[0];
      const targetHours = selectedHours.length > 0 ? selectedHours : [fallbackHour];
      setHourEntries((prev) => {
        const next = { ...prev };
        for (const h of targetHours) {
          next[hourKey(h)] = newEntry;
        }
        return next;
      });
    } else if (section === "AM") {
      setEntryAM(newEntry);
      if (fullDay) setEntryPM(newEntry);
    } else {
      setEntryPM(newEntry);
      if (fullDay) setEntryAM(newEntry);
    }
  }

  function handleHourButtonClick(hour) {
    const maxBoundary = currentHourBoundaries[currentHourBoundaries.length - 1];
    const minBoundary = currentHourBoundaries[0];
    const clampedHour = Math.max(minBoundary, Math.min(hour, maxBoundary));

    if (!isPickingRangeEnd) {
      if (clampedHour === maxBoundary) {
        const previousBoundary = currentHourBoundaries[currentHourBoundaries.length - 2];
        setRangeStartHour(previousBoundary);
        setRangeEndHour(maxBoundary);
      } else {
        setRangeStartHour(clampedHour);
        setRangeEndHour(clampedHour + 1);
      }
      setIsPickingRangeEnd(true);
      return;
    }

    if (clampedHour === rangeStartHour) {
      setRangeEndHour(Math.min(maxBoundary, rangeStartHour + 1));
    } else {
      setRangeEndHour(clampedHour);
    }
    setIsPickingRangeEnd(false);
  }

  function buildHours() {
    const result = {};
    if (morningMode === "hour") {
      for (const h of MORNING_HOURS) {
        const k = hourKey(h);
        const e = hourEntries[k];
        if (hasMeaning(e)) result[k] = normalizeForType(e);
      }
    }
    if (afternoonMode === "hour") {
      for (const h of AFTERNOON_HOURS) {
        const k = hourKey(h);
        const e = hourEntries[k];
        if (hasMeaning(e)) result[k] = normalizeForType(e);
      }
    }
    return result;
  }

  function handleSave() {
    const hours = buildHours();
    const cleanAM = morningMode === "half" && hasMeaning(entryAM) ? normalizeForType(entryAM) : null;
    const cleanPM = afternoonMode === "half" && hasMeaning(entryPM) ? normalizeForType(entryPM) : null;
    if (fullDay && cleanAM) {
      onSave({ AM: cleanAM, PM: cleanAM, hours: Object.keys(hours).length > 0 ? hours : undefined });
    } else {
      onSave({ AM: cleanAM, PM: cleanPM, hours: Object.keys(hours).length > 0 ? hours : undefined });
    }
  }

  const fmt = (d) => {
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-500 font-medium">{fmt(date)}</div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-8 items-start">
        <div className="space-y-5">

          {/* Full-day toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Giornata intera</div>
            <button
              type="button"
              onClick={handleFullDayToggle}
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

          {fullDay ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-[13px] text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300">
              Salvataggio per l'intera giornata (mattina + pomeriggio).
            </div>
          ) : (
            <>
              {/* Section selector */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Sezione</div>
                <Segmented
                  value={section}
                  onChange={handleSectionChange}
                  options={[
                    { value: "AM", label: "Mattina" },
                    { value: "PM", label: "Pomeriggio" },
                  ]}
                />
              </div>

              {/* Mode selector for current section */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Granularità</div>
                <Segmented
                  value={currentMode}
                  onChange={handleModeChange}
                  options={[
                    { value: "half", label: "Mezza giornata" },
                    { value: "hour", label: "Per ora" },
                  ]}
                />
              </div>

              {/* Hour picker (only in hour mode) */}
              {currentMode === "hour" && (
                <div className="space-y-1.5">
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ora</div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {hourLabel(rangeFrom)} - {hourLabel(rangeTo)} ({selectedHours.length}h)
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {isPickingRangeEnd ? "Ora scegli l'orario di fine." : "Clicca l'orario di inizio, poi quello di fine."}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {currentHourBoundaries.map((h) => {
                      const k = hourKey(h);
                      const isHourSlot = currentHours.includes(h);
                      const hasEntry = isHourSlot && hasMeaning(hourEntries[k]);
                      const isRangeStart = rangeStartHour === h;
                      const isRangeEnd = rangeEndHour === h;
                      const isInRange = h > rangeFrom && h < rangeTo;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHourButtonClick(h)}
                          className={
                            "rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition border " +
                            ((isRangeStart && isRangeEnd)
                              ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                              : isRangeStart
                                ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600"
                              : isRangeEnd
                                ? "bg-white text-emerald-700 border-emerald-400 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-600"
                              : isInRange
                                ? "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700"
                              : hasEntry
                                ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700")
                          }
                        >
                          {hourLabel(h)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Entry form */}
          <div className="pt-1">
            <EntryForm
              entry={activeEntry}
              onChange={handleEntryChange}
              topClients={topClients}
              clientColors={clientColors}
            />
          </div>

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
              Rimuovi tutto
            </Button>
          </div>
        </div>

        <EditorPreview
          date={date}
          fullDay={fullDay}
          morningMode={morningMode}
          afternoonMode={afternoonMode}
          entryAM={entryAM}
          entryPM={entryPM}
          hourEntries={hourEntries}
          clientColors={clientColors}
        />
      </div>
    </div>
  );
}
