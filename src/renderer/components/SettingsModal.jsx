import { useRef, useState, useEffect } from "react";
import { importAll, listStoredMonths, exportMonths } from "../services/storage";
import { loadTodos, saveTodos } from "../services/storage/todo";
import { Button, Icon, Modal, Segmented } from "./ui";
import { getClientColor, normalizeClientKey, normalizeHexColor, TASK_TYPES, hourLabel } from "../domain/tasks";

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
  backupFileHandle,
  backupStatus,
  supportsAutoBackup,
  enableAutoBackup,
  onDisableAutoBackup,
}) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("personalizzazione");
  const [importStatus, setImportStatus] = useState(null); // { ok: bool, message: string }
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { months, dateRange, dayCount } | { error: string } | null

  function handleTabChange(tab) {
    setActiveTab(tab);
    setImportStatus(null);
  }

  function handleImportFileSelected(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingImportFile(f);
    e.target.value = "";
  }

  async function confirmImport() {
    if (!pendingImportFile) return;
    const f = pendingImportFile;
    setPendingImportFile(null);
    try {
      const count = await importAll(f);
      setImportStatus({ ok: true, message: `Import completato. Voci aggiornate: ${count}` });
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setImportStatus({ ok: false, message: `Import fallito: ${err?.message || err}` });
    }
  }

  function cancelImport() {
    setPendingImportFile(null);
    setImportPreview(null);
  }

  useEffect(() => {
    if (!pendingImportFile) {
      setImportPreview(null);
      return;
    }
    let cancelled = false;
    pendingImportFile.text().then((text) => {
      if (cancelled) return;
      try {
        const data = JSON.parse(text);
        if (!data || typeof data !== "object") {
          setImportPreview({ error: "Il file non è un export DailyLog valido." });
          return;
        }
        const monthRe = /^dailylog:v1:\d{4}-\d{2}$/;
        const monthKeys = Object.keys(data).filter((k) => monthRe.test(k));
        if (monthKeys.length === 0) {
          setImportPreview({ error: "Il file non contiene dati DailyLog riconoscibili." });
          return;
        }
        const sorted = [...monthKeys].sort();
        const dateRange = `${sorted[0].replace("dailylog:v1:", "")} → ${sorted[sorted.length - 1].replace("dailylog:v1:", "")}`;
        let dayCount = 0;
        for (const k of monthKeys) {
          const monthData = data[k];
          if (monthData && typeof monthData === "object" && monthData.byDate) {
            dayCount += Object.keys(monthData.byDate).length;
          }
        }
        setImportPreview({ months: monthKeys.length, dateRange, dayCount });
      } catch {
        setImportPreview({ error: "Il file non è un JSON valido." });
      }
    }).catch(() => {
      if (!cancelled) setImportPreview({ error: "Impossibile leggere il file." });
    });
    return () => { cancelled = true; };
  }, [pendingImportFile]);

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

  const [availableMonths, setAvailableMonths] = useState([]);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  useEffect(() => {
    if (activeTab !== "salvataggio") return;
    const months = listStoredMonths();
    setAvailableMonths(months);
    if (months.length > 0) {
      setExportFrom((prev) => (prev && months.includes(prev) ? prev : months[0]));
      setExportTo((prev) => (prev && months.includes(prev) ? prev : months[months.length - 1]));
    }
  }, [activeTab]);

  function handleExportRange() {
    const range = availableMonths.filter((m) => m >= exportFrom && m <= exportTo);
    if (range.length === 0) return;
    exportMonths(range);
  }

  const [newSubtypes, setNewSubtypes] = useState({});
  const [newTodoTag, setNewTodoTag] = useState("");
  const [editingSubtype, setEditingSubtype] = useState(null); // { typeId, id, label }
  const [editingTag, setEditingTag] = useState(null);         // string (vecchio nome)
  const [editingTagValue, setEditingTagValue] = useState("");

  function saveSubtypeRename() {
    if (!editingSubtype) return;
    const newLabel = editingSubtype.label.trim();
    if (newLabel) {
      setSettings((prev) => {
        const st = prev.taskSubtypes || {};
        const list = st[editingSubtype.typeId] || [];
        return {
          ...prev,
          taskSubtypes: {
            ...st,
            [editingSubtype.typeId]: list.map((x) =>
              x.id === editingSubtype.id ? { ...x, label: newLabel } : x
            ),
          },
        };
      });
    }
    setEditingSubtype(null);
  }

  function saveTagRename() {
    const newTag = editingTagValue.trim();
    if (newTag && newTag !== editingTag) {
      setSettings((prev) => ({
        ...prev,
        todoTags: (prev.todoTags || []).map((t) => (t === editingTag ? newTag : t)),
      }));
      // Propaga rinomina a tutti i todo che usano il vecchio tag
      const currentTodos = loadTodos();
      if (currentTodos.some((todo) => (todo.tags || []).includes(editingTag))) {
        saveTodos(
          currentTodos.map((todo) => ({
            ...todo,
            tags: (todo.tags || []).map((t) => (t === editingTag ? newTag : t)),
          }))
        );
      }
    }
    setEditingTag(null);
    setEditingTagValue("");
  }

  function addTodoTag() {
    const val = newTodoTag.trim();
    if (!val) return;
    setSettings((prev) => {
      const tags = prev.todoTags || [];
      if (tags.some((t) => t.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        todoTags: [...tags, val],
      };
    });
    setNewTodoTag("");
  }

  function removeTodoTag(tagName) {
    setSettings((prev) => ({
      ...prev,
      todoTags: (prev.todoTags || []).filter((t) => t !== tagName),
    }));
  }

  function addSubtype(typeId) {
    const val = (newSubtypes[typeId] || "").trim();
    if (!val) return;
    const newId = val.toLowerCase().replace(/[\s\W]+/g, "-").replace(/^-+|-+$/g, "");
    if (!newId) return;
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = st[typeId] || [];
      if (list.some((x) => x.id === newId || x.label.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        taskSubtypes: {
          ...st,
          [typeId]: [...list, { id: newId, label: val }],
        },
      };
    });
    setNewSubtypes((prev) => ({ ...prev, [typeId]: "" }));
  }

  function removeSubtype(typeId, idToRemove) {
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = st[typeId] || [];
      return {
        ...prev,
        taskSubtypes: {
          ...st,
          [typeId]: list.filter((x) => x.id !== idToRemove),
        },
      };
    });
  }

  function moveSubtype(typeId, id, direction) {
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = [...(st[typeId] || [])];
      const idx = list.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === list.length - 1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
      return {
        ...prev,
        taskSubtypes: { ...st, [typeId]: list },
      };
    });
  }

  function moveTag(tag, direction) {
    setSettings((prev) => {
      const tags = [...(prev.todoTags || [])];
      const idx = tags.indexOf(tag);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === tags.length - 1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [tags[idx], tags[swapIdx]] = [tags[swapIdx], tags[idx]];
      return { ...prev, todoTags: tags };
    });
  }

  return (
    <Modal open={open} title="Impostazioni" onClose={onClose}>
      <div className="flex flex-col h-[600px] max-h-[70vh]">
        <div className="flex items-center justify-around border-b border-slate-200 dark:border-slate-700/50 mb-6 shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange("personalizzazione")}
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
            onClick={() => handleTabChange("clienti")}
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
            onClick={() => handleTabChange("task")}
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
            onClick={() => handleTabChange("salvataggio")}
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

              {/* Tema */}
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">Tema</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Scegli il tema dell&apos;interfaccia.</div>
                </div>
                <div className="pt-2">
                  <Segmented
                    value={settings.theme || "light"}
                    onChange={(val) => setSettings((prev) => ({ ...prev, theme: val }))}
                    options={[
                      { label: "Chiaro", value: "light" },
                      { label: "Scuro", value: "dark" },
                    ]}
                  />
                </div>
              </div>

              {/* Orario lavorativo */}
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">Orario lavorativo</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Configura le fasce orarie visualizzate nel calendario.</div>
                </div>
                {(() => {
                  const workHours = settings.workHours || {};
                  const timeOptions = [];
                  for (let m = 6 * 60; m <= 22 * 60; m += 30) {
                    timeOptions.push(m);
                  }
                  const selectCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/20 transition";
                  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-1.5 block";
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={labelCls}>Mattina — inizio</span>
                        <select
                          className={selectCls}
                          value={workHours.morningStart ?? 540}
                          onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, morningStart: Number(e.target.value) } }))}
                        >
                          {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className={labelCls}>Mattina — fine</span>
                        <select
                          className={selectCls}
                          value={workHours.morningEnd ?? 780}
                          onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, morningEnd: Number(e.target.value) } }))}
                        >
                          {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className={labelCls}>Pomeriggio — inizio</span>
                        <select
                          className={selectCls}
                          value={workHours.afternoonStart ?? 840}
                          onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, afternoonStart: Number(e.target.value) } }))}
                        >
                          {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className={labelCls}>Pomeriggio — fine</span>
                        <select
                          className={selectCls}
                          value={workHours.afternoonEnd ?? 1080}
                          onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, afternoonEnd: Number(e.target.value) } }))}
                        >
                          {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })()}
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
              <div className="space-y-6 pt-2">
                {TASK_TYPES.map((t) => (
                  <div key={t.id} className="pt-4 first:pt-0 border-t first:border-0 border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.label}</div>
                    <div className="flex gap-2 w-full max-w-lg mb-3">
                      <input
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                        placeholder={`Es. categoria per ${t.label.toLowerCase()}...`}
                        value={newSubtypes[t.id] || ""}
                        onChange={(e) => setNewSubtypes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addSubtype(t.id);
                        }}
                      />
                      <Button
                        className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-4 py-2 shrink-0"
                        onClick={() => addSubtype(t.id)}
                        type="button"
                      >
                        Aggiungi
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(settings.taskSubtypes?.[t.id] || []).length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Nessuno configurato.</span>
                      ) : (
                        (settings.taskSubtypes?.[t.id] || []).map((val) => {
                          const id = val.id || val;
                          const label = val.label || val;
                          const isEditing = editingSubtype?.typeId === t.id && editingSubtype?.id === id;
                          return (
                            <div key={id} className="flex items-center gap-1.5 rounded-full bg-slate-100 pl-3 pr-1 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {isEditing ? (
                                <input
                                  autoFocus
                                  className="bg-transparent outline-none text-xs font-semibold w-24 min-w-0"
                                  value={editingSubtype.label}
                                  onChange={(e) => setEditingSubtype((prev) => ({ ...prev, label: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveSubtypeRename();
                                    if (e.key === "Escape") setEditingSubtype(null);
                                  }}
                                  onBlur={saveSubtypeRename}
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                                  title="Clicca per rinominare"
                                  onClick={() => setEditingSubtype({ typeId: t.id, id, label })}
                                >
                                  {label}
                                </span>
                              )}
                              {(() => {
                                const list = settings.taskSubtypes?.[t.id] || [];
                                const idx = list.findIndex((x) => (x.id || x) === id);
                                return (
                                  <>
                                    <button
                                      onClick={() => moveSubtype(t.id, id, "up")}
                                      disabled={idx <= 0}
                                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                      title="Sposta su"
                                    >
                                      <Icon name="chev-up" className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => moveSubtype(t.id, id, "down")}
                                      disabled={idx >= list.length - 1}
                                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                      title="Sposta giù"
                                    >
                                      <Icon name="chev-down" className="w-3 h-3" />
                                    </button>
                                  </>
                                );
                              })()}
                              <button onClick={() => removeSubtype(t.id, id)} className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Rimuovi">
                                <Icon name="x" className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sezione Tag Todo */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <div className="space-y-1 mb-4">
                  <div className="text-base font-bold text-slate-900 dark:text-white">Tag Attività (Todo)</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Definisci dei tag globali da assegnare alle tue attività nella todo-list.
                  </div>
                </div>
                <div className="flex gap-2 w-full max-w-lg mb-4">
                  <input
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Es. Urgent, Personal, Progetti..."
                    value={newTodoTag}
                    onChange={(e) => setNewTodoTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTodoTag();
                      }
                    }}
                  />
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-4 py-2 shrink-0"
                    onClick={addTodoTag}
                    type="button"
                  >
                    Aggiungi
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(settings.todoTags || []).length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Nessun tag configurato.</span>
                  ) : (
                    (settings.todoTags || []).map((tag) => (
                      <div key={tag} className="flex items-center gap-1.5 rounded-full bg-sky-50 pl-3 pr-1 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20">
                        {editingTag === tag ? (
                          <input
                            autoFocus
                            className="bg-transparent outline-none text-xs font-semibold text-sky-700 dark:text-sky-400 w-20 min-w-0"
                            value={editingTagValue}
                            onChange={(e) => setEditingTagValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTagRename();
                              if (e.key === "Escape") { setEditingTag(null); setEditingTagValue(""); }
                            }}
                            onBlur={saveTagRename}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
                            title="Clicca per rinominare"
                            onClick={() => { setEditingTag(tag); setEditingTagValue(tag); }}
                          >
                            {tag}
                          </span>
                        )}
                        {(() => {
                          const tags = settings.todoTags || [];
                          const idx = tags.indexOf(tag);
                          return (
                            <>
                              <button
                                onClick={() => moveTag(tag, "up")}
                                disabled={idx <= 0}
                                className="p-1 rounded-full text-sky-300 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                title="Sposta su"
                              >
                                <Icon name="chev-up" className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveTag(tag, "down")}
                                disabled={idx >= tags.length - 1}
                                className="p-1 rounded-full text-sky-300 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                title="Sposta giù"
                              >
                                <Icon name="chev-down" className="w-3 h-3" />
                              </button>
                            </>
                          );
                        })()}
                        <button onClick={() => removeTodoTag(tag)} className="p-1 rounded-full text-sky-400 hover:text-rose-500 hover:bg-sky-100 dark:hover:bg-rose-500/20 transition-colors" title="Rimuovi">
                          <Icon name="x" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
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
                  <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileSelected} />
                </div>
                {importStatus && (
                  <p className={`text-sm mt-1 ${importStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {importStatus.message}
                  </p>
                )}
              </div>

              {availableMonths.length > 0 && (
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                  <div className="space-y-1">
                    <div className="text-base font-bold text-slate-900 dark:text-white">Esporta per periodo</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Seleziona un intervallo di mesi da esportare in JSON.</div>
                  </div>
                  {(() => {
                    const selectCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/20 transition";
                    const labelCls = "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-1.5 block";
                    const rangeCount = availableMonths.filter((m) => m >= exportFrom && m <= exportTo).length;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className={labelCls}>Da</span>
                            <select className={selectCls} value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}>
                              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className={labelCls}>A</span>
                            <select className={selectCls} value={exportTo} onChange={(e) => setExportTo(e.target.value)}>
                              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-6 disabled:opacity-40"
                            onClick={handleExportRange}
                            type="button"
                            disabled={rangeCount === 0}
                          >
                            <Icon name="download" className="mr-2 w-4 h-4" />
                            Esporta selezione
                          </Button>
                          {rangeCount > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {rangeCount} {rangeCount === 1 ? "mese" : "mesi"}
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {!hasDesktopBridge && (
                <div className="rounded-[24px] border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-700 dark:bg-slate-800/50 shadow-sm">
                  <div className="space-y-1">
                    <div className="text-base font-bold text-slate-900 dark:text-white">Backup Automatico</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Salva automaticamente i dati su un file locale ad ogni modifica.
                    </div>
                  </div>
                  {supportsAutoBackup ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${backupFileHandle ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {backupStatus || "Backup automatico non attivo."}
                        </span>
                      </div>
                      {backupFileHandle ? (
                        <Button
                          className="bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl"
                          onClick={onDisableAutoBackup}
                          type="button"
                        >
                          Disattiva backup automatico
                        </Button>
                      ) : (
                        <Button
                          className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl px-6"
                          onClick={enableAutoBackup}
                          type="button"
                        >
                          Attiva backup automatico
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Il tuo browser non supporta il salvataggio automatico su file. Usa Export manuale.
                    </p>
                  )}
                </div>
              )}

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

      <Modal
        open={Boolean(pendingImportFile)}
        title="Importare il backup?"
        onClose={cancelImport}
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Stai per importare <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingImportFile?.name}</span>.
          </p>
          {importPreview === null && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Analisi del file in corso…</p>
          )}
          {importPreview && importPreview.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-900/20">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{importPreview.error}</p>
            </div>
          ) : importPreview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Anteprima contenuto</div>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{importPreview.months}</span>
                <span className="text-slate-500">{importPreview.months === 1 ? "mese" : "mesi"}</span>
                <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
                <span className="font-semibold">{importPreview.dayCount}</span>
                <span className="text-slate-500">{importPreview.dayCount === 1 ? "giorno con dati" : "giorni con dati"}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{importPreview.dateRange}</div>
            </div>
          )}
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            Tutti i dati esistenti verranno sovrascritti. L&apos;operazione non è reversibile.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={cancelImport}
              type="button"
            >
              Annulla
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 disabled:opacity-40"
              onClick={confirmImport}
              type="button"
              disabled={Boolean(importPreview?.error) || importPreview === null}
            >
              Importa
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
