import { useState } from "react";
import { AFTERNOON_SLOTS, MORNING_SLOTS, SLOT_MINUTES, TASK_TYPES } from "../domain/tasks";
import { Icon } from "./ui";

export function EntryForm({
  entry,
  onChange,
  topClients,
  allClients = [],
  clientColors,
  taskSubtypes = {},
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
  hourLabel
}) {
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
      const newPerson = { name: cleanName, taskTypes: [entry.type] };
      onSavePeople([...allPeople, newPerson]);
    } else if (!exists.taskTypes.includes(entry.type)) {
      const updatedPeople = allPeople.map(p =>
        p.name.toLowerCase() === cleanName.toLowerCase()
          ? { ...p, taskTypes: [...p.taskTypes, entry.type] }
          : p
      );
      onSavePeople(updatedPeople);
    }
  };

  const removeCollaborator = (name) => {
    const cols = entry.collaborators || [];
    setField("collaborators", cols.filter(c => c !== name));
  };

  const currentSubtypes = taskSubtypes[entry.type] || [];
  const suggestedPeople = allPeople.filter(p =>
    p.taskTypes.includes(entry.type) && !(entry.collaborators || []).includes(p.name)
  );

  const allSuggestedClients = Array.from(new Set([...topClients, ...allClients]));

  return (
    <div className="space-y-6">
      {/* Prima riga: Titolo */}
      <div className="mb-2 pr-8">
        <input
          className="w-full bg-transparent text-xl font-bold text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600 focus:outline-none"
          value={entry.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder={entry.type === "vacation" ? "Titolo (es. Ferie)" : entry.type === "event" ? "Titolo (es. Meetup)" : "Titolo (es. Refactor codice)"}
        />
      </div>

      {/* Seconda riga: Tipo, Cliente e Subtask */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-3 space-y-1.5">
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

        {entry.type === "client" && (
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cliente</label>
            <input
              list="client-suggestions"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
              value={entry.client}
              onChange={(e) => setField("client", e.target.value)}
              placeholder="Nome cliente"
            />
            <datalist id="client-suggestions">
              {allSuggestedClients.map(c => <option key={c} value={c} />)}
            </datalist>
            {allSuggestedClients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allSuggestedClients.slice(0, 4).map((clientName) => {
                  const isSelected = (entry.client || "").trim().toLowerCase() === clientName.toLowerCase();
                  return (
                    <button
                      key={clientName}
                      type="button"
                      onClick={() => setField("client", clientName)}
                      className={
                        "rounded-full px-3 py-1 text-[11px] font-bold transition " +
                        (isSelected
                          ? "bg-slate-700 text-white shadow-md dark:bg-slate-200 dark:text-slate-900"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700")
                      }
                    >
                      {clientName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className={`space-y-1.5 ${entry.type === "client" ? "md:col-span-4" : "md:col-span-9"}`}>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Subtask</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setField("subtypeId", null)}
              className={
                "rounded-full px-3 py-1 text-[11px] font-bold transition " +
                (!entry.subtypeId
                  ? "bg-slate-700 text-white shadow-md dark:bg-slate-200 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700")
              }
            >
              Generico
            </button>
            {currentSubtypes.map((st) => {
              const id = st.id || st;
              const label = st.label || st;
              const isSelected = entry.subtypeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setField("subtypeId", id)}
                  className={
                    "rounded-full px-3 py-1 text-[11px] font-bold transition " +
                    (isSelected
                      ? "bg-slate-700 text-white shadow-md dark:bg-slate-200 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Terza riga: Orari (Spostata qui come da richiesta) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-3 mb-4">
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

        {!fullDay && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[140px] flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di inizio</div>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none"
                  value={rangeStartMin}
                  onChange={(e) => setRangeStartMin(Number(e.target.value))}
                >
                  {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map((slot) => (
                    <option key={slot} value={slot}>
                      {hourLabel(slot)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[140px] flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Ora di fine</div>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none"
                  value={rangeEndMin}
                  onChange={(e) => setRangeEndMin(Number(e.target.value))}
                >
                  {endOptions.map((end) => (
                    <option key={end} value={end}>
                      {hourLabel(end)}
                    </option>
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

      {/* Quarta riga: Collaboratori */}
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
          <div className="relative flex-1 min-w-[120px]">
            <input
              className="w-full bg-transparent border-none outline-none text-sm p-0 placeholder:text-slate-400"
              placeholder="Aggiungi persona..."
              value={personInput}
              onChange={(e) => setPersonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCollaborator(personInput);
                }
              }}
            />
          </div>
        </div>
        {suggestedPeople.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Suggeriti:</span>
            {suggestedPeople.slice(0, 5).map(p => (
              <button
                key={p.name}
                onClick={() => addCollaborator(p.name)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 transition-colors font-semibold"
              >
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quinta riga: Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Note</label>
        <textarea
          className="w-full h-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
          value={entry.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Dettagli..."
        />
      </div>

      {/* Sesta riga: Cosa è andato male e Next steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cosa è andato male</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
            rows={2}
            value={entry.wentWrong}
            onChange={(e) => setField("wentWrong", e.target.value)}
            placeholder="Blocchi, criticità..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Next steps</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
            rows={2}
            value={entry.nextSteps}
            onChange={(e) => setField("nextSteps", e.target.value)}
            placeholder="Prossime azioni..."
          />
        </div>
      </div>
    </div>
  );
}
