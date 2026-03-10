import { useRef, useState } from "react";
import { importAll } from "../services/storage";
import { Button, Icon, Modal, Segmented } from "./ui";
import { getClientColor, normalizeClientKey, normalizeHexColor, TASK_TYPES } from "../domain/tasks";

export function SettingsModal({
  open,
  onClose,
  hasDesktopBridge,
  settings,
  setSettings,
  settingsStatus,
  desktopBackupPath,
  pickDesktopBackupDir,
  useDefaultDesktopBackupDir,
  clientNames = [],
  exportAll,
  onImportSuccess,
}) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("personalizzazione");

  async function handleImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const count = await importAll(f);
      alert(`Import completato. Voci aggiornate: ${count}`);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      alert(`Import fallito: ${err?.message || err}`);
    } finally {
      e.target.value = "";
    }
  }

  function setClientColor(clientName, color) {
    const key = normalizeClientKey(clientName);
    const normalized = normalizeHexColor(color);
    if (!key || !normalized) return;

    setSettings((prev) => ({
      ...prev,
      clientColors: {
        ...(prev.clientColors || {}),
        [key]: normalized,
      },
    }));
  }

  function resetClientColor(clientName) {
    const key = normalizeClientKey(clientName);
    if (!key) return;

    setSettings((prev) => {
      const nextColors = { ...(prev.clientColors || {}) };
      delete nextColors[key];
      return {
        ...prev,
        clientColors: nextColors,
      };
    });
  }

  const [newSubtype, setNewSubtype] = useState("");
  const [selectedSubtypeType, setSelectedSubtypeType] = useState("internal");

  function addSubtype() {
    const val = newSubtype.trim();
    if (!val) return;
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = st[selectedSubtypeType] || [];
      if (list.includes(val)) return prev;
      return {
        ...prev,
        taskSubtypes: {
          ...st,
          [selectedSubtypeType]: [...list, val],
        },
      };
    });
    setNewSubtype("");
  }

  function removeSubtype(typeId, val) {
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = st[typeId] || [];
      return {
        ...prev,
        taskSubtypes: {
          ...st,
          [typeId]: list.filter((x) => x !== val),
        },
      };
    });
  }

  return (
    <Modal open={open} title="Impostazioni" onClose={onClose}>
      <div className="flex flex-col h-[600px] max-h-[70vh]">
        <div className="flex items-center justify-around border-b border-slate-200 dark:border-slate-700/50 mb-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("personalizzazione")}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${activeTab === "personalizzazione"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
          >
            Personalizzazione
            {activeTab === "personalizzazione" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full mx-auto w-1/2" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clienti")}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${activeTab === "clienti"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
          >
            Clienti
            {activeTab === "clienti" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full mx-auto w-1/2" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("task")}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${activeTab === "task"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
          >
            Attività
            {activeTab === "task" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full mx-auto w-1/2" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("salvataggio")}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${activeTab === "salvataggio"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
          >
            Salvataggio
            {activeTab === "salvataggio" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full mx-auto w-1/2" />
            )}
          </button>

        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {activeTab === "clienti" && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-6 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
              <div className="space-y-1">
                <div className="text-base font-bold text-slate-900 dark:text-white">Tavolozza Colori Clienti</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Fai clic su un colore per personalizzarlo.
                </div>
              </div>

              {clientNames.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Nessun cliente trovato nei dati salvati.
                </div>
              ) : (
                <div className="space-y-0 -mx-6">
                  {clientNames.map((clientName, idx) => {
                    const key = normalizeClientKey(clientName);
                    const hasCustom = Boolean(normalizeHexColor(settings.clientColors?.[key]));
                    const rawColor = getClientColor(clientName, settings.clientColors);
                    const color = normalizeHexColor(rawColor) || rawColor || "#94a3b8";
                    return (
                      <div
                        key={clientName}
                        className={
                          "flex items-center justify-between px-6 py-3 transition-colors " +
                          (idx < clientNames.length - 1 ? "border-b border-slate-100 dark:border-slate-700/50" : "")
                        }
                      >
                        <div className="flex items-center gap-4 group">
                          <label className="relative cursor-pointer">
                            <input
                              type="color"
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              value={color}
                              onChange={(e) => setClientColor(clientName, e.target.value)}
                            />
                            <div
                              className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105"
                              style={{ backgroundColor: color }}
                            />
                          </label>
                          <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                            {clientName}
                          </span>
                        </div>
                        <button
                          onClick={() => resetClientColor(clientName)}
                          type="button"
                          disabled={!hasCustom}
                          className={
                            "p-2 rounded-full transition-all " +
                            (hasCustom
                              ? "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 hover:scale-110"
                              : "text-slate-300 dark:text-slate-700 opacity-40 pointer-events-none")
                          }
                          title="Reset colore"
                        >
                          <Icon name={hasCustom ? "reset-rainbow" : "rotate-ccw"} className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "personalizzazione" && (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">Vista predefinita all&apos;avvio</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Scegli quale visualizzazione mostrare quando apri l&apos;applicazione.</div>
                </div>
                <div className="pt-2">
                  <Segmented
                    value={settings.defaultView || "day"}
                    onChange={(val) => setSettings(prev => ({ ...prev, defaultView: val }))}
                    options={[
                      { label: "Giorno", value: "day" },
                      { label: "Settimana", value: "week" },
                      { label: "Mese", value: "month" }
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "task" && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-6 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
              <div className="space-y-1">
                <div className="text-base font-bold text-slate-900 dark:text-white">Sottotipi di Attività</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Definisci dei titoli prestabiliti per compilare velocemente i tuoi task.
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={selectedSubtypeType}
                  onChange={(e) => setSelectedSubtypeType(e.target.value)}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Es. Colloquio, Proposta..."
                  value={newSubtype}
                  onChange={(e) => setNewSubtype(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSubtype();
                  }}
                />
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-5"
                  onClick={addSubtype}
                  type="button"
                >
                  Aggiungi
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {(settings.taskSubtypes?.[selectedSubtypeType] || []).length === 0 ? (
                  <span className="text-sm text-slate-400 italic">Nessun sottotipo per questa categoria.</span>
                ) : (
                  (settings.taskSubtypes?.[selectedSubtypeType] || []).map((val) => (
                    <div key={val} className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {val}
                      <button onClick={() => removeSubtype(selectedSubtypeType, val)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                        <Icon name="x" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "salvataggio" && (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-6 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">Import / Export</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Esporta tutti i dati in JSON oppure importa un backup esistente.
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-6" onClick={exportAll} type="button">
                    <Icon name="download" className="mr-2 w-4 h-4" />
                    Esporta JSON
                  </Button>
                  <Button
                    className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl px-6"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Icon name="upload" className="mr-2 w-4 h-4" />
                    Importa Backup
                  </Button>
                  <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
                </div>
              </div>

              {hasDesktopBridge && (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                    <div className="text-base font-bold text-slate-900 dark:text-white">Comportamento finestra</div>
                    <label className="flex items-center gap-4 cursor-pointer select-none group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                          checked={Boolean(settings.minimizeToTrayOnMinimize)}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              minimizeToTrayOnMinimize: e.target.checked,
                            }))
                          }
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Quando minimizzo, nascondi la finestra e mostra l&apos;icona nella tray.
                      </span>
                    </label>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-6 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                    <div className="space-y-1">
                      <div className="text-base font-bold text-slate-900 dark:text-white">Percorso salvataggi backup</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Se vuoto, viene usata la cartella predefinita in Documenti.</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm break-all font-mono text-slate-600 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                      {settings.desktopBackupDir || "(predefinito: Documenti\\DailyLog\\backup)"}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl"
                        onClick={pickDesktopBackupDir}
                        type="button"
                      >
                        Scegli cartella
                      </Button>
                      <Button
                        className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl"
                        onClick={useDefaultDesktopBackupDir}
                        type="button"
                      >
                        Usa predefinito
                      </Button>
                    </div>
                    {(settingsStatus || desktopBackupPath) && (
                      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {settingsStatus && <div className="text-xs text-slate-500 dark:text-slate-400 italic">{settingsStatus}</div>}
                        {desktopBackupPath && <div className="text-xs text-slate-500 break-all dark:text-slate-400">File attuale: {desktopBackupPath}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-2 shrink-0">
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-[14px] px-8 py-3 text-base font-bold shadow-lg shadow-slate-900/10 dark:shadow-none"
            onClick={onClose}
            type="button"
          >
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
