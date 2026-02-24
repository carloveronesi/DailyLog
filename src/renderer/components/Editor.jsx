import { useEffect, useState } from "react";
import { SLOT, TASK_TYPES, badgeStyle, defaultEntry, displayLabel } from "../domain/tasks";
import { pad2 } from "../utils/date";
import { Button, Icon, Segmented } from "./ui";

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [] }) {
  const [mode, setMode] = useState("half"); // 'half'|'full'
  const [slot, setSlot] = useState(SLOT.AM);

  const [entryAM, setEntryAM] = useState(existingEntries?.AM || defaultEntry());
  const [entryPM, setEntryPM] = useState(existingEntries?.PM || defaultEntry());

  useEffect(() => {
    setEntryAM(existingEntries?.AM || defaultEntry());
    setEntryPM(existingEntries?.PM || defaultEntry());
    // heuristics: if AM and PM are equal, default to full-day
    const eq = JSON.stringify(existingEntries?.AM || null) === JSON.stringify(existingEntries?.PM || null);
    setMode(existingEntries?.AM && existingEntries?.PM && eq ? "full" : "half");
  }, [existingEntries]);

  const active = slot === SLOT.AM ? entryAM : entryPM;
  const setActive = (next) => (slot === SLOT.AM ? setEntryAM(next) : setEntryPM(next));

  const setField = (k, v) => setActive({ ...active, [k]: v });

  function normalizeForType(e) {
    const t = e.type;
    const out = { ...e };
    if (t !== "client") out.client = "";
    if (t === "vacation" && !out.title.trim()) out.title = "Ferie";
    if (t === "internal" && !out.title.trim()) out.title = "Internal";
    if (t === "event" && !out.title.trim()) out.title = "Evento";
    return out;
  }

  function handleSave() {
    if (mode === "full") {
      // Copy AM to PM for full day, using current slot entry as the source
      const source = normalizeForType(active);
      onSave({ AM: source, PM: source });
      return;
    }

    // half: save each slot independently, but allow empty slot (treated as null)
    const clean = (e) => {
      const hasMeaning =
        (e.title && e.title.trim()) ||
        (e.client && e.client.trim()) ||
        (e.notes && e.notes.trim()) ||
        e.type === "vacation";
      if (!hasMeaning) return null;
      return normalizeForType(e);
    };

    onSave({ AM: clean(entryAM), PM: clean(entryPM) });
  }

  const fmt = (d) => {
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-slate-600 dark:text-slate-400">{fmt(date)}</div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "half", label: "0.5 giornata" },
            { value: "full", label: "1 giornata" },
          ]}
        />
      </div>

      {mode === "half" ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modifica slot</div>
          <Segmented
            value={slot}
            onChange={setSlot}
            options={[
              { value: SLOT.AM, label: "Mattina" },
              { value: SLOT.PM, label: "Pomeriggio" },
            ]}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300">
          Stai salvando una voce per l'intera giornata (mattina e pomeriggio).
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              value={active.type}
              onChange={(e) => setField("type", e.target.value)}
            >
              {TASK_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {active.type === "client" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliente</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 outline-none transition"
                value={active.client}
                onChange={(e) => setField("client", e.target.value)}
                placeholder="Es. Generali"
              />
              {topClients.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topClients.map((clientName) => {
                    const isSelected = (active.client || "").trim().toLowerCase() === clientName.toLowerCase();
                    return (
                      <button
                        key={clientName}
                        type="button"
                        onClick={() => setField("client", clientName)}
                        className={
                          "rounded-full px-3 py-1 text-xs font-semibold transition " +
                          (isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800/80 dark:text-blue-400 dark:hover:bg-slate-700")
                        }
                        title={`Usa cliente ${clientName}`}
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
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titolo</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 outline-none transition"
                value={active.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={active.type === "event" ? "Es. Meetup" : "Es. Support"}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5 flex flex-col h-full min-h-[120px]">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Note</label>
          <textarea
            className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 outline-none transition"
            value={active.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Cosa hai fatto, prossimi step..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleSave} type="button">
          Salva
        </Button>

        <Button
          className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={onDeleteDay}
          type="button"
          title="Cancella tutte le voci del giorno"
        >
          <Icon name="trash" className="mr-2" />
          Cancella giorno
        </Button>
      </div>

      {mode === "half" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">AM</div>
            {entryAM ? (
              <div className={"inline-flex max-w-[140px] truncate rounded-lg px-2 py-1 text-xs font-semibold " + badgeStyle(entryAM.type)}>
                <span className="truncate w-full text-center">{displayLabel(entryAM)}</span>
              </div>
            ) : <div className="text-[11px] text-slate-400 italic">Vuoto</div>}
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">PM</div>
            {entryPM ? (
              <div className={"inline-flex max-w-[140px] truncate rounded-lg px-2 py-1 text-xs font-semibold " + badgeStyle(entryPM.type)}>
                <span className="truncate w-full text-center">{displayLabel(entryPM)}</span>
              </div>
            ) : <div className="text-[11px] text-slate-400 italic">Vuoto</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
