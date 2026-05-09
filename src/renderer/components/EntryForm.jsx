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
        className={"p-1 rounded-lg transition-colors " + (active ? "text-red-500 animate-pulse" : "text-si-gray hover:text-si-accent")}
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

  // ── Left column ────────────────────────────────────────────────────────────
  const tipoSection = (
    <div className="flex flex-col gap-3">
      {/* Tipo */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Tipo</label>
        <select
          className="w-full rounded-xl border border-si-border bg-si-surface px-3 py-2.5 text-sm text-si-ink focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent outline-none transition"
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

      {/* Subtask */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-si-gray">
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
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">
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
    <div className="rounded-2xl border border-si-border bg-si-muted p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm font-bold text-si-inkSoft">Giornata intera</div>
        <button
          type="button"
          onClick={() => setFullDay((prev) => !prev)}
          className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none " + (fullDay ? "bg-si-accent" : "bg-si-border")}
        >
          <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " + (fullDay ? "translate-x-6" : "translate-x-1")} />
        </button>
      </div>

      {!fullDay && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[120px] flex-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-si-gray">
                <Icon name="clock" className="w-3 h-3" />
                Ora di inizio
              </div>
              <select
                className="mt-2 w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm font-semibold text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                value={rangeStartMin}
                onChange={(e) => setRangeStartMin(Number(e.target.value))}
              >
                {(startSection === "AM" ? MORNING_SLOTS : AFTERNOON_SLOTS).map((slot) => (
                  <option key={slot} value={slot}>{hourLabel(slot)}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px] flex-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-si-gray">
                <Icon name="clock" className="w-3 h-3" />
                Ora di fine
              </div>
              <select
                className="mt-2 w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm font-semibold text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                value={rangeEndMin}
                onChange={(e) => setRangeEndMin(Number(e.target.value))}
              >
                {endOptions.map((end) => (
                  <option key={end} value={end}>{hourLabel(end)}</option>
                ))}
              </select>
            </div>
            <div className="text-[11px] font-semibold text-si-gray pt-5">
              {hourLabel(rangeStartMin)} - {hourLabel(rangeEndMin)} ({rangeDuration}h)
            </div>
          </div>
          {autoAdjusted && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-si-success">
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
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-si-gray">
        <Icon name="users" className="w-3.5 h-3.5" />
        Collaboratori
      </label>
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-si-border bg-si-muted">
        {(entry.collaborators || []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-si-surface border border-si-border text-xs font-semibold text-si-inkSoft shadow-sm">
            {c}
            <button onClick={() => removeCollaborator(c)} className="text-si-grayLight hover:text-si-rose transition-colors">
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
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-si-gray">
        <Icon name="building" className="w-3.5 h-3.5" />
        Persone Cliente
      </label>
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-si-border bg-si-muted">
        {(entry.clientContacts || []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-si-surface border border-si-border text-xs font-semibold text-si-inkSoft shadow-sm">
            {c}
            <button onClick={() => removeClientContact(c)} className="text-si-grayLight hover:text-si-rose transition-colors">
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
    <div className="rounded-xl border border-si-border overflow-hidden">
      <div className="bg-si-muted px-4 py-2.5 border-b border-si-border flex items-center gap-2">
        <Icon name={icon} className="w-3.5 h-3.5 text-si-gray shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-si-gray flex-1">{label}</span>
        {micField && isSpeechSupported && micBtn(micField)}
      </div>
      <div className="bg-si-surface">{content}</div>
    </div>
  );

  const propRow = (label, content, opts = {}) => (
    <div className="flex items-center gap-3 min-h-[32px]">
      <span className={`shrink-0 text-xs text-si-gray ${opts.labelWidth || "w-24"}`}>{label}</span>
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );

  const sidebarSelect = (value, onChange, children) => (
    <div className="relative">
      <select
        className="w-full rounded-xl border border-si-border bg-si-surface pl-3 pr-10 py-2.5 text-sm font-medium text-si-ink appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
      <Icon name="chev-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-si-gray" />
    </div>
  );

  if (column === "left") {
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
        <div className={`rounded-xl border-l-[3px] overflow-hidden transition-colors ${hasWentWrong ? "border-si-rose bg-si-rose/5" : "border-si-border bg-si-muted"}`}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Icon name="alert-triangle" className={`w-3.5 h-3.5 shrink-0 ${hasWentWrong ? "text-si-rose" : "text-si-gray"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${hasWentWrong ? "text-si-rose" : "text-si-gray"}`}>Cosa è andato storto</span>
            </div>
            {isSpeechSupported && micBtn("wentWrong")}
          </div>
          <textarea
            className={`w-full px-4 py-3 text-sm resize-none outline-none bg-transparent ${hasWentWrong ? "text-si-rose italic placeholder:text-si-rose/40" : "text-si-inkSoft placeholder:text-si-grayLight"}`}
            rows={3}
            value={entry.wentWrong || ""}
            onChange={(e) => setField("wentWrong", e.target.value)}
            placeholder={listeningField === "wentWrong" ? "Sto ascoltando..." : "Blockers, problemi, rallentamenti..."}
          />
        </div>

        {/* PROSSIMI PASSI */}
        <div className={`rounded-xl border-l-[3px] overflow-hidden transition-colors ${hasNextSteps ? "border-si-success bg-si-success/5" : "border-si-border bg-si-muted"}`}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Icon name="zap" className={`w-3.5 h-3.5 shrink-0 ${hasNextSteps ? "text-si-success" : "text-si-gray"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${hasNextSteps ? "text-si-success" : "text-si-gray"}`}>Prossimi passi</span>
            </div>
            {isSpeechSupported && micBtn("nextSteps")}
          </div>
          <textarea
            className={`w-full px-4 py-3 text-sm resize-none outline-none bg-transparent ${hasNextSteps ? "text-si-success italic placeholder:text-si-success/40" : "text-si-inkSoft placeholder:text-si-grayLight"}`}
            rows={3}
            value={entry.nextSteps || ""}
            onChange={(e) => setField("nextSteps", e.target.value)}
            placeholder={listeningField === "nextSteps" ? "Sto ascoltando..." : "Azioni da intraprendere..."}
          />
        </div>

        {/* TRASCRIZIONE VOCALE */}
        {isSpeechSupported && (
          <button
            type="button"
            onClick={() => toggleSpeech("notes", (text) => appendText("notes", text))}
            className={`w-full rounded-xl py-5 flex flex-col items-center gap-2 border transition-colors ${listeningField === "notes" ? "bg-si-rose/10 border-si-rose text-si-rose" : "bg-si-accentBg border-si-accentSoft text-si-accent hover:bg-si-accent/10"}`}
          >
            <Icon name="mic" className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {listeningField === "notes" ? "Ferma dettatura" : "Trascrizione vocale"}
            </span>
          </button>
        )}

        {/* LINK E RISORSE */}
        <div className="rounded-xl border border-dashed border-si-border overflow-hidden">
          <div className="bg-si-muted/50 px-4 py-2.5 border-b border-dashed border-si-border flex items-center gap-2">
            <Icon name="link" className="w-3.5 h-3.5 text-si-gray shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-si-gray flex-1">Link e Risorse</span>
          </div>
          <div className="bg-si-surface p-3 flex flex-col gap-2">
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
              className="flex items-center gap-1 text-xs font-semibold text-si-accent hover:text-si-accentDark w-fit px-1 py-0.5 rounded transition-colors"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Aggiungi link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (column === "right") {
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
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Tipo di voce</label>
          <div className="grid grid-cols-2 gap-1.5">
            {TASK_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setField("type", t.id)}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors ${
                  entry.type === t.id
                    ? "bg-si-accentBg border-si-accentSoft text-si-accent"
                    : "bg-si-muted border-si-border text-si-gray hover:bg-si-border hover:text-si-inkSoft"
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
        {entry.type === "client" && (
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
        {subtypesForType.length > 1 && (
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
        {entry.type === "internal" && projectSpecificSubtasks.length > 0 && (
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
        {setLocation && (
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

        {/* MILESTONE */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-si-gray">
            <Icon name="flag" className="w-3.5 h-3.5" />
            Milestone <span className="font-normal normal-case tracking-normal text-si-grayLight">(opz.)</span>
          </label>
          <input
            className="w-full rounded-xl border border-si-border bg-si-surface px-3 py-2.5 text-sm font-medium text-si-ink placeholder:text-si-grayLight outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
            placeholder="es. Sprint 42"
            value={entry.milestone || ""}
            onChange={(e) => setField("milestone", e.target.value || null)}
          />
        </div>

        {/* REGISTRAZIONE TEMPO */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Registrazione tempo</label>
          <div className="rounded-xl border border-si-border p-4 bg-si-surface flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-si-inkSoft">Giornata intera</span>
              <button
                type="button"
                onClick={() => setFullDay(prev => !prev)}
                className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none " + (fullDay ? "bg-si-accent" : "bg-si-border")}
              >
                <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform " + (fullDay ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
            {!fullDay && (
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
                <span className="text-si-gray font-bold">→</span>
                <select
                  className="flex-1 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-sm font-semibold text-center text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-si-success">
                <Icon name="check" className="w-3 h-3" />
                Fine aggiornata
              </div>
            )}
            <div className="rounded-lg bg-si-accentSoft border border-si-accentSoft py-2.5 text-center text-sm font-bold text-si-accent">
              {fullDay ? "8h registrate" : `${rangeDuration}h registrate`}
            </div>
          </div>
        </div>
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
        <label className="text-xs font-bold uppercase tracking-wider text-si-gray flex items-center gap-1.5">
          <Icon name="flag" className="w-3.5 h-3.5" />
          Milestone <span className="text-si-grayLight font-normal normal-case tracking-normal">(opz.)</span>
        </label>
        <input
          className="w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition placeholder:text-si-grayLight"
          placeholder="es. Sprint 42"
          value={entry.milestone || ""}
          onChange={(e) => setField("milestone", e.target.value || null)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-si-gray">Attività svolte</label>
        <MarkdownEditor
          value={entry.notes}
          onChange={(val) => setField("notes", val)}
          placeholder="Descrivi le attività concluse..."
          isListening={listeningField === "notes"}
          micButton={isSpeechSupported ? micBtn("notes") : null}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-si-gray flex items-center gap-1.5">
          <Icon name="link" className="w-3.5 h-3.5" />
          Link e Risorse
        </label>
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-si-border p-3">
          {(entry.links || []).map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="w-28 shrink-0 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-xs text-si-inkSoft outline-none focus:border-si-accent transition" placeholder="Etichetta" value={link.label}
                onChange={(e) => { const n=[...(entry.links||[])]; n[i]={...n[i],label:e.target.value}; setField("links",n); }} />
              <input className="flex-1 rounded-lg border border-si-border bg-si-surface px-2 py-1.5 text-xs text-si-inkSoft outline-none focus:border-si-accent transition" placeholder="https://..." type="url" value={link.url}
                onChange={(e) => { const n=[...(entry.links||[])]; n[i]={...n[i],url:e.target.value}; setField("links",n); }} />
              <button type="button" onClick={() => setField("links",(entry.links||[]).filter((_,j)=>j!==i))} className="text-si-gray hover:text-si-rose p-1 transition-colors"><Icon name="x" className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setField("links",[...(entry.links||[]),{label:"",url:""}])} className="flex items-center gap-1 text-xs font-semibold text-si-accent hover:text-si-accentDark w-fit px-1 py-0.5 rounded transition-colors">
            <Icon name="plus" className="w-3.5 h-3.5" />Aggiungi link
          </button>
        </div>
      </div>
    </div>
  );
}
