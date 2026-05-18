import { useState, useMemo, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSettings } from "../contexts/SettingsContext";
import {
  loadProjects,
  saveProjects,
  listStoredInternalSubtypes,
  aggregateProjectEntries,
  renameClientInStorage,
} from "../services/storage";
import { getClientColor, getInternalColor, getSubtypeLabel, normalizeClientKey } from "../domain/tasks";
import { Icon, Button } from "./ui";
import { MarkdownEditor, mdComponents } from "./MarkdownEditor";

function MdView({ text, emptyText }) {
  if (!text?.trim()) return <p className="text-sm text-si-grayLight italic">{emptyText}</p>;
  return (
    <div className="text-sm text-si-inkSoft">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{text}</ReactMarkdown>
    </div>
  );
}

function projectIdForClient(clientName) {
  return "client::" + normalizeClientKey(clientName);
}

function projectIdForInternal(subtypeId) {
  return "internal::" + (subtypeId || "");
}

function formatDate(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function slotToMinutes(slot) {
  if (slot === "AM") return -2;
  if (slot === "PM") return 9999;
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + (m || 0);
}

function groupConsecutiveSlots(tasks) {
  const result = [];
  let i = 0;
  while (i < tasks.length) {
    const t = tasks[i];
    if (t.slot === "AM" || t.slot === "PM") {
      result.push({ ...t, slotDisplay: t.slot === "AM" ? "Mattina" : "Pomeriggio" });
      i++;
      continue;
    }
    const startMins = slotToMinutes(t.slot);
    let endMins = startMins + 30;
    let j = i + 1;
    while (
      j < tasks.length &&
      tasks[j].dateKey === t.dateKey &&
      tasks[j].slot !== "AM" &&
      tasks[j].slot !== "PM" &&
      slotToMinutes(tasks[j].slot) === endMins &&
      tasks[j].entry?.title === t.entry?.title &&
      tasks[j].entry?.type === t.entry?.type &&
      tasks[j].entry?.client === t.entry?.client &&
      tasks[j].entry?.subtypeId === t.entry?.subtypeId
    ) {
      endMins += 30;
      j++;
    }
    const startH = Math.floor(startMins / 60);
    const startM = startMins % 60;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    const pad = (n) => String(n).padStart(2, "0");
    const slotDisplay =
      j > i + 1
        ? `${pad(startH)}:${pad(startM)} – ${pad(endH)}:${pad(endM)}`
        : `${pad(startH)}:${pad(startM)}`;
    const totalHours = (endMins - startMins) / 60;
    result.push({ ...t, slotDisplay, hours: totalHours });
    i = j;
  }
  return result;
}

// ─── Sidebar item ───────────────────────────────────────────────────────────

function ProjectItem({ label, color, isSelected, onClick, subTabs }) {
  return (
    <div className="flex flex-col mb-0.5">
      <button
        type="button"
        onClick={onClick}
        className={
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors border-0 cursor-pointer " +
          (isSelected
            ? "bg-si-accentBg text-si-accent"
            : "hover:bg-si-muted text-si-inkSoft bg-transparent")
        }
      >
        {color ? (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 border border-si-border"
            style={{ backgroundColor: color }}
          />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-si-grayLight border border-si-border" />
        )}
        <span className="text-sm font-medium truncate">{label}</span>
      </button>
      {isSelected && subTabs && (
        <div className="pl-7 pr-2 py-1 space-y-0.5 mt-0.5">
          {subTabs}
        </div>
      )}
    </div>
  );
}

function SubTabItem({ label, icon, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border-0 cursor-pointer ${isSelected
          ? "text-si-accent bg-si-accentSoft"
          : "text-si-gray hover:text-si-inkSoft hover:bg-si-muted bg-transparent"
        }`}
    >
      <Icon name={icon} className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── StatusBadge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: "Attivo", className: "bg-si-success/10 text-si-success" },
  completed: { label: "Completato", className: "bg-si-accentSoft text-si-accent" },
  paused: { label: "In pausa", className: "bg-si-amberSoft text-si-amber" },
  archived: { label: "Archiviato", className: "bg-si-muted text-si-gray border border-si-border" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold " + cfg.className}>
      {cfg.label}
    </span>
  );
}

// ─── ProjectDetail ───────────────────────────────────────────────────────────

function ProjectDetail({ projectId, projectName, isClient, meta, stats, allPeople, topPeople = [], onSave, onRename, onDelete, onArchive, taskSubtypes, currentTab, startInEditMode }) {
  const { settings } = useSettings();
  const workHours = settings?.workHours;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [newSubtask, setNewSubtask] = useState("");
  const [editingSubtask, setEditingSubtask] = useState(null);

  const mergedSubtasks = useMemo(() => {
    const map = new Map();
    (meta?.subtasks || []).forEach(st => {
      map.set(st.id, { ...st, isCustom: true });
    });
    if (stats?.tasks) {
      stats.tasks.forEach(t => {
        const type = t.entry.type || (isClient ? "client" : "internal");
        const id = type === "internal" ? (t.entry.internalSubtask || "") : (t.entry.subtypeId || "");
        if (!map.has(id)) {
          map.set(id, {
            id,
            label: id === "" ? "Generico" : (getSubtypeLabel(type, id, taskSubtypes, isClient ? projectName : t.entry.subtypeId) || id),
            isCustom: false
          });
        }
      });
    }
    return Array.from(map.values());
  }, [meta?.subtasks, stats?.tasks, taskSubtypes, isClient, projectName]);

  const handleAddSubtask = () => {
    const val = newSubtask.trim();
    if (!val) return;
    const newId = val.toLowerCase().replace(/[\s\W]+/g, "-").replace(/^-+|-+$/g, "");
    if (!newId) return;
    const existingMeta = meta?.subtasks || [];
    if (existingMeta.some(s => s.id === newId) || mergedSubtasks.some(s => s.label.toLowerCase() === val.toLowerCase())) return;
    onSave?.(projectId, { ...meta, subtasks: [...existingMeta, { id: newId, label: val }] });
    setNewSubtask("");
  };

  const handleRemoveSubtask = (id) => {
    const existingMeta = meta?.subtasks || [];
    onSave?.(projectId, { ...meta, subtasks: existingMeta.filter(s => s.id !== id) });
  };

  const handleRenameSubtask = () => {
    if (!editingSubtask) return;
    const val = editingSubtask.label.trim();
    if (val) {
      const existingMeta = meta?.subtasks || [];
      const idx = existingMeta.findIndex(s => s.id === editingSubtask.id);
      let newSubtasks = [...existingMeta];
      if (idx >= 0) {
        newSubtasks[idx] = { ...newSubtasks[idx], label: val };
      } else {
        newSubtasks.push({ id: editingSubtask.id, label: val });
      }
      onSave?.(projectId, { ...meta, subtasks: newSubtasks });
    }
    setEditingSubtask(null);
  };

  function startEdit() {
    setForm({
      projectDisplayName: projectName,
      cliente: meta?.cliente || "",
      description: meta?.description || "",
      objectives: meta?.objectives || "",
      startDate: meta?.startDate || "",
      endDate: meta?.endDate || "",
      estimatedHours: meta?.estimatedHours || "",
      status: meta?.status || "active",
      team: meta?.team || [],
      clientContacts: meta?.clientContacts || [],
    });
    setIsEditing(true);
  }

  useEffect(() => {
    if (startInEditMode) {
      startEdit();
    }
  }, []);

  function handleSave() {
    const updatedMeta = {
      ...meta,
      cliente: form.cliente.trim(),
      description: form.description.trim(),
      objectives: form.objectives.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : "",
      status: form.status,
      team: form.team,
      clientContacts: form.clientContacts,
    };
    const newName = form.projectDisplayName?.trim();
    if (isClient && newName && newName !== projectName) {
      onRename?.(projectId, newName, updatedMeta);
    } else {
      onSave(projectId, updatedMeta);
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setForm(null);
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const tasksByDate = useMemo(() => {
    if (!stats?.tasks?.length) return [];
    const grouped = groupConsecutiveSlots(stats.tasks);
    const map = new Map();
    for (const t of grouped) {
      if (!map.has(t.dateKey)) map.set(t.dateKey, []);
      map.get(t.dateKey).push(t);
    }
    const arr = Array.from(map.entries()).map(([dateKey, items]) => ({ dateKey, items }));
    arr.sort((a, b) => {
      return sortDesc ? b.dateKey.localeCompare(a.dateKey) : a.dateKey.localeCompare(b.dateKey);
    });
    return arr;
  }, [stats?.tasks, sortDesc]);

  const displayMeta = isEditing ? form : meta;
  const currentStatus = displayMeta?.status || "active";

  const isOverdue = useMemo(() => {
    if (currentStatus !== "active" || !displayMeta?.endDate) return false;
    const end = new Date(displayMeta.endDate);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  }, [currentStatus, displayMeta?.endDate]);

  const slotLabel = (slot, wh) => {
    if (slot === "Mattina" && wh) {
      const sh = Math.floor(wh.morningStart / 60);
      const sm = wh.morningStart % 60;
      const eh = Math.floor(wh.morningEnd / 60);
      const em = wh.morningEnd % 60;
      const p = (n) => String(n).padStart(2, "0");
      return `Mattina (${p(sh)}:${p(sm)} – ${p(eh)}:${p(em)})`;
    }
    if (slot === "Pomeriggio" && wh) {
      const sh = Math.floor(wh.afternoonStart / 60);
      const sm = wh.afternoonStart % 60;
      const eh = Math.floor(wh.afternoonEnd / 60);
      const em = wh.afternoonEnd % 60;
      const p = (n) => String(n).padStart(2, "0");
      return `Pomeriggio (${p(sh)}:${p(sm)} – ${p(eh)}:${p(em)})`;
    }
    return slot;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-si-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            {isEditing && isClient ? (
              <input
                type="text"
                value={form.projectDisplayName}
                onChange={(e) => setForm(f => ({ ...f, projectDisplayName: e.target.value }))}
                placeholder="Nome progetto…"
                className="text-2xl font-extrabold bg-transparent border-b-2 border-si-accent outline-none text-si-ink pb-0.5 mb-1"
              />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-si-ink truncate">{projectName}</h2>
                {!isEditing && <StatusBadge status={currentStatus} />}
                {!isEditing && isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-si-rose/10 text-si-rose">
                    In Ritardo
                  </span>
                )}
              </div>
            )}
            {!isEditing && meta?.cliente && (
              <span className="text-sm font-medium text-si-gray mt-0.5 truncate">
                {meta.cliente}
              </span>
            )}
            {isEditing && (
              <input
                type="text"
                value={form.cliente}
                onChange={set("cliente")}
                placeholder="Azienda cliente (opzionale)…"
                className="mt-1.5 rounded-xl border border-si-border bg-si-surface px-3 py-1.5 text-sm text-si-inkSoft placeholder:text-si-grayLight focus:outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent"
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl border border-si-border text-si-gray hover:bg-si-muted transition-colors bg-transparent cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm font-semibold rounded-xl text-white transition-colors border-0 cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                >
                  Salva
                </button>
              </>
            ) : deleteConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-si-rose">Eliminare il progetto?</span>
                <button
                  type="button"
                  onClick={() => onDelete?.(projectId)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-xl bg-si-rose hover:bg-si-rose/90 text-white transition-colors border-0 cursor-pointer"
                >
                  Elimina
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl border border-si-border text-si-gray hover:bg-si-muted transition-colors bg-transparent cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onArchive(projectId, meta)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border transition-colors cursor-pointer bg-transparent ${currentStatus === "archived"
                      ? "border-si-success/30 text-si-success hover:bg-si-success/5"
                      : "border-si-border text-si-gray hover:bg-si-muted"
                    }`}
                  title={currentStatus === "archived" ? "Ripristina progetto" : "Archivia progetto"}
                >
                  <Icon name={currentStatus === "archived" ? "inbox" : "archive"} className="w-3.5 h-3.5" />
                  {currentStatus === "archived" ? "Ripristina" : "Archivia"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border border-si-border text-si-rose hover:bg-si-rose/5 hover:border-si-rose/30 transition-colors bg-transparent cursor-pointer"
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                  Elimina
                </button>
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border border-si-border text-si-gray hover:bg-si-muted transition-colors bg-transparent cursor-pointer"
                >
                  <Icon name="pencil" className="w-3.5 h-3.5" />
                  Modifica
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status dropdown in edit mode */}
        {isEditing && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-si-gray shrink-0">
              Stato
            </label>
            <select
              value={form.status}
              onChange={set("status")}
              className="text-sm font-semibold rounded-lg border border-si-border bg-si-surface text-si-ink px-2 py-1 focus:outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent"
            >
              <option value="active">Attivo</option>
              <option value="completed">Completato</option>
              <option value="paused">In pausa</option>
              <option value="archived">Archiviato</option>
            </select>
          </div>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

        {/* OVERVIEW TAB */}
        {(currentTab === "overview" || isEditing) && (
          <div className="space-y-8">
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ore Totali */}
                <div className="flex flex-col p-3.5 rounded-2xl bg-si-accentBg border border-si-accentSoft shadow-si">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-xl bg-si-accentSoft text-si-accent">
                      <Icon name="clock" className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-si-accent">
                      Ore Totali
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="text-2xl font-black text-si-ink">
                      {stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-si-gray">
                      ({(stats.totalHours / 8).toFixed(1)} gg)
                    </span>
                  </div>
                </div>

                {/* Prima Attività */}
                <div className="flex flex-col p-3.5 rounded-2xl bg-si-violetSoft border border-si-violet/20 shadow-si">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-xl bg-si-violet/20 text-si-violet">
                      <Icon name="calendar" className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-si-violet">
                      Prima Attività
                    </span>
                  </div>
                  <span className="text-base font-bold text-si-ink mt-auto">
                    {stats.firstDate ? formatDate(stats.firstDate) : "—"}
                  </span>
                </div>

                {/* Ultima Attività */}
                <div className="flex flex-col p-3.5 rounded-2xl bg-si-success/8 border border-si-success/20 shadow-si">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-xl bg-si-success/20 text-si-success">
                      <Icon name="calendar" className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-si-success">
                      Ultima Attività
                    </span>
                  </div>
                  <span className="text-base font-bold text-si-ink mt-auto">
                    {stats.lastDate ? formatDate(stats.lastDate) : "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Budget Ore */}
            {(meta?.estimatedHours > 0 || isEditing) && (
              <section className="bg-si-muted p-4 rounded-2xl border border-si-border">
                <SectionTitle icon="pie-chart" label="Avanzamento e Budget" />
                {!isEditing && stats ? (
                  <div className="mt-3">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-semibold text-si-inkSoft">
                        {stats.totalHours.toFixed(1)} <span className="text-si-gray font-normal">/ {meta.estimatedHours} ore</span>
                      </span>
                      <span className="text-xs font-bold text-si-gray">
                        {Math.min(100, Math.round((stats.totalHours / meta.estimatedHours) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-si-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stats.totalHours > meta.estimatedHours ? "bg-si-rose" : "bg-si-success"}`}
                        style={{ width: `${Math.min(100, (stats.totalHours / meta.estimatedHours) * 100)}%` }}
                      />
                    </div>
                    {stats.totalHours > meta.estimatedHours && (
                      <p className="mt-2 text-xs text-si-rose font-medium">Hai superato il budget stimato di {(stats.totalHours - meta.estimatedHours).toFixed(1)} ore.</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="text-xs font-semibold text-si-gray">Ore stimate (Budget)</label>
                    <input type="number" min="0" step="0.5" value={form?.estimatedHours} onChange={set("estimatedHours")} className={inputClass + " w-32 ml-3"} placeholder="Es. 40" />
                  </div>
                )}
              </section>
            )}

            {/* Dettagli Progetto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-si-border">
              <div className="space-y-6">
                {/* Descrizione */}
                <section>
                  <SectionTitle icon="clipboard" label="Descrizione" />
                  {isEditing ? (
                    <div className="mt-1">
                      <MarkdownEditor
                        value={form.description}
                        onChange={(v) => setForm(f => ({ ...f, description: v }))}
                        placeholder="Aggiungi una descrizione del progetto…"
                      />
                    </div>
                  ) : (
                    <MdView text={meta?.description} emptyText="Nessuna descrizione" />
                  )}
                </section>

                {/* Obiettivi */}
                <section>
                  <SectionTitle icon="target" label="Obiettivi" />
                  {isEditing ? (
                    <div className="mt-1">
                      <MarkdownEditor
                        value={form.objectives}
                        onChange={(v) => setForm(f => ({ ...f, objectives: v }))}
                        placeholder="Descrivi gli obiettivi del progetto…"
                      />
                    </div>
                  ) : (
                    <MdView text={meta?.objectives} emptyText="Nessun obiettivo definito" />
                  )}
                </section>
              </div>

              <div className="space-y-6">
                {/* Tempistiche e Budget */}
                <section>
                  <SectionTitle icon="calendar" label="Tempistiche e Budget" />
                  {isEditing ? (
                    <div className="flex flex-wrap gap-4 mt-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-si-gray">Inizio</span>
                        <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-si-gray">Fine prevista</span>
                        <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-6 mt-1">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-si-grayLight">Inizio</div>
                        <div className={dateText(meta?.startDate)}>{formatDate(meta?.startDate) || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-si-grayLight">Fine prevista</div>
                        <div className={dateText(meta?.endDate)}>{formatDate(meta?.endDate) || "—"}</div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Team interno */}
                <section>
                  <SectionTitle icon="users" label="Team" />
                  {isEditing ? (
                    <PeopleInput
                      value={form.team}
                      onChange={(v) => setForm(f => ({ ...f, team: v }))}
                      suggestions={topPeople.length ? topPeople : (allPeople || []).map(p => typeof p === "object" ? p.name : p).filter(Boolean)}
                      placeholder="Cerca o aggiungi membro…"
                    />
                  ) : (
                    <ChipList items={meta?.team} emptyText="Nessun membro del team" />
                  )}
                </section>

                {/* Contatti cliente */}
                {isClient && (
                  <section>
                    <SectionTitle icon="users" label="Referenti cliente" />
                    {isEditing ? (
                      <PeopleInput
                        value={form.clientContacts}
                        onChange={(v) => setForm(f => ({ ...f, clientContacts: v }))}
                        suggestions={topPeople.length ? topPeople : (allPeople || []).map(p => typeof p === "object" ? p.name : p).filter(Boolean)}
                        placeholder="Cerca o aggiungi referente…"
                      />
                    ) : (
                      <ChipList items={meta?.clientContacts} emptyText="Nessun referente cliente" />
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gestione Sub-Task */}
        {currentTab === "subtasks" && (
          <section className="space-y-6">
            <div className="space-y-1">
              <SectionTitle icon="list-check" label="Sotto-Task Specifici del Progetto" />
              <p className="text-sm text-si-gray">
                Aggiungi attività ricorrenti specifiche per questo progetto, compariranno nei suggerimenti quando registri un task per questa entità.
              </p>
            </div>

            <div className="flex gap-2 w-full max-w-lg">
              <input
                className="flex-1 rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm text-si-ink outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition"
                placeholder="Es. Sviluppo Frontend, Creazione UI..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              />
              <Button
                className="text-white rounded-xl px-4 py-2 shrink-0"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                onClick={handleAddSubtask}
              >
                Aggiungi
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-w-lg">
              {mergedSubtasks.length === 0 ? (
                <p className="text-sm text-si-grayLight italic">Nessun sotto-task configurato o utilizzato per questo progetto.</p>
              ) : (
                mergedSubtasks.map((st) => {
                  const isBeingEdited = editingSubtask?.id === st.id;
                  return (
                    <div key={st.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-si-muted border border-si-border transition-colors">
                      {isBeingEdited ? (
                        <input
                          autoFocus
                          className="flex-1 min-w-0 bg-transparent border-b border-si-border outline-none text-sm font-semibold text-si-accent mr-4 pb-0.5"
                          value={editingSubtask.label}
                          onChange={(e) => setEditingSubtask({ ...editingSubtask, label: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSubtask();
                            if (e.key === "Escape") setEditingSubtask(null);
                          }}
                          onBlur={handleRenameSubtask}
                        />
                      ) : (
                        <span
                          className="flex-1 min-w-0 text-sm font-semibold text-si-inkSoft cursor-pointer hover:text-si-accent transition-colors truncate"
                          title="Clicca per rinominare"
                          onClick={() => setEditingSubtask({ id: st.id, label: st.label })}
                        >
                          {st.label}
                        </span>
                      )}
                      <button onClick={() => st.isCustom && handleRemoveSubtask(st.id)} className={`p-1.5 rounded-full transition-colors shrink-0 border-0 ${st.isCustom ? "text-si-grayLight hover:text-si-rose hover:bg-si-muted cursor-pointer bg-transparent" : "text-si-grayLight/40 opacity-50 cursor-not-allowed bg-transparent"}`} title={st.isCustom ? "Elimina override" : "Non puoi eliminare un subtask presente nello storico."} disabled={!st.isCustom}>
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Task log */}
        {currentTab === "activities" && (
          <section>
            <div className="flex items-center justify-between mb-1 -mt-1">
              <SectionTitle icon="history" label={`Attività registrate (${stats?.tasks?.length ?? 0})`} />
              {stats?.tasks?.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSortDesc(d => !d)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg text-si-gray hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer mb-2"
                >
                  <Icon name={sortDesc ? "arrow-down" : "arrow-up"} className="w-3.5 h-3.5" />
                  {sortDesc ? "Recenti prima" : "Meno recenti prima"}
                </button>
              )}
            </div>
            {!stats?.tasks?.length ? (
              <p className="text-sm text-si-grayLight italic mt-1">
                Nessun task registrato per questo progetto.
              </p>
            ) : (
              <div className="mt-2 space-y-4">
                {tasksByDate.map(({ dateKey, items }) => (
                  <div key={dateKey}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-si-gray mb-1.5">
                      {formatDate(dateKey)}
                    </div>
                    <div className="space-y-1">
                      {items.map((t, idx) => (
                        <TaskRowItem
                          key={idx}
                          t={t}
                          workHours={workHours}
                          formatTimeSlot={slotLabel}
                          taskSubtypes={taskSubtypes}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function TaskRowItem({ t, workHours, formatTimeSlot, taskSubtypes }) {
  const [expanded, setExpanded] = useState(false);
  const entry = t.entry || {};

  const hasDetails = !!(entry.notes || entry.wentWrong || entry.nextSteps || entry.collaborators?.length || entry.clientContacts?.length);
  const subtypeLabel = entry.subtypeId ? getSubtypeLabel(entry.type, entry.subtypeId, taskSubtypes) : null;

  return (
    <div className="flex flex-col px-3 py-2 rounded-xl bg-si-muted border border-si-border transition-colors hover:bg-si-border/50">
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-semibold text-si-grayLight shrink-0 mt-0.5 w-28 truncate">
          {formatTimeSlot(t.slotDisplay, workHours)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-si-inkSoft truncate max-w-full">
              {entry.title || <span className="italic text-si-grayLight">Senza titolo</span>}
            </span>
            {subtypeLabel && subtypeLabel !== "Generico" && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-si-border text-si-gray shrink-0">
                {subtypeLabel}
              </span>
            )}
          </div>
          {!expanded && entry.notes && (
            <div className="text-xs text-si-gray mt-1 line-clamp-1">
              {entry.notes}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-si-gray">
            {t.hours % 1 === 0 ? t.hours : t.hours.toFixed(1)}h
          </span>
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-lg text-si-grayLight hover:bg-si-border transition-colors border-0 bg-transparent cursor-pointer"
              title="Mostra dettagli"
            >
              <Icon name={expanded ? "chev-up" : "chev-down"} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="mt-3 pl-[124px] pr-8 pb-1 space-y-3">
          {entry.collaborators?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-si-gray mb-1">Collaboratori</div>
              <div className="flex flex-wrap gap-1.5">
                {entry.collaborators.map(c => (
                  <span key={c} className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-si-border text-si-inkSoft">{c}</span>
                ))}
              </div>
            </div>
          )}
          {entry.clientContacts?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-si-accent mb-1">Persone Cliente</div>
              <div className="flex flex-wrap gap-1.5">
                {entry.clientContacts.map(c => (
                  <span key={c} className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-si-accentSoft text-si-accent">{c}</span>
                ))}
              </div>
            </div>
          )}
          {entry.notes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-si-gray mb-0.5">Descrizione / Note</div>
              <div className="text-xs text-si-inkSoft whitespace-pre-wrap">{entry.notes}</div>
            </div>
          )}
          {entry.wentWrong && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-si-rose mb-0.5">Criticità / Cosa è andato storto</div>
              <div className="text-xs text-si-inkSoft whitespace-pre-wrap">{entry.wentWrong}</div>
            </div>
          )}
          {entry.nextSteps && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-si-success mb-0.5">Next Steps</div>
              <div className="text-xs text-si-inkSoft whitespace-pre-wrap">{entry.nextSteps}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionTitle({ icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon name={icon} className="w-4 h-4 text-si-grayLight" />
      <span className="text-xs font-semibold uppercase tracking-wider text-si-gray">{label}</span>
    </div>
  );
}

function PeopleInput({ value, onChange, suggestions, placeholder }) {
  const [inputVal, setInputVal] = useState("");
  const [showDrop, setShowDrop] = useState(false);

  const filtered = useMemo(() => {
    if (!inputVal.trim()) return [];
    const q = inputVal.trim().toLowerCase();
    return suggestions.filter(n => !value.includes(n) && n.toLowerCase().includes(q)).slice(0, 6);
  }, [inputVal, suggestions, value]);

  const quickSuggestions = suggestions.filter(n => !value.includes(n)).slice(0, 5);

  function add(name) {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputVal("");
    setShowDrop(false);
  }

  function remove(name) {
    onChange(value.filter(n => n !== name));
  }

  return (
    <div className="space-y-2 mt-1">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(name => (
            <span key={name} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-si-accentSoft border border-si-accentSoft text-sm font-medium text-si-accent">
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-si-grayLight hover:text-si-rose hover:bg-si-rose/10 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5">
                  <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowDrop(true); }}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); add(inputVal); }
            if (e.key === "Escape") { setInputVal(""); setShowDrop(false); }
          }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder={placeholder || "Aggiungi persona…"}
          className="w-full rounded-xl border border-si-border bg-si-surface px-3 py-2 text-sm text-si-ink placeholder:text-si-grayLight focus:outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent"
        />
        {showDrop && filtered.length > 0 && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-si-border bg-si-surface shadow-si-lg overflow-hidden">
            {filtered.map(name => (
              <button key={name} type="button" onMouseDown={() => add(name)}
                className="w-full text-left px-3 py-2 text-sm text-si-inkSoft hover:bg-si-accentBg transition-colors border-0 bg-transparent cursor-pointer">
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {quickSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickSuggestions.map(name => (
            <button key={name} type="button" onClick={() => add(name)}
              className="px-2 py-0.5 text-xs font-medium rounded-lg bg-si-muted text-si-inkSoft hover:bg-si-accentSoft hover:text-si-accent transition-colors border-0 cursor-pointer">
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipList({ items, emptyText }) {
  if (!items?.length) return <p className="text-sm text-si-grayLight italic">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-2.5 py-1 text-sm font-medium rounded-xl bg-si-muted text-si-inkSoft border border-si-border"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

const inputClass =
  "rounded-xl border border-si-border bg-si-surface px-3 py-1.5 text-sm text-si-ink focus:outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent";

const dateText = (val) =>
  val
    ? "text-sm font-semibold text-si-inkSoft mt-0.5"
    : "text-sm text-si-grayLight italic mt-0.5";

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectView({ clientNames = [], allPeople = [], onProjectsChange }) {
  const { settings } = useSettings();
  const clientColors = settings?.clientColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};
  const workHours = settings?.workHours;

  const [projects, setProjects] = useState(() => loadProjects());
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showArchived, setShowArchived] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);

  const handleSelectProject = (pid) => {
    if (selectedId !== pid) {
      setSelectedId(pid);
      setSelectedTab("overview");
    }
  };

  const confirmCreateProject = () => {
    const name = newProjectName;
    if (!name || !name.trim()) {
      setIsCreatingProject(false);
      setNewProjectName("");
      return;
    }
    const trimName = name.trim();
    const pid = projectIdForClient(trimName);

    if (!projects[pid]) {
      const updated = { ...projects, [pid]: { status: "active", cliente: "", description: "", isManuallyCreated: true } };
      saveProjects(updated);
      setProjects(updated);
      onProjectsChange?.();
      setEditingProjectId(pid);
    }
    handleSelectProject(pid);
    setIsCreatingProject(false);
    setNewProjectName("");
  };

  const renderSubTabs = () => (
    <>
      <SubTabItem label="Overview" icon="briefcase" isSelected={selectedTab === "overview"} onClick={() => setSelectedTab("overview")} />
      <SubTabItem label="Sub-Task" icon="list-check" isSelected={selectedTab === "subtasks"} onClick={() => setSelectedTab("subtasks")} />
      <SubTabItem label="Attività registrate" icon="history" isSelected={selectedTab === "activities"} onClick={() => setSelectedTab("activities")} />
    </>
  );

  const internalSubtypeIds = useMemo(() => listStoredInternalSubtypes(), []);

  const allClientNames = useMemo(() => {
    const set = new Set(clientNames.map(c => c.toLowerCase()));
    const result = [...clientNames];
    for (const pid of Object.keys(projects)) {
      if (pid.startsWith("client::") && projects[pid]?.isManuallyCreated) {
        const name = pid.slice(8);
        if (!set.has(name.toLowerCase())) {
          result.push(name);
          set.add(name.toLowerCase());
        }
      }
    }
    return result.sort((a, b) => a.localeCompare(b, "it"));
  }, [clientNames, projects]);

  const filteredClientNames = useMemo(() =>
    allClientNames.filter(name => {
      const pid = projectIdForClient(name);
      const isArchived = (projects[pid]?.status || "active") === "archived";
      return showArchived ? isArchived : !isArchived;
    }), [allClientNames, projects, showArchived]);

  const clientProjectGroups = useMemo(() => {
    const groups = new Map();
    filteredClientNames.forEach(name => {
      const pid = projectIdForClient(name);
      const gruppo = projects[pid]?.cliente || "";
      if (!groups.has(gruppo)) groups.set(gruppo, []);
      groups.get(gruppo).push(name);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (!a && b) return 1;
      if (a && !b) return -1;
      return a.localeCompare(b, "it");
    });
  }, [filteredClientNames, projects]);

  const internalProjects = useMemo(() => {
    const defined = (taskSubtypes?.internal || []).map((st) => st.id);
    const allIds = Array.from(new Set([...internalSubtypeIds, ...defined]));
    return allIds
      .map((id) => ({
        id,
        label: id === "" ? "Generico" : (getSubtypeLabel("internal", id, taskSubtypes) || id),
        projectId: projectIdForInternal(id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "it"));
  }, [internalSubtypeIds, taskSubtypes]);

  const filteredInternalProjects = useMemo(() =>
    internalProjects.filter(({ projectId }) => {
      const isArchived = (projects[projectId]?.status || "active") === "archived";
      return showArchived ? isArchived : !isArchived;
    }), [internalProjects, projects, showArchived]);

  const topPeople = useMemo(() => {
    const counts = new Map();
    Object.values(projects).forEach(meta => {
      [...(meta?.team || []), ...(meta?.clientContacts || [])].forEach(name => {
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 10);
  }, [projects]);

  const stats = useMemo(() => {
    if (!selectedId || !workHours) return null;
    return aggregateProjectEntries(selectedId, workHours);
  }, [selectedId, workHours]);

  const selectedMeta = selectedId ? (projects[selectedId] || {}) : null;

  const selectedInfo = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId.startsWith("client::")) {
      const normalized = selectedId.slice(8);
      const name = clientNames.find(
        (c) => c.trim().toLocaleLowerCase("it-IT") === normalized
      ) || normalized;
      return { label: name, isClient: true };
    }
    if (selectedId.startsWith("internal::")) {
      const id = selectedId.slice(10);
      const label = id === "" ? "Generico" : (getSubtypeLabel("internal", id, taskSubtypes) || id);
      return { label, isClient: false };
    }
    return null;
  }, [selectedId, clientNames, taskSubtypes]);

  const handleSave = useCallback((projectId, meta) => {
    const updated = { ...projects, [projectId]: meta };
    saveProjects(updated);
    setProjects(updated);
    onProjectsChange?.();
  }, [projects, onProjectsChange]);

  const handleDelete = useCallback((projectId) => {
    const updated = { ...projects };
    delete updated[projectId];
    saveProjects(updated);
    setProjects(updated);
    setSelectedId(null);
    onProjectsChange?.();
  }, [projects, onProjectsChange]);

  const handleRename = useCallback((projectId, newName, updatedMeta) => {
    if (!projectId.startsWith("client::") || !newName.trim()) return;
    const oldName = projectId.slice(8);
    const newId = projectIdForClient(newName);
    renameClientInStorage(oldName, newName.trim());
    const updated = { ...projects };
    delete updated[projectId];
    updated[newId] = { ...updatedMeta };
    saveProjects(updated);
    setProjects(updated);
    setSelectedId(newId);
    onProjectsChange?.();
  }, [projects, onProjectsChange]);

  const handleArchive = useCallback((projectId, meta) => {
    const isCurrentlyArchived = (meta?.status || "active") === "archived";
    const newStatus = isCurrentlyArchived ? "active" : "archived";
    const updated = { ...projects, [projectId]: { ...meta, status: newStatus } };
    saveProjects(updated);
    setProjects(updated);
    onProjectsChange?.();
    if (!isCurrentlyArchived && !showArchived) {
      setSelectedId(null);
    }
  }, [projects, showArchived, onProjectsChange]);

  return (
    <div className="flex h-full min-h-0 rounded-[20px] border border-si-border bg-si-surface shadow-si overflow-hidden">

      {/* ── Left sidebar ── */}
      <div className="w-56 lg:w-64 shrink-0 flex flex-col border-r border-si-border bg-si-muted">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-si-border flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-si-gray">
            {showArchived ? "Archiviati" : "Progetti"}
          </h2>
          <button
            type="button"
            onClick={() => { setIsCreatingProject(true); setNewProjectName(""); }}
            className="p-1.5 rounded-lg bg-si-accentSoft text-si-accent hover:bg-si-accent/20 transition-colors border-0 cursor-pointer"
            title="Nuovo Progetto"
          >
            <Icon name="plus" className="w-4 h-4" />
          </button>
        </div>

        {isCreatingProject && (
          <div className="px-4 py-3 border-b border-si-border bg-si-accentBg">
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreateProject();
                if (e.key === "Escape") {
                  setIsCreatingProject(false);
                  setNewProjectName("");
                }
              }}
              onBlur={confirmCreateProject}
              placeholder="Nome progetto..."
              className="w-full rounded-xl border border-si-accent/30 bg-si-surface px-3 py-1.5 text-sm font-medium text-si-ink focus:outline-none focus:ring-2 focus:ring-si-accent/20"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-4">

          {/* Progetti cliente raggruppati */}
          {filteredClientNames.length > 0 && (
            <div className="space-y-3">
              {clientProjectGroups.map(([gruppo, names]) => (
                <div key={gruppo || "__ungrouped"}>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-si-grayLight">
                    {gruppo || "Progetti"}
                  </div>
                  <div className="space-y-0.5">
                    {names.map((name) => {
                      const pid = projectIdForClient(name);
                      return (
                        <ProjectItem
                          key={pid}
                          label={name}
                          color={getClientColor(name, clientColors)}
                          isSelected={selectedId === pid}
                          onClick={() => handleSelectProject(pid)}
                          subTabs={renderSubTabs()}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interni */}
          {filteredInternalProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-si-grayLight">
                Interni
              </div>
              <div className="space-y-0.5">
                {filteredInternalProjects.map(({ projectId, label, id }) => (
                  <ProjectItem
                    key={projectId}
                    label={label}
                    color={getInternalColor(id, settings?.internalColors)}
                    isSelected={selectedId === projectId}
                    onClick={() => handleSelectProject(projectId)}
                    subTabs={renderSubTabs()}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredClientNames.length === 0 && filteredInternalProjects.length === 0 && (
            <p className="px-3 text-sm text-si-grayLight italic">
              {showArchived ? "Nessun progetto archiviato." : "Nessun progetto trovato."}
            </p>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-si-border p-2">
          <button
            type="button"
            onClick={() => { setProjects(loadProjects()); setShowArchived(v => !v); setSelectedId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-colors border-0 cursor-pointer ${showArchived
                ? "bg-si-border text-si-inkSoft"
                : "text-si-gray hover:bg-si-border bg-transparent"
              }`}
          >
            <Icon name={showArchived ? "inbox" : "archive"} className="w-3.5 h-3.5" />
            {showArchived ? "Mostra attivi" : "Archiviati"}
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {selectedId && selectedInfo ? (
          <ProjectDetail
            key={selectedId}
            projectId={selectedId}
            projectName={selectedInfo.label}
            isClient={selectedInfo.isClient}
            meta={selectedMeta}
            stats={stats}
            allPeople={allPeople}
            topPeople={topPeople}
            onSave={handleSave}
            onRename={handleRename}
            onDelete={handleDelete}
            onArchive={handleArchive}
            taskSubtypes={taskSubtypes}
            currentTab={selectedTab}
            startInEditMode={editingProjectId === selectedId}
          />
        ) : (
          <ProjectDashboard
            projects={projects}
            clientNames={clientNames}
            internalProjects={internalProjects}
            onSelectProject={handleSelectProject}
          />
        )}
      </div>
    </div>
  );
}

// ─── Project Dashboard ──────────────────────────────────────

function ProjectDashboard({ projects, clientNames, internalProjects, onSelectProject }) {
  const activeProjects = useMemo(() => {
    const list = [];

    clientNames.forEach(name => {
      const pid = projectIdForClient(name);
      const meta = projects[pid] || {};
      if (meta.status !== "archived") {
        list.push({ pid, name, type: "client", meta });
      }
    });

    internalProjects.forEach(({ projectId, label }) => {
      const meta = projects[projectId] || {};
      if (meta.status !== "archived") {
        list.push({ pid: projectId, name: label, type: "internal", meta });
      }
    });

    return list.sort((a, b) => {
      const aEnd = a.meta.endDate ? new Date(a.meta.endDate).getTime() : Infinity;
      const bEnd = b.meta.endDate ? new Date(b.meta.endDate).getTime() : Infinity;
      if (aEnd !== bEnd) return aEnd - bEnd;
      return a.name.localeCompare(b.name, "it");
    });
  }, [projects, clientNames, internalProjects]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-si-bg">
      <div className="max-w-5xl mx-auto">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent mb-1">Gestione</div>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-si-ink mb-2">Dashboard Progetti</h1>
        <p className="text-si-gray mb-8">
          Panoramica dei progetti attualmente attivi. Seleziona un progetto per vederne i dettagli.
        </p>

        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-si-border rounded-[20px]">
            <Icon name="briefcase" className="w-12 h-12 text-si-grayLight mb-4" />
            <p className="text-lg font-semibold text-si-gray">Nessun progetto attivo</p>
            <p className="text-sm text-si-grayLight mt-1">I progetti registrati compariranno qui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map(({ pid, name, type, meta }) => {
              const isOverdue = meta.status === "active" && meta.endDate && new Date(meta.endDate) < new Date();

              return (
                <button
                  key={pid}
                  onClick={() => onSelectProject(pid)}
                  className="flex flex-col text-left p-5 bg-si-surface border border-si-border rounded-[20px] hover:border-si-accent/40 hover:shadow-si transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-start w-full mb-3">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-si-grayLight mb-1">
                        {type === "client" ? (meta.cliente || "Cliente") : "Interno"}
                      </span>
                      <h3 className="text-lg font-bold text-si-ink truncate w-full group-hover:text-si-accent transition-colors">
                        {name}
                      </h3>
                    </div>
                    {meta.status !== "active" ? (
                      <StatusBadge status={meta.status} />
                    ) : isOverdue ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-si-rose/10 text-si-rose">
                        <Icon name="alert-triangle" className="w-3 h-3" />
                        Scaduto
                      </span>
                    ) : (
                      <StatusBadge status="active" />
                    )}
                  </div>

                  {meta.description && (
                    <p className="text-xs text-si-gray line-clamp-2 mb-4">
                      {meta.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-si-border flex flex-wrap gap-x-4 gap-y-2 w-full">
                    {meta.endDate && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-si-inkSoft">
                        <Icon name="calendar" className="w-3.5 h-3.5 text-si-grayLight" />
                        {formatDate(meta.endDate)}
                      </div>
                    )}
                    {meta.estimatedHours && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-si-inkSoft">
                        <Icon name="clock" className="w-3.5 h-3.5 text-si-grayLight" />
                        {meta.estimatedHours}h stimate
                      </div>
                    )}
                    {!meta.endDate && !meta.estimatedHours && (
                      <div className="text-xs text-si-grayLight italic">Nessuna data di fine / budget</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
