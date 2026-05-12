import { useRef, useState, useEffect } from "react";
import { importAll, listStoredMonths, exportMonths } from "../services/storage";
import { loadTodos, saveTodos } from "../services/storage/todo";
import { Button, Icon, Modal, Segmented } from "./ui";
import { getClientColor, getInternalColor, normalizeClientKey, normalizeHexColor, TASK_TYPES, LOCATION_TYPES, hourLabel } from "../domain/tasks";

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
  const [activeSection, setActiveSection] = useState("preferenze");
  const [importStatus, setImportStatus] = useState(null);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  function handleTabChange(tab) {
    setActiveSection(tab);
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
      clientColors: { ...(prev.clientColors || {}), [key]: normalized },
    }));
  }

  function setInternalSubtypeColor(subtypeId, color) {
    const normalized = normalizeHexColor(color);
    if (!subtypeId || !normalized) return;
    setSettings((prev) => ({
      ...prev,
      internalColors: { ...(prev.internalColors || {}), [subtypeId]: normalized },
    }));
  }

  function resetInternalSubtypeColor(subtypeId) {
    if (!subtypeId) return;
    setSettings((prev) => {
      const next = { ...(prev.internalColors || {}) };
      delete next[subtypeId];
      return { ...prev, internalColors: next };
    });
  }

  function resetClientColor(clientName) {
    const key = normalizeClientKey(clientName);
    if (!key) return;
    setSettings((prev) => {
      const nextColors = { ...(prev.clientColors || {}) };
      delete nextColors[key];
      return { ...prev, clientColors: nextColors };
    });
  }

  const [availableMonths, setAvailableMonths] = useState([]);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  useEffect(() => {
    if (activeSection !== "esportazioni") return;
    const months = listStoredMonths();
    setAvailableMonths(months);
    if (months.length > 0) {
      setExportFrom((prev) => (prev && months.includes(prev) ? prev : months[0]));
      setExportTo((prev) => (prev && months.includes(prev) ? prev : months[months.length - 1]));
    }
  }, [activeSection]);

  function handleExportRange() {
    const range = availableMonths.filter((m) => m >= exportFrom && m <= exportTo);
    if (range.length === 0) return;
    exportMonths(range);
  }

  const [newSubtypes, setNewSubtypes] = useState({});
  const [newTodoTag, setNewTodoTag] = useState("");
  const [editingSubtype, setEditingSubtype] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
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
      return { ...prev, todoTags: [...tags, val] };
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
      return { ...prev, taskSubtypes: { ...st, [typeId]: [...list, { id: newId, label: val }] } };
    });
    setNewSubtypes((prev) => ({ ...prev, [typeId]: "" }));
  }

  function removeSubtype(typeId, idToRemove) {
    setSettings((prev) => {
      const st = prev.taskSubtypes || {};
      const list = st[typeId] || [];
      return { ...prev, taskSubtypes: { ...st, [typeId]: list.filter((x) => x.id !== idToRemove) } };
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
      return { ...prev, taskSubtypes: { ...st, [typeId]: list } };
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

  const card = "rounded-[20px] border border-si-border bg-si-surface shadow-si overflow-hidden";
  const cardPad = "rounded-[20px] border border-si-border bg-si-surface shadow-si p-6";

  const NAV_ITEMS = [
    { key: "preferenze", label: "Preferenze", icon: "settings" },
    { key: "categorie", label: "Categorie attività", icon: "list-check" },
    { key: "colori", label: "Colori", icon: "reset-rainbow" },
    { key: "esportazioni", label: "Esportazioni", icon: "upload" },
  ];

  const SECTION_TITLES = {
    preferenze: "Preferenze",
    categorie: "Categorie attività",
    colori: "Colori",
    esportazioni: "Esportazioni",
  };

  return (
    <Modal open={open} onClose={onClose} fullscreen>
      <div className="flex flex-1 min-h-0 w-full gap-0 max-w-screen-xl mx-auto">

        {/* Sidebar nav */}
        <div className="w-52 shrink-0 flex flex-col gap-0.5 pr-6 border-r border-si-border mr-8">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent mb-1">Impostazioni</div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-si-ink">{SECTION_TITLES[activeSection]}</h1>
          </div>
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left border-0 cursor-pointer ${
                activeSection === key
                  ? "bg-si-accentBg text-si-accent"
                  : "bg-transparent text-si-gray hover:bg-si-muted hover:text-si-inkSoft"
              }`}
            >
              <Icon name={icon} className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {activeSection === "colori" && (
            <div className="flex flex-col gap-4">
              {/* Colori clienti */}
              <div className={card}>
                <div className="px-6 pt-6 pb-4">
                  <div className="text-base font-bold text-si-ink">Colori clienti</div>
                  <div className="text-sm text-si-gray mt-0.5">
                    Clicca su un colore per personalizzarlo. I colori non assegnati sono generati automaticamente.
                  </div>
                </div>
                {clientNames.length === 0 ? (
                  <div className="px-6 pb-6 text-sm text-si-grayLight italic">
                    Nessun cliente trovato nei log salvati.
                  </div>
                ) : (
                  <div className="space-y-0">
                    {clientNames.map((clientName, idx) => {
                      const key = normalizeClientKey(clientName);
                      const hasCustom = Boolean(normalizeHexColor(settings.clientColors?.[key]));
                      const rawColor = getClientColor(clientName, settings.clientColors);
                      const color = normalizeHexColor(rawColor) || rawColor || "#94a3b8";
                      return (
                        <div
                          key={clientName}
                          className={"flex items-center justify-between px-6 py-3 transition-colors " + (idx < clientNames.length - 1 ? "border-b border-si-border" : "")}
                        >
                          <div className="flex items-center gap-4 group">
                            <label className="relative cursor-pointer">
                              <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={color} onChange={(e) => setClientColor(clientName, e.target.value)} />
                              <div className="w-10 h-10 rounded-full border-2 border-si-surface shadow-si transition-transform group-hover:scale-105" style={{ backgroundColor: color }} />
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-si-inkSoft">{clientName}</span>
                              {!hasCustom && <span className="text-[10px] font-semibold uppercase tracking-wide text-si-grayLight bg-si-muted px-1.5 py-0.5 rounded border border-si-border">auto</span>}
                            </div>
                          </div>
                          {hasCustom && (
                            <button onClick={() => resetClientColor(clientName)} type="button" className="p-2 rounded-full text-si-grayLight hover:text-si-inkSoft hover:bg-si-muted transition-all hover:scale-110 border-0 bg-transparent cursor-pointer" title="Ripristina colore automatico">
                              <Icon name="rotate-ccw" className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Colori subtask interni */}
              {(settings.taskSubtypes?.["internal"] || []).length > 0 && (
                <div className={card}>
                  <div className="px-6 pt-6 pb-4">
                    <div className="text-base font-bold text-si-ink">Colori subtask interni</div>
                    <div className="text-sm text-si-gray mt-0.5">
                      Clicca su un colore per personalizzarlo. I colori non assegnati sono generati automaticamente.
                    </div>
                  </div>
                  <div className="space-y-0">
                    {(settings.taskSubtypes?.["internal"] || []).map((val, idx, arr) => {
                      const id = val.id || val;
                      const label = val.label || val;
                      const hasCustom = Boolean(normalizeHexColor(settings.internalColors?.[id]));
                      const rawColor = getInternalColor(id, settings.internalColors);
                      const color = normalizeHexColor(rawColor) || rawColor || "#94a3b8";
                      return (
                        <div key={id} className={"flex items-center justify-between px-6 py-3 transition-colors " + (idx < arr.length - 1 ? "border-b border-si-border" : "")}>
                          <div className="flex items-center gap-4 group">
                            <label className="relative cursor-pointer">
                              <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={color} onChange={(e) => setInternalSubtypeColor(id, e.target.value)} />
                              <div className="w-10 h-10 rounded-full border-2 border-si-surface shadow-si transition-transform group-hover:scale-105" style={{ backgroundColor: color }} />
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-si-inkSoft">{label}</span>
                              {!hasCustom && <span className="text-[10px] font-semibold uppercase tracking-wide text-si-grayLight bg-si-muted px-1.5 py-0.5 rounded border border-si-border">auto</span>}
                            </div>
                          </div>
                          {hasCustom && (
                            <button onClick={() => resetInternalSubtypeColor(id)} type="button" className="p-2 rounded-full text-si-grayLight hover:text-si-inkSoft hover:bg-si-muted transition-all hover:scale-110 border-0 bg-transparent cursor-pointer" title="Ripristina colore automatico">
                              <Icon name="rotate-ccw" className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "preferenze" && (
            <div className="flex flex-col gap-4">
              {/* Left: Aspetto */}
              <div className={card}>
                <div className="px-6 pt-6 pb-2">
                  <div className="text-base font-bold text-si-ink">Aspetto</div>
                  <div className="text-sm text-si-gray mt-0.5">Personalizza la visualizzazione dell&apos;interfaccia.</div>
                </div>
                <div className="divide-y divide-si-border">
                  <div className="px-6 py-4 flex items-center justify-between gap-6">
                    <div>
                      <div className="text-sm font-semibold text-si-inkSoft">Tema</div>
                      <div className="text-xs text-si-gray mt-0.5">Chiaro o scuro</div>
                    </div>
                    <div className="shrink-0">
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
                  <div className="px-6 py-4 flex items-center justify-between gap-6">
                    <div>
                      <div className="text-sm font-semibold text-si-inkSoft">Vista all&apos;avvio</div>
                      <div className="text-xs text-si-gray mt-0.5">Visualizzazione predefinita</div>
                    </div>
                    <div className="shrink-0">
                      <Segmented
                        value={settings.defaultView || "day"}
                        onChange={(val) => setSettings((prev) => ({ ...prev, defaultView: val }))}
                        options={[
                          { label: "Giorno", value: "day" },
                          { label: "Settimana", value: "week" },
                          { label: "Mese", value: "month" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between gap-6">
                    <div>
                      <div className="text-sm font-semibold text-si-inkSoft">Sede di default</div>
                      <div className="text-xs text-si-gray mt-0.5">Sede applicata ai nuovi giorni</div>
                    </div>
                    <div className="shrink-0">
                      <Segmented
                        value={settings.defaultLocation || LOCATION_TYPES.REMOTE}
                        onChange={(val) => setSettings((prev) => ({ ...prev, defaultLocation: val }))}
                        options={[
                          { label: "Remoto", value: LOCATION_TYPES.REMOTE },
                          { label: "Ufficio", value: LOCATION_TYPES.OFFICE },
                          { label: "Cliente", value: LOCATION_TYPES.CLIENT },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between gap-6">
                    <div>
                      <div className="text-sm font-semibold text-si-inkSoft">Lista attività (To-do)</div>
                      <div className="text-xs text-si-gray mt-0.5">Mostra il pannello to-do nella vista giornaliera</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, showTodo: prev.showTodo === false ? true : false }))}
                      className={"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none border-0 cursor-pointer " + (settings.showTodo === false ? "bg-si-border" : "bg-si-accent")}
                    >
                      <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " + (settings.showTodo === false ? "translate-x-1" : "translate-x-6")} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Orario + Patrono */}
              <div className="space-y-4">
                <div className={`${cardPad} space-y-4`}>
                  <div className="space-y-1">
                    <div className="text-base font-bold text-si-ink">Orario lavorativo</div>
                    <div className="text-sm text-si-gray">Configura le fasce orarie visualizzate nel calendario.</div>
                  </div>
                  {(() => {
                    const workHours = settings.workHours || {};
                    const timeOptions = [];
                    for (let m = 6 * 60; m <= 22 * 60; m += 30) timeOptions.push(m);
                    const selectCls = "w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm font-semibold text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition";
                    const labelCls = "text-[11px] font-semibold uppercase tracking-[0.14em] text-si-gray mb-1.5 block";
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className={labelCls}>Mattina — inizio</span>
                          <select className={selectCls} value={workHours.morningStart ?? 540} onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, morningStart: Number(e.target.value) } }))}>
                            {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                          </select>
                        </div>
                        <div>
                          <span className={labelCls}>Mattina — fine</span>
                          <select className={selectCls} value={workHours.morningEnd ?? 780} onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, morningEnd: Number(e.target.value) } }))}>
                            {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                          </select>
                        </div>
                        <div>
                          <span className={labelCls}>Pomeriggio — inizio</span>
                          <select className={selectCls} value={workHours.afternoonStart ?? 840} onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, afternoonStart: Number(e.target.value) } }))}>
                            {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                          </select>
                        </div>
                        <div>
                          <span className={labelCls}>Pomeriggio — fine</span>
                          <select className={selectCls} value={workHours.afternoonEnd ?? 1080} onChange={(e) => setSettings(prev => ({ ...prev, workHours: { ...prev.workHours, afternoonEnd: Number(e.target.value) } }))}>
                            {timeOptions.map(m => <option key={m} value={m}>{hourLabel(m)}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className={`${cardPad} space-y-4`}>
                  <div className="space-y-1">
                    <div className="text-base font-bold text-si-ink">Giorno del patrono</div>
                    <div className="text-sm text-si-gray">Festività locale della sede. Risulta non lavorativo nel calendario.</div>
                  </div>
                  {(() => {
                    const raw = settings.patronDay ?? "12-07";
                    const [mm, dd] = raw.split("-").map(Number);
                    const selectCls = "rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm font-semibold text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition";
                    const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
                    const daysInMonth = [31,29,31,30,31,30,31,31,30,31,30,31];
                    const maxDay = daysInMonth[(mm || 12) - 1] || 31;
                    function update(newMm, newDd) {
                      const m = String(newMm).padStart(2, "0");
                      const d = String(Math.min(newDd, daysInMonth[newMm - 1] || 31)).padStart(2, "0");
                      setSettings(prev => ({ ...prev, patronDay: `${m}-${d}` }));
                    }
                    return (
                      <div className="flex items-center gap-3 flex-wrap">
                        <select className={selectCls} value={mm || 12} onChange={(e) => update(Number(e.target.value), dd || 7)}>
                          {MONTHS_IT.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
                        </select>
                        <select className={selectCls} value={dd || 7} onChange={(e) => update(mm || 12, Number(e.target.value))}>
                          {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {(settings.patronDay == null || settings.patronDay === "12-07") && (
                          <span className="text-xs text-si-grayLight italic">Sant&apos;Ambrogio (Milano)</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeSection === "categorie" && (
            <div className="space-y-4">
              {TASK_TYPES.map((t) => {
                const items = settings.taskSubtypes?.[t.id] || [];
                return (
                  <div key={t.id} className={`${cardPad}`}>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-base font-bold text-si-ink">{t.label}</div>
                          <div className="text-sm text-si-gray mt-0.5">Sottotipi per task {t.label.toLowerCase()}.</div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                            placeholder={`Es. categoria per ${t.label.toLowerCase()}...`}
                            value={newSubtypes[t.id] || ""}
                            onChange={(e) => setNewSubtypes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") addSubtype(t.id); }}
                          />
                          <Button
                            className="text-white rounded-xl px-4 shrink-0"
                            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                            onClick={() => addSubtype(t.id)}
                            type="button"
                          >
                            Aggiungi
                          </Button>
                        </div>
                      </div>
                      <div>
                        {items.length === 0 ? (
                          <div className="flex items-center justify-center h-full min-h-[80px]">
                            <span className="text-xs text-si-grayLight italic">Nessuno configurato.</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {items.map((val) => {
                              const id = val.id || val;
                              const label = val.label || val;
                              const idx = items.findIndex((x) => (x.id || x) === id);
                              const isEditing = editingSubtype?.typeId === t.id && editingSubtype?.id === id;
                              return (
                                <div key={id} className="flex items-center justify-between rounded-xl bg-si-muted px-3 py-2 border border-si-border group/item">
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      className="flex-1 bg-transparent outline-none text-sm font-semibold text-si-inkSoft min-w-0"
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
                                      className="text-sm font-semibold text-si-inkSoft truncate cursor-pointer hover:text-si-accent transition-colors"
                                      title="Clicca per rinominare"
                                      onClick={() => setEditingSubtype({ typeId: t.id, id, label })}
                                    >
                                      {label}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button onClick={() => moveSubtype(t.id, id, "up")} disabled={idx <= 0} className="p-1 rounded-lg text-si-grayLight hover:text-si-inkSoft hover:bg-si-border transition-colors disabled:opacity-30 disabled:pointer-events-none border-0 bg-transparent cursor-pointer" title="Sposta su">
                                      <Icon name="chev-up" className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => moveSubtype(t.id, id, "down")} disabled={idx >= items.length - 1} className="p-1 rounded-lg text-si-grayLight hover:text-si-inkSoft hover:bg-si-border transition-colors disabled:opacity-30 disabled:pointer-events-none border-0 bg-transparent cursor-pointer" title="Sposta giù">
                                      <Icon name="chev-down" className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => removeSubtype(t.id, id)} className="p-1 rounded-lg text-si-grayLight hover:text-si-rose hover:bg-si-border transition-colors border-0 bg-transparent cursor-pointer" title="Rimuovi">
                                      <Icon name="x" className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Tag Todo */}
              <div className={`${cardPad}`}>
                <div className="flex flex-col gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-base font-bold text-si-ink">Tag Todo</div>
                      <div className="text-sm text-si-gray mt-0.5">Tag globali da assegnare alle attività nella todo-list.</div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                        placeholder="Es. Urgent, Personal, Progetti..."
                        value={newTodoTag}
                        onChange={(e) => setNewTodoTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTodoTag(); } }}
                      />
                      <Button
                        className="text-white rounded-xl px-4 shrink-0"
                        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                        onClick={addTodoTag}
                        type="button"
                      >
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                  <div>
                    {(settings.todoTags || []).length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[80px]">
                        <span className="text-xs text-si-grayLight italic">Nessun tag configurato.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(settings.todoTags || []).map((tag) => {
                          const tags = settings.todoTags || [];
                          const idx = tags.indexOf(tag);
                          return (
                            <div key={tag} className="flex items-center justify-between rounded-xl bg-si-accentSoft px-3 py-2 border border-si-accentSoft group/tag">
                              {editingTag === tag ? (
                                <input
                                  autoFocus
                                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-si-accent min-w-0"
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
                                  className="text-sm font-semibold text-si-accent truncate cursor-pointer hover:text-si-accentDark transition-colors"
                                  title="Clicca per rinominare"
                                  onClick={() => { setEditingTag(tag); setEditingTagValue(tag); }}
                                >
                                  {tag}
                                </span>
                              )}
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                <button onClick={() => moveTag(tag, "up")} disabled={idx <= 0} className="p-1 rounded-lg text-si-grayLight hover:text-si-accent hover:bg-si-muted transition-colors disabled:opacity-30 disabled:pointer-events-none border-0 bg-transparent cursor-pointer" title="Sposta su">
                                  <Icon name="chev-up" className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveTag(tag, "down")} disabled={idx >= tags.length - 1} className="p-1 rounded-lg text-si-grayLight hover:text-si-accent hover:bg-si-muted transition-colors disabled:opacity-30 disabled:pointer-events-none border-0 bg-transparent cursor-pointer" title="Sposta giù">
                                  <Icon name="chev-down" className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => removeTodoTag(tag)} className="p-1 rounded-lg text-si-grayLight hover:text-si-rose hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer" title="Rimuovi">
                                  <Icon name="x" className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "esportazioni" && (
            <div className="flex flex-col gap-4">
              <div className={`${cardPad} space-y-6`}>
                {/* Card Esporta */}
                <div className="space-y-1">
                  <div className="text-base font-bold text-si-ink">Esporta</div>
                  <div className="text-sm text-si-gray">Salva i tuoi dati in formato JSON.</div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-si-inkSoft">Tutti i dati</div>
                      <div className="text-xs text-si-gray mt-0.5">Esporta l&apos;intero archivio</div>
                    </div>
                    <Button className="text-white rounded-xl px-4 shrink-0" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }} onClick={exportAll} type="button">
                      <Icon name="download" className="mr-2 w-4 h-4" />
                      Esporta tutto
                    </Button>
                  </div>
                  {availableMonths.length > 0 && (() => {
                    const selectCls = "w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm font-semibold text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition";
                    const rangeCount = availableMonths.filter((m) => m >= exportFrom && m <= exportTo).length;
                    return (
                      <div className="pt-4 border-t border-si-border space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-si-inkSoft">Per periodo</div>
                          <div className="text-xs text-si-gray mt-0.5">Seleziona l&apos;intervallo di mesi</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-si-gray mb-1.5 block">Da</span>
                            <select className={selectCls} value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}>
                              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-si-gray mb-1.5 block">A</span>
                            <select className={selectCls} value={exportTo} onChange={(e) => setExportTo(e.target.value)}>
                              {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            className="bg-si-muted border border-si-border text-si-ink hover:bg-si-border rounded-xl px-4 disabled:opacity-40"
                            onClick={handleExportRange}
                            type="button"
                            disabled={rangeCount === 0}
                          >
                            <Icon name="download" className="mr-2 w-4 h-4" />
                            Esporta selezione
                          </Button>
                          {rangeCount > 0 && (
                            <span className="text-xs text-si-gray">
                              {rangeCount} {rangeCount === 1 ? "mese" : "mesi"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-4">
              {/* Card Importa */}
              <div className={`${cardPad} space-y-4`}>
                <div className="space-y-1">
                  <div className="text-base font-bold text-si-ink">Importa</div>
                  <div className="text-sm text-si-gray">Ripristina da un file di backup JSON.</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-si-inkSoft">Seleziona file</div>
                    <div className="text-xs text-si-gray mt-0.5">Sovrascrive i dati esistenti</div>
                  </div>
                  <Button
                    className="bg-si-muted border border-si-border text-si-ink hover:bg-si-border rounded-xl px-4 shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Icon name="upload" className="mr-2 w-4 h-4" />
                    Importa backup
                  </Button>
                  <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileSelected} />
                </div>
                {importStatus && (
                  <p className={`text-sm ${importStatus.ok ? "text-si-success" : "text-si-rose"}`}>
                    {importStatus.message}
                  </p>
                )}
              </div>

              {!hasDesktopBridge && (
                <div className={`${cardPad} space-y-4`}>
                  <div className="space-y-1">
                    <div className="text-base font-bold text-si-ink">Backup Automatico</div>
                    <div className="text-sm text-si-gray">
                      Salva automaticamente i dati su un file locale ad ogni modifica.
                    </div>
                  </div>
                  {supportsAutoBackup ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${backupFileHandle ? "bg-si-success" : "bg-si-border"}`} />
                        <span className="text-sm text-si-gray">
                          {backupStatus || "Backup automatico non attivo."}
                        </span>
                      </div>
                      {backupFileHandle ? (
                        <Button
                          className="bg-si-muted border border-si-border text-si-inkSoft hover:bg-si-rose/5 hover:text-si-rose hover:border-si-rose/30 rounded-xl"
                          onClick={onDisableAutoBackup}
                          type="button"
                        >
                          Disattiva backup automatico
                        </Button>
                      ) : (
                        <Button
                          className="text-white rounded-xl px-6"
                          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                          onClick={enableAutoBackup}
                          type="button"
                        >
                          Attiva backup automatico
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-si-amber">
                      Il tuo browser non supporta il salvataggio automatico su file. Usa Export manuale.
                    </p>
                  )}
                </div>
              )}

              {hasDesktopBridge && (
                <div className="space-y-4">
                  <div className={`${cardPad} space-y-4`}>
                    <div className="text-base font-bold text-si-ink">Comportamento finestra</div>
                    <label className="flex items-center gap-4 cursor-pointer select-none group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 rounded border-si-border text-si-accent focus:ring-si-accent/30"
                          checked={Boolean(settings.minimizeToTrayOnMinimize)}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              minimizeToTrayOnMinimize: e.target.checked,
                            }))
                          }
                        />
                      </div>
                      <span className="text-sm font-medium text-si-inkSoft group-hover:text-si-ink transition-colors">
                        Quando minimizzo, nascondi la finestra e mostra l&apos;icona nella tray.
                      </span>
                    </label>
                  </div>

                  <div className={`${cardPad} space-y-4`}>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-si-ink">Percorso salvataggi backup</div>
                      <div className="text-sm text-si-gray">Se vuoto, viene usata la cartella predefinita in Documenti.</div>
                    </div>
                    <div className="rounded-xl border border-si-border bg-si-muted px-4 py-3 text-sm break-all font-mono text-si-gray">
                      {settings.desktopBackupDir || "(predefinito: Documenti\\DailyLog\\backup)"}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-si-muted border border-si-border text-si-ink hover:bg-si-border rounded-xl"
                        onClick={pickDesktopBackupDir}
                        type="button"
                      >
                        Scegli cartella
                      </Button>
                      <Button
                        className="bg-si-muted border border-si-border text-si-ink hover:bg-si-border rounded-xl"
                        onClick={useDefaultDesktopBackupDir}
                        type="button"
                      >
                        Usa predefinito
                      </Button>
                    </div>
                    {(settingsStatus || desktopBackupPath) && (
                      <div className="space-y-1 pt-2 border-t border-si-border">
                        {settingsStatus && <div className="text-xs text-si-gray italic">{settingsStatus}</div>}
                        {desktopBackupPath && <div className="text-xs text-si-gray break-all">File attuale: {desktopBackupPath}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>

      </div>

      <Modal
        open={Boolean(pendingImportFile)}
        title="Importare il backup?"
        onClose={cancelImport}
      >
        <div className="space-y-4">
          <p className="text-si-gray">
            Stai per importare <span className="font-semibold text-si-inkSoft">{pendingImportFile?.name}</span>.
          </p>
          {importPreview === null && (
            <p className="text-sm text-si-grayLight italic">Analisi del file in corso…</p>
          )}
          {importPreview && importPreview.error ? (
            <div className="rounded-xl border border-si-rose/20 bg-si-rose/5 px-4 py-3">
              <p className="text-sm font-semibold text-si-rose">{importPreview.error}</p>
            </div>
          ) : importPreview && (
            <div className="rounded-xl border border-si-border bg-si-muted px-4 py-3 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-si-gray mb-2">Anteprima contenuto</div>
              <div className="flex items-center gap-2 text-sm text-si-inkSoft">
                <span className="font-semibold">{importPreview.months}</span>
                <span className="text-si-gray">{importPreview.months === 1 ? "mese" : "mesi"}</span>
                <span className="text-si-grayLight mx-1">·</span>
                <span className="font-semibold">{importPreview.dayCount}</span>
                <span className="text-si-gray">{importPreview.dayCount === 1 ? "giorno con dati" : "giorni con dati"}</span>
              </div>
              <div className="text-xs text-si-gray font-mono">{importPreview.dateRange}</div>
            </div>
          )}
          <p className="text-sm text-si-amber font-medium">
            Tutti i dati esistenti verranno sovrascritti. L&apos;operazione non è reversibile.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="bg-si-muted text-si-ink hover:bg-si-border"
              onClick={cancelImport}
              type="button"
            >
              Annulla
            </Button>
            <Button
              className="bg-si-rose text-white hover:bg-si-rose/90 disabled:opacity-40"
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
