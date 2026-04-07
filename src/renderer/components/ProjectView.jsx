import { useState, useMemo, useCallback } from "react";
import { useSettings } from "../contexts/SettingsContext";
import {
  loadProjects,
  saveProjects,
  listStoredInternalSubtypes,
  aggregateProjectEntries,
} from "../services/storage";
import { getClientColor, getInternalColor, getSubtypeLabel } from "../domain/tasks";
import { Icon } from "./ui";

// ─── helpers ────────────────────────────────────────────────────────────────

function projectIdForClient(clientName) {
  return "client::" + (clientName || "").trim().toLocaleLowerCase("it-IT");
}

function projectIdForInternal(subtypeId) {
  return "internal::" + (subtypeId || "");
}

/** "YYYY-MM-DD" → "15 gen 2024" */
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

/** "HH:MM" slot key → display string (e.g. "09:00") */
function formatSlotKey(slot) {
  if (slot === "AM" || slot === "PM") return slot;
  return slot; // already "HH:MM"
}

/** Formatta un intervallo slot */
function slotToMinutes(slot) {
  if (slot === "AM") return -2;
  if (slot === "PM") return 9999;
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Raggruppa task consecutivi con la stessa entry in blocchi per la visualizzazione */
function groupConsecutiveSlots(tasks) {
  // Per ogni giorno, tentiamo di raggruppare slot 30-min consecutivi identici
  const result = [];
  let i = 0;
  while (i < tasks.length) {
    const t = tasks[i];
    if (t.slot === "AM" || t.slot === "PM") {
      result.push({ ...t, slotDisplay: t.slot === "AM" ? "Mattina" : "Pomeriggio" });
      i++;
      continue;
    }
    // Prova a raggruppare slot contigui con stessa entry (stessa dateKey)
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

function ProjectItem({ label, color, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors " +
        (isSelected
          ? "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
          : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300")
      }
    >
      {color ? (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/15"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600 border border-black/10 dark:border-white/15" />
      )}
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );
}

// ─── StatusBadge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: "Attivo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  completed: { label: "Completato", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  paused: { label: "In pausa", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
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

function ProjectDetail({ projectId, projectName, isClient, meta, stats, allPeople, onSave, taskSubtypes }) {
  const { settings } = useSettings();
  const workHours = settings?.workHours;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);

  function startEdit() {
    setForm({
      description: meta?.description || "",
      objectives: meta?.objectives || "",
      startDate: meta?.startDate || "",
      endDate: meta?.endDate || "",
      status: meta?.status || "active",
      team: (meta?.team || []).join("\n"),
      clientContacts: (meta?.clientContacts || []).join("\n"),
    });
    setIsEditing(true);
  }

  function handleSave() {
    onSave(projectId, {
      description: form.description,
      objectives: form.objectives,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      team: form.team.split("\n").map((s) => s.trim()).filter(Boolean),
      clientContacts: form.clientContacts.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setForm(null);
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Raggruppa task per data
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
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">{projectName}</h2>
            {!isEditing && <StatusBadge status={currentStatus} />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-colors"
                >
                  Salva
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Icon name="pencil" className="w-3.5 h-3.5" />
                Modifica
              </button>
            )}
          </div>
        </div>

        {/* Status dropdown in edit mode */}
        {isEditing && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
              Stato
            </label>
            <select
              value={form.status}
              onChange={set("status")}
              className="text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="active">Attivo</option>
              <option value="completed">Completato</option>
              <option value="paused">In pausa</option>
            </select>
          </div>
        )}

      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

        {/* KPIs Section */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ore Totali */}
            <div className="flex flex-col p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-800/50 border border-sky-100/60 dark:border-sky-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  Ore Totali
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-auto">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ({(stats.totalHours / 8).toFixed(1)} gg)
                </span>
              </div>
            </div>

            {/* Prima Attività */}
            <div className="flex flex-col p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800/50 border border-indigo-100/60 dark:border-indigo-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Icon name="calendar" className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  Prima Attività
                </span>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-auto">
                {stats.firstDate ? formatDate(stats.firstDate) : "—"}
              </span>
            </div>

            {/* Ultima Attività */}
            <div className="flex flex-col p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800/50 border border-emerald-100/60 dark:border-emerald-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Icon name="calendar" className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Ultima Attività
                </span>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-auto">
                {stats.lastDate ? formatDate(stats.lastDate) : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Descrizione */}
        <section>
          <SectionTitle icon="clipboard" label="Descrizione" />
          {isEditing ? (
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Aggiungi una descrizione del progetto…"
              className={textareaClass}
            />
          ) : (
            <p className={emptyOrText(meta?.description)}>
              {meta?.description || "Nessuna descrizione"}
            </p>
          )}
        </section>

        {/* Obiettivi */}
        <section>
          <SectionTitle icon="target" label="Obiettivi" />
          {isEditing ? (
            <textarea
              value={form.objectives}
              onChange={set("objectives")}
              rows={3}
              placeholder="Descrivi gli obiettivi del progetto…"
              className={textareaClass}
            />
          ) : (
            <p className={emptyOrText(meta?.objectives)}>
              {meta?.objectives || "Nessun obiettivo definito"}
            </p>
          )}
        </section>

        {/* Tempistiche */}
        <section>
          <SectionTitle icon="calendar" label="Tempistiche" />
          {isEditing ? (
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inizio</span>
                <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fine prevista</span>
                <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
              </label>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 mt-1">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Inizio</div>
                <div className={dateText(meta?.startDate)}>{formatDate(meta?.startDate) || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fine prevista</div>
                <div className={dateText(meta?.endDate)}>{formatDate(meta?.endDate) || "—"}</div>
              </div>
            </div>
          )}
        </section>

        {/* Team interno */}
        <section>
          <SectionTitle icon="users" label="Team" />
          {isEditing ? (
            <div>
              <textarea
                value={form.team}
                onChange={set("team")}
                rows={3}
                placeholder={"Un nome per riga…\n" + (allPeople?.length ? allPeople.slice(0, 3).map(p => typeof p === 'object' ? p.name : p).join("\n") : "")}
                className={textareaClass}
              />
              {allPeople?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {allPeople.map((p, idx) => {
                    const personName = typeof p === 'object' ? p.name : p;
                    if (!personName) return null;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const current = form.team.split("\n").map((s) => s.trim()).filter(Boolean);
                          if (current.includes(personName)) return;
                          setForm((f) => ({ ...f, team: [...current, personName].join("\n") }));
                        }}
                        className="px-2 py-0.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                      >
                        + {personName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <ChipList items={meta?.team} emptyText="Nessun membro del team" />
          )}
        </section>

        {/* Contatti cliente (solo per progetti cliente) */}
        {isClient && (
          <section>
            <SectionTitle icon="users" label="Referenti cliente" />
            {isEditing ? (
              <textarea
                value={form.clientContacts}
                onChange={set("clientContacts")}
                rows={2}
                placeholder="Un nome per riga…"
                className={textareaClass}
              />
            ) : (
              <ChipList items={meta?.clientContacts} emptyText="Nessun referente cliente" />
            )}
          </section>
        )}

        {/* Task log */}
        <section>
          <div className="flex items-center justify-between mb-1 -mt-1">
            <SectionTitle icon="history" label={`Attività registrate (${stats?.tasks?.length ?? 0})`} />
            {stats?.tasks?.length > 1 && (
              <button
                type="button"
                onClick={() => setSortDesc(d => !d)}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-2"
              >
                <Icon name={sortDesc ? "arrow-down" : "arrow-up"} className="w-3.5 h-3.5" />
                {sortDesc ? "Recenti prima" : "Meno recenti prima"}
              </button>
            )}
          </div>
          {!stats?.tasks?.length ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic mt-1">
              Nessun task registrato per questo progetto.
            </p>
          ) : (
            <div className="mt-2 space-y-4">
              {tasksByDate.map(({ dateKey, items }) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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
      </div>
    </div>
  );
}

function TaskRowItem({ t, workHours, formatTimeSlot, taskSubtypes }) {
  const [expanded, setExpanded] = useState(false);
  const entry = t.entry || {};
  
  const hasDetails = !!(entry.notes || entry.wentWrong || entry.nextSteps);
  const subtypeLabel = entry.subtypeId ? getSubtypeLabel(entry.type, entry.subtypeId, taskSubtypes) : null;

  return (
    <div className="flex flex-col px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 w-28 truncate">
          {formatTimeSlot(t.slotDisplay, workHours)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-full">
              {entry.title || <span className="italic text-slate-400">Senza titolo</span>}
            </span>
            {subtypeLabel && subtypeLabel !== "Generico" && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                {subtypeLabel}
              </span>
            )}
          </div>
          {!expanded && entry.notes && (
             <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
               {entry.notes}
             </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.hours % 1 === 0 ? t.hours : t.hours.toFixed(1)}h
          </span>
          {hasDetails && (
            <button 
              type="button" 
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Mostra dettagli (note, next steps...)"
            >
              <Icon name={expanded ? "chev-up" : "chev-down"} className="w-4 h-4" />
            </button>
          )}
          {!hasDetails && <div className="w-5.5" />} {/* Placeholder for alignment */}
        </div>
      </div>
      
      {expanded && hasDetails && (
        <div className="mt-3 pl-[124px] pr-8 pb-1 space-y-3">
          {entry.notes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Descrizione / Note</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{entry.notes}</div>
            </div>
          )}
          {entry.wentWrong && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">Criticità / Cosa è andato storto</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{entry.wentWrong}</div>
            </div>
          )}
          {entry.nextSteps && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-0.5">Next Steps</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{entry.nextSteps}</div>
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
      <Icon name={icon} className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

function ChipList({ items, emptyText }) {
  if (!items?.length) return <p className="text-sm text-slate-400 dark:text-slate-500 italic">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-2.5 py-1 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

const textareaClass =
  "mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y";

const inputClass =
  "rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400";

const emptyOrText = (val) =>
  val
    ? "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap"
    : "text-sm text-slate-400 dark:text-slate-500 italic";

const dateText = (val) =>
  val
    ? "text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5"
    : "text-sm text-slate-400 dark:text-slate-500 italic mt-0.5";

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectView({ clientNames = [], allPeople = [] }) {
  const { settings } = useSettings();
  const clientColors = settings?.clientColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};
  const workHours = settings?.workHours;

  const [projects, setProjects] = useState(() => loadProjects());
  const [selectedId, setSelectedId] = useState(null);

  // Internal subtypes found in actual entries
  const internalSubtypeIds = useMemo(() => listStoredInternalSubtypes(), []);

  // Merge: subtypes from settings + subtypes used in entries
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

  // Aggregated stats for selected project
  const stats = useMemo(() => {
    if (!selectedId || !workHours) return null;
    return aggregateProjectEntries(selectedId, workHours);
  }, [selectedId, workHours]);

  const selectedMeta = selectedId ? (projects[selectedId] || {}) : null;

  // Determine label + isClient for selected project
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
  }, [projects]);

  return (
    <div className="flex h-full min-h-0 rounded-3xl border border-slate-200/90 dark:border-slate-700/50 bg-white/85 dark:bg-slate-800/80 backdrop-blur shadow-soft dark:shadow-soft-dark overflow-hidden">

      {/* ── Left sidebar ── */}
      <div className="w-56 lg:w-64 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Progetti
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">

          {/* Clienti */}
          {clientNames.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Clienti
              </div>
              <div className="space-y-0.5">
                {clientNames.map((name) => {
                  const pid = projectIdForClient(name);
                  return (
                    <ProjectItem
                      key={pid}
                      label={name}
                      color={getClientColor(name, clientColors)}
                      isSelected={selectedId === pid}
                      onClick={() => setSelectedId(pid)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Interni */}
          {internalProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Interni
              </div>
              <div className="space-y-0.5">
                {internalProjects.map(({ projectId, label, id }) => (
                  <ProjectItem
                    key={projectId}
                    label={label}
                    color={getInternalColor(id, settings?.internalColors)}
                    isSelected={selectedId === projectId}
                    onClick={() => setSelectedId(projectId)}
                  />
                ))}
              </div>
            </div>
          )}

          {clientNames.length === 0 && internalProjects.length === 0 && (
            <p className="px-3 text-sm text-slate-400 dark:text-slate-500 italic">
              Nessun progetto trovato.
            </p>
          )}
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
            onSave={handleSave}
            taskSubtypes={taskSubtypes}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-4">
              <Icon name="briefcase" className="w-8 h-8 text-sky-400 dark:text-sky-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Seleziona un progetto
            </h3>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-xs">
              Scegli un progetto dalla lista per vedere il riepilogo e gestire le informazioni.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
