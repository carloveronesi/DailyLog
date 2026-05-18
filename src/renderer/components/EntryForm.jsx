import { useState, useMemo } from "react";
import { TASK_TYPES, LOCATION_TYPES, normalizeClientKey } from "../domain/tasks";
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
  section = "all", // "meta" | "notes" | "all"  (meta = tipo/cliente/range; notes = note/feedback)
  compact = false,
}) {
  const { settings, setSettings } = useSettings();
  const { MORNING_SLOTS, AFTERNOON_SLOTS } = useWorkSlots();
  const taskSubtypes = settings?.taskSubtypes || {};
  const setField = (k, v) => onChange({ ...entry, [k]: v });
  const [personInput, setPersonInput] = useState("");
  const [clientContactInput, setClientContactInput] = useState("");

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
        className={"p-1 rounded-lg transition-colors " + (active ? "text-si-rose animate-pulse" : "text-si-gray hover:text-si-accent")}
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

  const projects = loadProjects();

  const getAvatarColor = (name) => {
    const palette = ["bg-si-accent", "bg-si-violet", "bg-[#10B981]", "bg-si-amber", "bg-si-rose"];
    return palette[name.charCodeAt(0) % palette.length];
  };
  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const allClientContacts = useMemo(() => {
    if (entry.type !== "client" || !entry.client) return [];
    const pid = "client::" + normalizeClientKey(entry.client);
    const projectContacts = projects[pid]?.clientContacts || [];
    if (projectContacts.length > 0) return projectContacts;
    const set = new Set();
    Object.values(projects).forEach(p => (p.clientContacts || []).forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [projects, entry.type, entry.client]);

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

  if (section === "notes") {
    const hasWentWrong = !!(entry.wentWrong || "").trim();
    const hasNextSteps = !!(entry.nextSteps || "").trim();

    return (
      <div className="flex flex-col gap-5">
        {/* NOTE */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Note</label>
            {isSpeechSupported && micBtn("notes")}
          </div>
          <MarkdownEditor
            value={entry.notes}
            onChange={(val) => setField("notes", val)}
            placeholder={listeningField === "notes" ? "Sto ascoltando..." : "Descrivi le attività concluse..."}
            isListening={listeningField === "notes"}
          />
        </div>

        {/* COSA È ANDATO STORTO */}
        {!compact && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider ${hasWentWrong ? "text-si-rose" : "text-si-gray"}`}>
                Cosa è andato storto
              </label>
              {isSpeechSupported && micBtn("wentWrong")}
            </div>
            <textarea
              className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none transition-colors ${hasWentWrong ? "border-si-rose/40 bg-si-rose/5 text-si-rose placeholder:text-si-rose/40" : "border-si-border bg-si-muted text-si-inkSoft placeholder:text-si-grayLight"}`}
              rows={3}
              value={entry.wentWrong || ""}
              onChange={(e) => setField("wentWrong", e.target.value)}
              placeholder={listeningField === "wentWrong" ? "Sto ascoltando..." : "Blockers, problemi, rallentamenti..."}
            />
          </div>
        )}

        {/* PROSSIMI PASSI */}
        {!compact && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase tracking-wider ${hasNextSteps ? "text-si-success" : "text-si-gray"}`}>
                Prossimi passi
              </label>
              {isSpeechSupported && micBtn("nextSteps")}
            </div>
            <textarea
              className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none transition-colors ${hasNextSteps ? "border-si-success/40 bg-si-success/5 text-si-success placeholder:text-si-success/40" : "border-si-border bg-si-muted text-si-inkSoft placeholder:text-si-grayLight"}`}
              rows={3}
              value={entry.nextSteps || ""}
              onChange={(e) => setField("nextSteps", e.target.value)}
              placeholder={listeningField === "nextSteps" ? "Sto ascoltando..." : "Azioni da intraprendere..."}
            />
          </div>
        )}

        {/* LINK E RISORSE */}
        {!compact && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Link e risorse</label>
            <div className="flex flex-col gap-1.5">
              {(entry.links || []).map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="w-28 shrink-0 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-xs text-si-inkSoft outline-none focus:border-si-accent transition"
                    placeholder="Etichetta"
                    value={link.label}
                    onChange={(e) => { const n = [...(entry.links||[])]; n[i]={...n[i],label:e.target.value}; setField("links",n); }}
                  />
                  <input
                    className="flex-1 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-xs text-si-inkSoft outline-none focus:border-si-accent transition"
                    placeholder="https://..."
                    type="url"
                    value={link.url}
                    onChange={(e) => { const n = [...(entry.links||[])]; n[i]={...n[i],url:e.target.value}; setField("links",n); }}
                  />
                  <button type="button" onClick={() => setField("links",(entry.links||[]).filter((_,j)=>j!==i))} className="text-si-gray hover:text-si-rose transition-colors p-1">
                    <Icon name="x" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setField("links",[...(entry.links||[]),{label:"",url:""}])}
                className="flex items-center gap-1 text-xs font-semibold text-si-accent hover:text-si-accentDark w-fit transition-colors"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                Aggiungi link
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === "meta") {
    const subtypesForType = [
      { id: "", label: "Generico" },
      ...currentSubtypes.map(st => typeof st === "string" ? { id: st, label: st } : st)
    ].filter(st => {
      if (entry.type !== "internal") return true;
      const pid = "internal::" + (st.id || "");
      return (projects[pid]?.status || "active") !== "archived";
    });

    return (
      <div className="flex flex-col gap-5">
        {/* TIPO */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Tipo</label>
          <div className="inline-flex rounded-full bg-si-muted border border-si-border p-0.5 w-fit">
            {TASK_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setField("type", t.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors border-0 cursor-pointer ${
                  entry.type === t.id
                    ? "bg-si-surface text-si-ink shadow-si"
                    : "bg-transparent text-si-gray hover:text-si-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CLIENTE */}
        {entry.type === "client" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Cliente</label>
            <Combobox
              value={entry.client || ""}
              onChange={(val) => setField("client", val)}
              options={allSuggestedClients}
              placeholder="Seleziona cliente"
              allowCustom={true}
            />
          </div>
        )}

        {/* REFERENTE CLIENTE */}
        {entry.type === "client" && !compact && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Referente cliente</label>
            <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-xl border border-si-border bg-si-muted min-h-[40px]">
              {(entry.clientContacts || []).map(c => (
                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-si-accent text-white text-xs font-semibold">
                  {c}
                  <button type="button" onClick={() => setField("clientContacts",(entry.clientContacts||[]).filter(x=>x!==c))} className="opacity-70 hover:opacity-100">
                    <Icon name="x" className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <Combobox
                className="flex-1 min-w-[120px]"
                value={clientContactInput}
                onChange={(val) => { if (val) addClientContact(val); setClientContactInput(""); }}
                options={allClientContacts.filter(c => !(entry.clientContacts||[]).includes(c))}
                placeholder="Aggiungi referente..."
                allowCustom={true}
              />
            </div>
          </div>
        )}

        {/* SOTTOTIPO */}
        {subtypesForType.length > 1 && !compact && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">
              {entry.type === "internal" ? "Attività interna" : "Sottotipo"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subtypesForType.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleSubtypeChange(st.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    (entry.subtypeId || "") === st.id
                      ? "bg-si-accent border-si-accent text-white"
                      : "bg-si-muted border-si-border text-si-gray hover:bg-si-border hover:text-si-inkSoft"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INTERNAL SUBTASK */}
        {entry.type === "internal" && projectSpecificSubtasks.length > 0 && !compact && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Subtask</label>
            <div className="flex flex-wrap gap-1.5">
              {[{ id: "", label: "Generico" }, ...projectSpecificSubtasks].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    if (!st.id) { setField("internalSubtask", null); return; }
                    setField("internalSubtask", st.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    (entry.internalSubtask || "") === st.id
                      ? "bg-si-accent border-si-accent text-white"
                      : "bg-si-muted border-si-border text-si-gray hover:bg-si-border hover:text-si-inkSoft"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEDE */}
        {setLocation && !compact && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Sede</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: LOCATION_TYPES.REMOTE, label: "Remoto", icon: "home" },
                { value: LOCATION_TYPES.OFFICE, label: "Ufficio", icon: "building" },
                { value: LOCATION_TYPES.CLIENT, label: "Cliente", icon: "briefcase" },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocation(value)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                    location === value
                      ? "bg-si-accentBg border-si-accentSoft text-si-accent"
                      : "bg-si-muted border-si-border text-si-gray hover:text-si-inkSoft hover:border-si-accent/30"
                  }`}
                >
                  <Icon name={icon} className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* COLLABORATORI */}
        {!compact && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Collaboratori</label>
          <div className="flex flex-wrap gap-2 items-center">
            {(entry.collaborators || []).map(c => (
              <div key={c} className="relative group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-default ${getAvatarColor(c)}`} title={c}>
                  {getInitials(c)}
                </div>
                <button
                  type="button"
                  onClick={() => removeCollaborator(c)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-si-rose text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="x" className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            <Combobox
              className="flex-1 min-w-[140px]"
              value={personInput}
              onChange={(val) => { if (val) addCollaborator(val); setPersonInput(""); }}
              options={suggestedCollaborators}
              placeholder="Aggiungi persona..."
              allowCustom={true}
            />
          </div>
        </div>
        )}

        {/* MILESTONE */}
        {!compact && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Milestone</label>
          <input
            className="w-full rounded-xl border border-si-border bg-si-surface px-3 py-2.5 text-sm font-medium text-si-ink placeholder:text-si-grayLight outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
            placeholder="es. Sprint 42"
            value={entry.milestone || ""}
            onChange={(e) => setField("milestone", e.target.value || null)}
          />
        </div>
        )}

        {/* REGISTRAZIONE TEMPO */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Orario</label>
            <button
              type="button"
              onClick={() => setFullDay(!fullDay)}
              className={`text-[11px] font-semibold uppercase tracking-wider border-0 bg-transparent cursor-pointer transition-colors ${fullDay ? "text-si-accent" : "text-si-gray hover:text-si-ink"}`}
            >
              {fullDay ? "✓ Giornata intera" : "Giornata intera"}
            </button>
          </div>
          {!fullDay ? (
            <div className="flex items-center gap-2">
              <select
                className="flex-1 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-sm font-semibold text-center text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                value={rangeStartMin}
                onChange={(e) => setRangeStartMin(Number(e.target.value))}
              >
                {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map(s => (
                  <option key={s} value={s}>{hourLabel(s)}</option>
                ))}
              </select>
              <span className="text-si-grayLight">→</span>
              <select
                className="flex-1 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-sm font-semibold text-center text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                value={rangeEndMin}
                onChange={(e) => setRangeEndMin(Number(e.target.value))}
              >
                {endOptions.map(end => (
                  <option key={end} value={end}>{hourLabel(end)}</option>
                ))}
              </select>
              <span className={`text-sm font-semibold shrink-0 ${autoAdjusted ? "text-si-success" : "text-si-gray"}`}>
                {rangeDuration}h
              </span>
            </div>
          ) : (
            <div className="text-sm font-semibold text-si-gray">8h</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
