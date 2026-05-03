import { useState, useMemo } from "react";
import { SLOT_MINUTES, TASK_TYPES, LOCATION_TYPES, normalizeClientKey } from "../domain/tasks";
import { Icon } from "./ui";
import { useSettings, useWorkSlots } from "../contexts/SettingsContext";
import { Combobox } from "./Combobox";
import { loadProjects } from "../services/storage";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { MarkdownEditor } from "./MarkdownEditor";

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
  location,
  setLocation,
  column = "all", // "left" | "right" | "all"
}) {
  const { settings, setSettings } = useSettings();
  const { MORNING_SLOTS, AFTERNOON_SLOTS } = useWorkSlots();
  const taskSubtypes = settings?.taskSubtypes || {};
  const setField = (k, v) => onChange({ ...entry, [k]: v });
  const [personInput, setPersonInput] = useState("");
  const [clientContactInput, setClientContactInput] = useState("");
  const [retroOpen, setRetroOpen] = useState(false);

  const { listeningField, isSpeechSupported, toggle: toggleSpeech } = useSpeechRecognition();
  const appendText = (fieldName, text) => {
    const current = entry[fieldName] || "";
    const sep = current && !current.endsWith(" ") && !current.endsWith("\n") ? " " : "";
    setField(fieldName, current + sep + text);
  };
  const micBtn = (fieldName) => {
    if (!isSpeechSupported) return null;
    const active = listeningField === fieldName;
    return (
      <button
        type="button"
        title={active ? "Ferma dettatura" : "Dettatura vocale"}
        onClick={() => toggleSpeech(fieldName, (text) => appendText(fieldName, text))}
        className={"p-1 rounded-lg transition-colors " + (active ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-sky-500")}
      >
        <Icon name="mic" className="w-4 h-4" />
      </button>
    );
  };

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

  const addClientContact = (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const current = entry.clientContacts || [];
    if (current.includes(cleanName)) return;
    setField("clientContacts", [...current, cleanName]);
    setClientContactInput("");
  };

  const removeClientContact = (name) => {
    setField("clientContacts", (entry.clientContacts || []).filter(c => c !== name));
  };

  const projects = useMemo(() => loadProjects(), []);

  // Contatti cliente dal progetto corrente (solo per task client)
  const allClientContacts = useMemo(() => {
    if (entry.type !== "client" || !entry.client) return [];
    const pid = "client::" + normalizeClientKey(entry.client);
    const projectContacts = projects[pid]?.clientContacts || [];
    // fallback: tutti i clientContacts da tutti i progetti
    if (projectContacts.length > 0) return projectContacts;
    const set = new Set();
    Object.values(projects).forEach(p => (p.clientContacts || []).forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [projects, entry.type, entry.client]);

  // Collaboratori suggeriti: team del progetto corrente in cima, poi allPeople
  const suggestedCollaborators = useMemo(() => {
    let projectTeam = [];
    if (entry.type === "client" && entry.client) {
      const pid = "client::" + normalizeClientKey(entry.client);
      projectTeam = projects[pid]?.team || [];
    } else if (entry.type === "internal" && entry.subtypeId) {
      const pid = "internal::" + entry.subtypeId;
      projectTeam = projects[pid]?.team || [];
    }
    const selected = entry.collaborators || [];
    const teamFiltered = projectTeam.filter(n => !selected.includes(n));
    const othersFiltered = allPeople
      .map(p => p.name)
      .filter(n => !selected.includes(n) && !projectTeam.includes(n));
    return [...teamFiltered, ...othersFiltered];
  }, [projects, entry.type, entry.client, entry.subtypeId, entry.collaborators, allPeople]);

  const projectSpecificSubtasks = useMemo(() => {
    if (entry.type === "client" && entry.client) {
      const pid = "client::" + normalizeClientKey(entry.client);
      return projects[pid]?.subtasks || [];
    }
    if (entry.type === "internal" && entry.subtypeId) {
      const pid = "internal::" + entry.subtypeId.trim().toLocaleLowerCase("it-IT");
      return projects[pid]?.subtasks || [];
    }
    return [];
  }, [entry.type, entry.client, entry.subtypeId, projects]);

  const currentSubtypes = useMemo(() => {
    const globalList = taskSubtypes[entry.type] || [];
    // merge
    const merged = [...globalList];
    for (const st of projectSpecificSubtasks) {
      if (!merged.some(m => (m.id || m) === st.id)) {
        merged.push(st);
      }
    }
    return merged;
  }, [taskSubtypes, entry.type, projectSpecificSubtasks]);

  const allSuggestedClients = Array.from(new Set([...topClients, ...allClients]))
    .filter(name => {
      const pid = "client::" + normalizeClientKey(name);
      return (projects[pid]?.status || "active") !== "archived";
    });

  function generateSubtypeId(label) {
    return label.toLowerCase().trim().replace(/[\s\W]+/g, "-").replace(/^-+|-+$/g, "");
  }

  const handleSubtypeChange = (val) => {
    if (!val) { setField("subtypeId", null); return; }
    const newId = generateSubtypeId(val);
    if (!newId) return;
    const exists = currentSubtypes.some(st => st.id === newId || st.label.toLowerCase() === val.toLowerCase());
    if (!exists) {
      // Se non esiste, lo salva nei globali automaticamente
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
            placeholder="Seleziona cliente"
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
          ].filter(st => {
            if (entry.type !== "internal") return true;
            const pid = "internal::" + (st.id || "");
            return (projects[pid]?.status || "active") !== "archived";
          })}
          placeholder={entry.type === "internal" ? "Seleziona attività..." : "Seleziona subtask"}
          allowCustom={true}
        />
      </div>

      {entry.type === "internal" && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Subtask
          </label>
          <Combobox
            value={entry.internalSubtask || ""}
            onChange={(val) => {
              if (!val) { setField("internalSubtask", null); return; }
              const newId = generateSubtypeId(val);
              setField("internalSubtask", newId);
            }}
            options={[
              { id: "", label: "Generico" },
              ...projectSpecificSubtasks
            ]}
            placeholder="Seleziona subtask"
            allowCustom={true}
          />
        </div>
      )}
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
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <Icon name="clock" className="w-3 h-3" />
                Ora di inizio
              </div>
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
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <Icon name="clock" className="w-3 h-3" />
                Ora di fine
              </div>
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
          {autoAdjusted && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Icon name="check" className="w-3 h-3" />
              Fine aggiornata
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Right column ───────────────────────────────────────────────────────────
  const collaboratoriSection = (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <Icon name="users" className="w-3.5 h-3.5" />
        Collaboratori
      </label>
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
          options={suggestedCollaborators}
          placeholder="Aggiungi persona..."
          allowCustom={true}
        />
      </div>
    </div>
  );

  const clientContactsSection = (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <Icon name="building" className="w-3.5 h-3.5" />
        Persone Cliente
      </label>
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
        {(entry.clientContacts || []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
            {c}
            <button onClick={() => removeClientContact(c)} className="text-slate-400 hover:text-rose-500 transition-colors">
              <Icon name="x" className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Combobox
          className="flex-1 min-w-[160px]"
          value={clientContactInput}
          onChange={(val) => { if (val) addClientContact(val); setClientContactInput(""); }}
          options={allClientContacts.filter(c => !(entry.clientContacts || []).includes(c))}
          placeholder="Aggiungi referente cliente..."
          allowCustom={true}
        />
      </div>
    </div>
  );

  const logBox = (icon, label, content, micField) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <Icon name={icon} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-1">{label}</span>
        {micField && isSpeechSupported && micBtn(micField)}
      </div>
      <div className="bg-white dark:bg-slate-900">{content}</div>
    </div>
  );

  const propRow = (label, content, opts = {}) => (
    <div className="flex items-center gap-3 min-h-[32px]">
      <span className={`shrink-0 text-xs text-slate-500 dark:text-slate-400 ${opts.labelWidth || "w-24"}`}>{label}</span>
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );

  const sidebarSelect = (value, onChange, children) => (
    <select
      className="w-full text-xs rounded-lg border-0 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-sky-400/20 transition"
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  );

  if (column === "left") {
    return (
      <>
        {/* Attività svolte */}
        {logBox("clipboard", "Attività svolte",
          <MarkdownEditor
            value={entry.notes}
            onChange={(val) => setField("notes", val)}
            placeholder={listeningField === "notes" ? "Sto ascoltando..." : "Descrivi le attività concluse..."}
            isListening={listeningField === "notes"}
          />,
          "notes"
        )}

        {/* Link e Risorse */}
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2.5 border-b border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Icon name="link" className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-1">Link e Risorse</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 flex flex-col gap-2">
            {(entry.links || []).map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="w-28 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 transition"
                  placeholder="Etichetta"
                  value={link.label}
                  onChange={(e) => { const n = [...(entry.links||[])]; n[i]={...n[i],label:e.target.value}; setField("links",n); }}
                />
                <input
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400 transition"
                  placeholder="https://..."
                  type="url"
                  value={link.url}
                  onChange={(e) => { const n = [...(entry.links||[])]; n[i]={...n[i],url:e.target.value}; setField("links",n); }}
                />
                <button type="button" onClick={() => setField("links",(entry.links||[]).filter((_,j)=>j!==i))} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setField("links",[...(entry.links||[]),{label:"",url:""}])}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 w-fit px-1 py-0.5 rounded transition-colors"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Aggiungi link
            </button>
          </div>
        </div>

        {/* Blockers + Next Steps */}
        <div className="grid grid-cols-2 gap-3">
          {logBox("alert-triangle", "Blockers / Problemi",
            <div className="relative">
              <textarea
                className={"w-full px-4 py-3 pb-9 text-sm dark:text-white resize-none outline-none bg-white dark:bg-slate-900 " + (listeningField==="wentWrong" ? "text-red-600 dark:text-red-400" : "")}
                rows={4}
                value={entry.wentWrong}
                onChange={(e) => setField("wentWrong", e.target.value)}
                placeholder={listeningField==="wentWrong" ? "Sto ascoltando..." : "Cosa ha rallentato il task?"}
              />
              {isSpeechSupported && <div className="absolute bottom-2 right-2">{micBtn("wentWrong")}</div>}
            </div>
          )}
          {logBox("zap", "Next Steps",
            <div className="relative">
              <textarea
                className={"w-full px-4 py-3 pb-9 text-sm dark:text-white resize-none outline-none bg-white dark:bg-slate-900 " + (listeningField==="nextSteps" ? "text-red-600 dark:text-red-400" : "")}
                rows={4}
                value={entry.nextSteps}
                onChange={(e) => setField("nextSteps", e.target.value)}
                placeholder={listeningField==="nextSteps" ? "Sto ascoltando..." : "Azioni da intraprendere..."}
              />
              {isSpeechSupported && <div className="absolute bottom-2 right-2">{micBtn("nextSteps")}</div>}
            </div>
          )}
        </div>
      </>
    );
  }

  if (column === "right") {
    return (
      <div className="flex flex-col gap-6">
        {/* Dettagli */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Dettagli</div>
          <div className="flex flex-col gap-1">
            {propRow("Tipo",
              sidebarSelect(entry.type, (e) => setField("type", e.target.value),
                TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)
              )
            )}
            {entry.type === "client" && propRow("Cliente",
              <Combobox
                value={entry.client || ""}
                onChange={(val) => setField("client", val)}
                options={allSuggestedClients}
                placeholder="Seleziona cliente"
                allowCustom={true}
              />
            )}
            {entry.type === "client" && propRow("Referente",
              <div className="flex flex-wrap gap-1 items-center">
                {(entry.clientContacts || []).map(c => (
                  <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {c}
                    <button type="button" onClick={() => setField("clientContacts",(entry.clientContacts||[]).filter(x=>x!==c))} className="text-slate-400 hover:text-rose-500">
                      <Icon name="x" className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <Combobox
                  className="min-w-[100px]"
                  value={clientContactInput}
                  onChange={(val) => { if (val) addClientContact(val); setClientContactInput(""); }}
                  options={allClientContacts.filter(c => !(entry.clientContacts||[]).includes(c))}
                  placeholder="Aggiungi..."
                  allowCustom={true}
                  />
              </div>
            )}
            {propRow(entry.type === "internal" ? "Attività" : "Subtask",
              <Combobox
                value={entry.subtypeId || ""}
                onChange={handleSubtypeChange}
                options={[
                  { id: "", label: "Generico" },
                  ...currentSubtypes.map(st => typeof st === "string" ? { id: st, label: st } : st)
                ].filter(st => {
                  if (entry.type !== "internal") return true;
                  const pid = "internal::" + (st.id || "");
                  return (projects[pid]?.status || "active") !== "archived";
                })}
                placeholder={entry.type === "internal" ? "Seleziona attività..." : "Seleziona subtask"}
                allowCustom={true}
              />
            )}
            {entry.type === "internal" && propRow("Subtask",
              <Combobox
                value={entry.internalSubtask || ""}
                onChange={(val) => {
                  if (!val) { setField("internalSubtask", null); return; }
                  setField("internalSubtask", val.toLowerCase().trim().replace(/[\s\W]+/g, "-").replace(/^-+|-+$/g, ""));
                }}
                options={[{ id: "", label: "Generico" }, ...projectSpecificSubtasks]}
                placeholder="Seleziona subtask"
                allowCustom={true}
              />
            )}
            {propRow("Collaboratori",
              <div className="flex flex-wrap gap-1 items-center">
                {(entry.collaborators || []).map(c => (
                  <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {c}
                    <button type="button" onClick={() => removeCollaborator(c)} className="text-slate-400 hover:text-rose-500">
                      <Icon name="x" className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <Combobox
                  className="min-w-[100px]"
                  value={personInput}
                  onChange={(val) => { if (val) addCollaborator(val); setPersonInput(""); }}
                  options={suggestedCollaborators}
                  placeholder="Aggiungi..."
                  allowCustom={true}
                  />
              </div>
            )}
            {propRow(
              <span className="flex items-center gap-1">
                <Icon name="flag" className="w-3 h-3 text-slate-400" />
                Milestone <span className="text-slate-300 dark:text-slate-600 text-[10px]">(Opz.)</span>
              </span>,
              <input
                className="w-full text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-0 px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-sky-400/20 transition"
                placeholder="Nessuna"
                value={entry.milestone || ""}
                onChange={(e) => setField("milestone", e.target.value || null)}
              />
            )}
          </div>
        </div>

        {/* Registrazione Tempo */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Registrazione Tempo</div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giornata intera</span>
              <button
                type="button"
                onClick={() => setFullDay(prev => !prev)}
                className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none " + (fullDay ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")}
              >
                <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " + (fullDay ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
            {!fullDay && (
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm font-semibold text-center text-slate-700 dark:text-slate-100 outline-none"
                  value={rangeStartMin}
                  onChange={(e) => setRangeStartMin(Number(e.target.value))}
                >
                  {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map(s => (
                    <option key={s} value={s}>{hourLabel(s)}</option>
                  ))}
                </select>
                <span className="text-slate-400 font-bold">→</span>
                <select
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm font-semibold text-center text-slate-700 dark:text-slate-100 outline-none"
                  value={rangeEndMin}
                  onChange={(e) => setRangeEndMin(Number(e.target.value))}
                >
                  {endOptions.map(end => (
                    <option key={end} value={end}>{hourLabel(end)}</option>
                  ))}
                </select>
              </div>
            )}
            {autoAdjusted && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Icon name="check" className="w-3 h-3" />
                Fine aggiornata
              </div>
            )}
            <div className="rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/50 py-2.5 text-center text-sm font-bold text-sky-600 dark:text-sky-400">
              {fullDay ? "8h registrate" : `${rangeDuration}h registrate`}
            </div>
          </div>
        </div>

        {/* Luogo di Lavoro */}
        {setLocation && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Luogo di Lavoro</div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
              {[
                { value: LOCATION_TYPES.REMOTE, label: "Remoto" },
                { value: LOCATION_TYPES.OFFICE, label: "Ufficio" },
                { value: LOCATION_TYPES.CLIENT, label: "Cliente" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocation(value)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    location === value
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // "all" — fallback single-column (backward compat)
  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      {tipoSection}
      {orariSection}
      {collaboratoriSection}
      {entry.type === "client" && clientContactsSection}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Icon name="flag" className="w-3.5 h-3.5" />
          Milestone <span className="text-slate-300 dark:text-slate-600 font-normal normal-case tracking-normal">(opz.)</span>
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition placeholder:text-slate-400 dark:placeholder:text-slate-600"
          placeholder="es. Sprint 42"
          value={entry.milestone || ""}
          onChange={(e) => setField("milestone", e.target.value || null)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Attività svolte</label>
        <MarkdownEditor
          value={entry.notes}
          onChange={(val) => setField("notes", val)}
          placeholder="Descrivi le attività concluse..."
          isListening={listeningField === "notes"}
          micButton={isSpeechSupported ? micBtn("notes") : null}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Icon name="link" className="w-3.5 h-3.5" />
          Link e Risorse
        </label>
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-3">
          {(entry.links || []).map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="w-28 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs outline-none focus:border-sky-400 transition" placeholder="Etichetta" value={link.label}
                onChange={(e) => { const n=[...(entry.links||[])]; n[i]={...n[i],label:e.target.value}; setField("links",n); }} />
              <input className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs outline-none focus:border-sky-400 transition" placeholder="https://..." type="url" value={link.url}
                onChange={(e) => { const n=[...(entry.links||[])]; n[i]={...n[i],url:e.target.value}; setField("links",n); }} />
              <button type="button" onClick={() => setField("links",(entry.links||[]).filter((_,j)=>j!==i))} className="text-slate-400 hover:text-rose-500 p-1"><Icon name="x" className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setField("links",[...(entry.links||[]),{label:"",url:""}])} className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 w-fit px-1 py-0.5 rounded">
            <Icon name="plus" className="w-3.5 h-3.5" />Aggiungi link
          </button>
        </div>
      </div>
    </div>
  );
}
