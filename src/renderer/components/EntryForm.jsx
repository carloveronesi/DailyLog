import { useState } from "react";
import { SLOT_MINUTES, TASK_TYPES } from "../domain/tasks";
import { Icon } from "./ui";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";
import { Combobox } from "./Combobox";

export function EntryForm({
  entry,
  onChange,
  topClients,
  allClients = [],
  allPeople = [],
  onSavePeople,
  fullDay,
  setFullDay,
  rangeStartMin,
  setRangeStartMin,
  rangeEndMin,
  setRangeEndMin,
  startSection,
  endOptions,
  rangeDuration,
  autoAdjusted,
  hourLabel,
  column = "all", // "left" | "right" | "all"
}) {
  const { settings, setSettings } = useSettings();
  const { MORNING_SLOTS, AFTERNOON_SLOTS } = useWorkSlots();
  const taskSubtypes = settings?.taskSubtypes || {};
  const setField = (k, v) => onChange({ ...entry, [k]: v });
  const [personInput, setPersonInput] = useState("");

  const addCollaborator = (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const cols = entry.collaborators || [];
    if (cols.includes(cleanName)) return;
    const nextCollaborators = [...cols, cleanName];
    setField("collaborators", nextCollaborators);
    setPersonInput("");
    const exists = allPeople.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      onSavePeople([...allPeople, { name: cleanName, taskTypes: [entry.type] }]);
    } else if (!exists.taskTypes.includes(entry.type)) {
      onSavePeople(allPeople.map(p =>
        p.name.toLowerCase() === cleanName.toLowerCase()
          ? { ...p, taskTypes: [...p.taskTypes, entry.type] }
          : p
      ));
    }
  };

  const removeCollaborator = (name) => {
    setField("collaborators", (entry.collaborators || []).filter(c => c !== name));
  };

  const currentSubtypes = taskSubtypes[entry.type] || [];
  const allSuggestedClients = Array.from(new Set([...topClients, ...allClients]));

  function generateSubtypeId(label) {
    return label.toLowerCase().trim().replace(/[\s\W]+/g, "-").replace(/^-+|-+$/g, "");
  }

  const handleSubtypeChange = (val) => {
    if (!val) { setField("subtypeId", null); return; }
    const newId = generateSubtypeId(val);
    if (!newId) return;
    const exists = currentSubtypes.some(st => st.id === newId || st.label.toLowerCase() === val.toLowerCase());
    if (!exists) {
      setSettings(prev => {
        const st = prev.taskSubtypes || {};
        const list = st[entry.type] || [];
        return { ...prev, taskSubtypes: { ...st, [entry.type]: [...list, { id: newId, label: val.trim() }] } };
      });
      setField("subtypeId", newId);
    } else {
      const existing = currentSubtypes.find(st => st.id === newId || st.label.toLowerCase() === val.toLowerCase());
      setField("subtypeId", existing ? existing.id : newId);
    }
  };

  // ── Left column ────────────────────────────────────────────────────────────
  const tipoSection = (
    <div className="flex flex-col gap-3">
      {/* Tipo */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tipo</label>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
          value={entry.type}
          onChange={(e) => setField("type", e.target.value)}
        >
          {TASK_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Cliente */}
      {entry.type === "client" && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cliente</label>
          <Combobox
            value={entry.client || ""}
            onChange={(val) => setField("client", val)}
            options={allSuggestedClients}
            placeholder="Nome cliente"
            allowCustom={true}
          />
        </div>
      )}

      {/* Subtask */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {entry.type === "internal" ? "Attività Interna" : "Subtask"}
        </label>
        <Combobox
          value={entry.subtypeId || ""}
          onChange={handleSubtypeChange}
          options={[
            { id: "", label: "Generico" },
            ...currentSubtypes.map(st => typeof st === "string" ? { id: st, label: st } : st)
          ]}
          placeholder={entry.type === "internal" ? "Seleziona attività..." : "Seleziona subtask"}
          allowCustom={true}
        />
      </div>
    </div>
  );

  const orariSection = (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Giornata intera</div>
        <button
          type="button"
          onClick={() => setFullDay((prev) => !prev)}
          className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none " + (fullDay ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")}
        >
          <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " + (fullDay ? "translate-x-6" : "translate-x-1")} />
        </button>
      </div>

      {!fullDay && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[120px] flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di inizio</div>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none"
                value={rangeStartMin}
                onChange={(e) => setRangeStartMin(Number(e.target.value))}
              >
                {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map((slot) => (
                  <option key={slot} value={slot}>{hourLabel(slot)}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px] flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di fine</div>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none"
                value={rangeEndMin}
                onChange={(e) => setRangeEndMin(Number(e.target.value))}
              >
                {endOptions.map((end) => (
                  <option key={end} value={end}>{hourLabel(end)}</option>
                ))}
              </select>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-5">
              {hourLabel(rangeStartMin)} - {hourLabel(rangeEndMin)} ({rangeDuration}h)
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="absolute top-0 h-full rounded-full bg-slate-900 dark:bg-blue-500"
                style={{
                  left: `${((rangeStartMin - MORNING_SLOTS[0]) / (AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES - MORNING_SLOTS[0])) * 100}%`,
                  width: `${((rangeEndMin - rangeStartMin) / (AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES - MORNING_SLOTS[0])) * 100}%`,
                }}
              />
            </div>
            {autoAdjusted && <div className="text-[11px] font-semibold text-amber-600">Fine aggiornata</div>}
          </div>
        </>
      )}
    </div>
  );

  // ── Right column ───────────────────────────────────────────────────────────
  const collaboratoriSection = (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Collaboratori 👥</label>
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
        {(entry.collaborators || []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
            {c}
            <button onClick={() => removeCollaborator(c)} className="text-slate-400 hover:text-rose-500 transition-colors">
              <Icon name="x" className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Combobox
          className="flex-1 min-w-[160px]"
          value={personInput}
          onChange={(val) => { if (val) addCollaborator(val); setPersonInput(""); }}
          options={allPeople.filter(p => !(entry.collaborators || []).includes(p.name)).map(p => p.name)}
          placeholder="Aggiungi persona..."
          allowCustom={true}
        />
      </div>
    </div>
  );

  const noteSection = (
    <div className="flex flex-col gap-1.5 flex-1 min-h-0">
      <label className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Note</label>
      <textarea
        className="flex-1 min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
        value={entry.notes}
        onChange={(e) => setField("notes", e.target.value)}
        placeholder="Dettagli..."
      />
    </div>
  );

  const wentWrongNextStepsSection = (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cosa è andato male</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
          rows={3}
          value={entry.wentWrong}
          onChange={(e) => setField("wentWrong", e.target.value)}
          placeholder="Blocchi, criticità..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Next steps</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
          rows={3}
          value={entry.nextSteps}
          onChange={(e) => setField("nextSteps", e.target.value)}
          placeholder="Prossime azioni..."
        />
      </div>
    </div>
  );

  if (column === "left") {
    return (
      <>
        {tipoSection}
        {orariSection}
      </>
    );
  }

  if (column === "right") {
    return (
      <>
        {collaboratoriSection}
        {noteSection}
        {wentWrongNextStepsSection}
      </>
    );
  }

  // "all" — fallback single-column (backward compat)
  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      {tipoSection}
      {orariSection}
      {collaboratoriSection}
      {noteSection}
      {wentWrongNextStepsSection}
    </div>
  );
}
