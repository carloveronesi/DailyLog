import { useEffect, useState } from "react";
import { SLOT, TASK_TYPES, badgePresentation, defaultEntry, displayLabel } from "../domain/tasks";
import { pad2 } from "../utils/date";
import { Button, Icon, Segmented } from "./ui";

export function Editor({ date, existingEntries, onSave, onDeleteDay, topClients = [], initialSlot, clientColors = {} }) {
  const [mode, setMode] = useState("half"); // 'half'|'full'
  const [slot, setSlot] = useState(initialSlot || SLOT.AM);

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
  const entryAMBadge = badgePresentation(entryAM, clientColors);
  const entryPMBadge = badgePresentation(entryPM, clientColors);

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
      <div className="text-sm text-slate-500 dark:text-slate-500 font-medium">{fmt(date)}</div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-8 items-center">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Durata</div>
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
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Modifica slot</div>
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
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-[13px] text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300">
              Salvataggio per l'intera giornata (mattina + pomeriggio).
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tipo</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cliente</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
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
                              "rounded-full px-3 py-1 text-[11px] font-bold transition " +
                              (isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700")
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
                    value={active.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder={active.type === "event" ? "Es. Meetup" : "Es. Support"}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex flex-col h-full min-h-[120px]">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Note</label>
              <textarea
                className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition"
                value={active.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Dettagli..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 px-8 py-2.5 text-base font-bold shadow-lg shadow-slate-900/10 dark:shadow-blue-500/10" onClick={handleSave} type="button">
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

        <div className="hidden sm:flex flex-col items-center justify-center self-center h-full">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 pr-1">Preview</div>
          <div className="w-[150px] h-[150px] rounded-[32px] border border-slate-200/80 bg-white p-3.5 flex flex-col shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
            <div className="text-sm font-black text-slate-400 pr-1">{date.getDate()}</div>
            <div className="flex flex-1 flex-col gap-2 mt-2">
              {mode === "full" ? (
                <div className={"flex-1 rounded-[14px] flex items-center justify-center px-2 py-1 shadow-sm " + entryAMBadge.className} style={entryAMBadge.style}>
                  <div className="w-full text-center truncate text-sm font-black tracking-tight">
                    {displayLabel(entryAM)}
                  </div>
                </div>
              ) : (
                <>
                  {entryAM && displayLabel(entryAM) ? (
                    <div className={"flex-1 rounded-xl flex items-center justify-center px-2 py-1 shadow-sm " + entryAMBadge.className} style={entryAMBadge.style}>
                      <div className="w-full text-center text-ellipsis overflow-hidden text-xs font-black leading-tight">
                        {displayLabel(entryAM)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 opacity-40 bg-slate-50/50 dark:bg-transparent" />
                  )}

                  {entryPM && displayLabel(entryPM) ? (
                    <div className={"flex-1 rounded-xl flex items-center justify-center px-2 py-1 shadow-sm " + entryPMBadge.className} style={entryPMBadge.style}>
                      <div className="w-full text-center text-ellipsis overflow-hidden text-xs font-black leading-tight">
                        {displayLabel(entryPM)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 opacity-40 bg-slate-50/50 dark:bg-transparent" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
