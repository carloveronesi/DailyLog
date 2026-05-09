import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon, Button, Modal } from "./ui";

const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DAYS_IT = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

function DatePicker({ value, onChange, isOverdue = false }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value + "T00:00:00") : new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value + "T00:00:00") : new Date()).getMonth());
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const todayYmd = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openPicker() {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(o => !o);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day) {
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange({ target: { value: ymd } });
    setOpen(false);
  }

  const startDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const displayLabel = value
    ? new Date(value + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const popup = open && createPortal(
    <div
      ref={popupRef}
      style={{ position: "fixed", top: popupPos.top, left: popupPos.left, zIndex: 9999 }}
      className="bg-si-surface rounded-2xl shadow-si-lg border border-si-border p-3 w-[240px]"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-si-muted text-si-gray transition border-0 bg-transparent cursor-pointer">
          <Icon name="chev-left" className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-si-ink">{MONTHS_IT[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-si-muted text-si-gray transition border-0 bg-transparent cursor-pointer">
          <Icon name="chev-right" className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_IT.map(d => <div key={d} className="text-center text-[9px] font-bold uppercase text-si-gray py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = ymd === value;
          const isToday = ymd === todayYmd;
          return (
            <button
              key={i}
              onClick={() => selectDay(day)}
              className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition
                ${isSelected
                  ? "bg-si-accent text-white font-bold shadow-sm"
                  : isToday
                    ? "border border-si-accent text-si-accent hover:bg-si-accentBg"
                    : "text-si-ink hover:bg-si-muted"
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <button
          onClick={() => { onChange({ target: { value: "" } }); setOpen(false); }}
          className="mt-2 w-full text-xs text-si-gray hover:text-si-rose py-1.5 rounded-lg hover:bg-si-rose/5 transition font-medium border-0 bg-transparent cursor-pointer"
        >
          Rimuovi data
        </button>
      )}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={openPicker}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition min-w-[110px] border cursor-pointer
          ${!value
            ? "text-si-grayLight border-transparent hover:bg-si-muted hover:border-si-border"
            : isOverdue
              ? "bg-si-rose/10 text-si-rose border-si-rose/30 hover:bg-si-rose/20 font-semibold"
              : "bg-si-muted text-si-inkSoft border-si-border hover:bg-si-border"
          }`}
      >
        <Icon name="calendar" className="w-3.5 h-3.5 shrink-0 opacity-60" />
        <span>{displayLabel || "—"}</span>
      </button>
      {popup}
    </div>
  );
}

export function TodoView({
  isEmbedded = false,
  availableProjects = [],
  availableTags = [],
  onAddGlobalTodoTag,
  todos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleDone,
}) {
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const pending = useMemo(() => todos.filter(t => !t.isDone), [todos]);
  const done = useMemo(() => todos.filter(t => t.isDone), [todos]);

  const selectedTodo = todos.find(t => t.id === selectedTodoId) || null;

  function handleAddNew() {
    setIsAddingNew(true);
    setNewTodoTitle("");
  }

  function handleSaveNew() {
    if (!newTodoTitle.trim()) return;
    addTodo({ title: newTodoTitle.trim() });
    setIsAddingNew(false);
    setNewTodoTitle("");
  }

  function handleCancelNew() {
    setIsAddingNew(false);
    setNewTodoTitle("");
  }

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim() || !selectedTodo) return;
    const newSubtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      isDone: false
    };
    updateTodo(selectedTodo.id, {
      subtasks: [...(selectedTodo.subtasks || []), newSubtask]
    });
    setNewSubtaskTitle("");
  }

  function toggleSubtask(subtaskId) {
    if (!selectedTodo) return;
    const nextSubtasks = (selectedTodo.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, isDone: !st.isDone } : st
    );
    updateTodo(selectedTodo.id, { subtasks: nextSubtasks });
  }

  function deleteSubtask(subtaskId) {
    if (!selectedTodo) return;
    const nextSubtasks = (selectedTodo.subtasks || []).filter(st => st.id !== subtaskId);
    updateTodo(selectedTodo.id, { subtasks: nextSubtasks });
  }

  function toggleTag(tag) {
    if (!selectedTodo) return;
    const currentTags = selectedTodo.tags || [];
    const nextTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateTodo(selectedTodo.id, { tags: nextTags });
  }

  function handleAddTag() {
    const val = newTagInput.trim();
    if (!val || !selectedTodo) return;
    
    // Add to global list
    if (onAddGlobalTodoTag) onAddGlobalTodoTag(val);
    
    // Select for current todo
    const currentTags = selectedTodo.tags || [];
    if (!currentTags.includes(val)) {
      updateTodo(selectedTodo.id, { tags: [...currentTags, val] });
    }
    
    setNewTagInput("");
  }

  const containerClass = isEmbedded
    ? "flex h-full bg-si-surface rounded-[20px] overflow-hidden relative shadow-si"
    : "flex h-full bg-si-surface rounded-[20px] overflow-hidden relative shadow-si";

  return (
    <div className={containerClass}>
      
      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent mb-1">To-do</div>
            <h2 className="text-[28px] font-bold tracking-[-0.03em] text-si-ink">Attività</h2>
          </div>
          
          {[
            { groupName: "DA FARE", groupTodos: pending, showAdd: true },
            ...(done.length > 0 ? [{ groupName: "FATTI", groupTodos: done, showAdd: false }] : []),
          ].map(({ groupName, groupTodos, showAdd }) => (
            <div key={groupName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-semibold text-[11px] tracking-[0.06em] text-si-gray uppercase">{groupName}</h3>
                <span className="text-[11px] text-si-gray bg-si-muted px-2 py-0.5 rounded-full border border-si-border">{groupTodos.length}</span>
              </div>

              <div className="border border-si-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_64px] lg:grid-cols-[1fr_120px_120px_64px] gap-2 lg:gap-4 p-3 bg-si-muted border-b border-si-border text-[10px] font-semibold text-si-gray uppercase tracking-wider">
                  <div>Nome / Progetto</div>
                  <div className="hidden sm:block text-center">Inizio</div>
                  <div className="hidden sm:block text-center">Scadenza</div>
                  <div></div>
                </div>

                <div className="divide-y divide-si-border">
                  {groupTodos.map(todo => {
                    const doneSubtasks = (todo.subtasks || []).filter(s => s.isDone).length;
                    const totalSubtasks = (todo.subtasks || []).length;
                    const hasSubtasks = totalSubtasks > 0;
                    const isOverdue = !todo.isDone && !!todo.endDate && todo.endDate < today;

                    return (
                      <div key={todo.id} className={`grid grid-cols-[1fr_auto_auto_64px] lg:grid-cols-[1fr_120px_120px_64px] gap-2 lg:gap-4 p-2 items-center transition group/row ${isOverdue ? "bg-si-rose/5 hover:bg-si-rose/10" : "hover:bg-si-muted"}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => toggleDone(todo.id)}
                            className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${todo.isDone ? "bg-si-success border-si-success text-white" : "border-si-grayLight text-transparent hover:border-si-accent"}`}
                          >
                            <Icon name="check" className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <button 
                              onClick={() => setSelectedTodoId(todo.id)}
                              className={`truncate font-medium text-sm text-left outline-none bg-transparent border-0 cursor-pointer ${todo.isDone ? "text-si-grayLight line-through" : "text-si-ink hover:text-si-accent"}`}
                            >
                              {todo.title || <span className="opacity-40 italic font-normal">Senza titolo...</span>}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              {todo.project && (
                                <span className={
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight " +
                                  (todo.project.toLowerCase() === "interno"
                                    ? "bg-si-muted text-si-gray border border-si-border"
                                    : "bg-si-accentSoft text-si-accent")
                                }>
                                  {todo.project}
                                </span>
                              )}
                              {hasSubtasks && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-si-amberSoft text-si-amber flex items-center gap-1 ${todo.isDone ? "opacity-50" : ""}`}>
                                  <Icon name="list-check" className="w-3 h-3" />
                                  {doneSubtasks}/{totalSubtasks}
                                </span>
                              )}
                              {(todo.tags || []).map(tag => (
                                <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-si-border text-si-gray uppercase tracking-tighter">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden sm:block">
                          <DatePicker
                            value={todo.startDate}
                            onChange={(e) => updateTodo(todo.id, { startDate: e.target.value })}
                          />
                        </div>

                        <div className="hidden sm:block">
                          <DatePicker
                            value={todo.endDate}
                            onChange={(e) => updateTodo(todo.id, { endDate: e.target.value })}
                            isOverdue={isOverdue}
                          />
                        </div>
                        
                        <div className="flex justify-end items-center gap-0.5">
                          <button onClick={() => setSelectedTodoId(todo.id)} className="p-1 text-si-grayLight hover:text-si-accent rounded transition-colors cursor-pointer border-0 bg-transparent" title="Modifica">
                            <Icon name="pencil" className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteTodo(todo.id)} className="p-1 text-si-grayLight hover:text-si-rose rounded transition-colors opacity-0 group-hover/row:opacity-100 cursor-pointer border-0 bg-transparent" title="Elimina">
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {showAdd && (
                    <div className="p-3">
                      {isAddingNew ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newTodoTitle}
                            onChange={(e) => setNewTodoTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNew();
                              if (e.key === "Escape") handleCancelNew();
                            }}
                            placeholder="Titolo attività..."
                            className="flex-1 rounded-lg border border-si-border bg-si-muted px-3 py-1.5 text-sm text-si-ink placeholder-si-grayLight outline-none focus:ring-2 focus:ring-si-accent/40"
                          />
                          <button
                            onClick={handleSaveNew}
                            disabled={!newTodoTitle.trim()}
                            className="px-3 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition border-0 cursor-pointer"
                            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                          >
                            Salva
                          </button>
                          <button
                            onClick={handleCancelNew}
                            className="p-1.5 rounded-lg text-si-grayLight hover:text-si-ink transition border-0 bg-transparent cursor-pointer"
                          >
                            <Icon name="x" className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddNew}
                          className="flex items-center gap-2 text-sm font-semibold text-si-accent hover:text-si-accentDark transition border-0 bg-transparent cursor-pointer"
                        >
                          <span className="w-5 h-5 rounded-full bg-si-accentSoft flex items-center justify-center shrink-0">
                            <Icon name="plus" className="w-3.5 h-3.5" />
                          </span>
                          Aggiungi Attività
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Todo Detail Internal Overlay */}
      {selectedTodo && (
        <div className="absolute inset-0 z-30 flex flex-col bg-si-surface">
          {/* Header with Back Button */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-si-border">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTodoId(null)}
                className="flex items-center gap-1.5 text-si-gray hover:text-si-ink transition group border-0 bg-transparent cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-si-muted group-hover:bg-si-border transition">
                  <Icon name="chev-left" className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Torna alla lista</span>
              </button>
              <div className="h-4 w-px bg-si-border mx-1" />
              <div className="text-sm font-bold text-si-ink">Dettaglio Attività</div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-10">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleDone(selectedTodo.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedTodo.isDone ? "bg-si-success/10 text-si-success" : "bg-si-surface border border-si-border text-si-inkSoft hover:bg-si-muted"}`}
              >
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTodo.isDone ? "bg-si-success border-si-success text-white" : "border-si-border"}`}>
                  {selectedTodo.isDone && <Icon name="check" className="w-2.5 h-2.5" />}
                </span>
                {selectedTodo.isDone ? "Completato" : "Segna come completato"}
              </button>
              
              <button onClick={() => { deleteTodo(selectedTodo.id); setSelectedTodoId(null); }} className="text-sm flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium">
                <Icon name="trash" className="w-4 h-4" /> Elimina
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-si-grayLight">Titolo</label>
                <input
                  type="text"
                  value={selectedTodo.title}
                  onChange={(e) => updateTodo(selectedTodo.id, { title: e.target.value })}
                  placeholder="Titolo attività"
                  className="w-full text-xl font-bold bg-transparent border-none outline-none text-si-ink placeholder:text-si-grayLight focus:ring-0 px-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-si-grayLight">Progetto</label>
                  <select
                    value={selectedTodo.project || ""}
                    onChange={(e) => updateTodo(selectedTodo.id, { project: e.target.value })}
                    className="w-full rounded-xl border border-si-border bg-si-muted px-3 py-2.5 text-sm font-semibold text-si-inkSoft outline-none hover:bg-si-border transition"
                  >
                    <option value="">Nessuno</option>
                    <option value="Interno">Interno</option>
                    {availableProjects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-si-grayLight">Tag</label>
                  <div className="flex flex-wrap gap-1 min-h-[42px] p-2 rounded-xl border border-si-border bg-si-muted">
                    {availableTags.map(tag => {
                      const isSelected = (selectedTodo.tags || []).includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={
                            "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all " +
                            (isSelected
                              ? "bg-si-accent text-white shadow-sm"
                              : "bg-si-surface text-si-grayLight hover:text-si-inkSoft border border-si-border")
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                    <input
                      type="text"
                      placeholder="+ Tag..."
                      className="bg-transparent text-[10px] font-bold text-si-inkSoft outline-none px-2 py-0.5 w-16 focus:w-24 transition-all"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-si-muted border border-si-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Inizio</span>
                <DatePicker
                  value={selectedTodo.startDate}
                  onChange={(e) => updateTodo(selectedTodo.id, { startDate: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-si-muted border border-si-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Scadenza</span>
                <DatePicker
                  value={selectedTodo.endDate}
                  onChange={(e) => updateTodo(selectedTodo.id, { endDate: e.target.value })}
                  isOverdue={!selectedTodo.isDone && !!selectedTodo.endDate && selectedTodo.endDate < today}
                />
              </div>
            </div>
            
            <div className="space-y-6 pt-4 border-t border-si-border">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-si-grayLight">Descrizione</label>
                <textarea
                  value={selectedTodo.description}
                  onChange={(e) => updateTodo(selectedTodo.id, { description: e.target.value })}
                  placeholder="Aggiungi una descrizione dettagliata..."
                  className="w-full min-h-[120px] bg-si-surface border border-si-border rounded-2xl p-4 text-sm text-si-inkSoft placeholder:text-si-grayLight focus:ring-2 focus:ring-si-accent/10 focus:border-si-accent outline-none transition"
                />
              </div>

              <div className="space-y-4 pt-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-si-grayLight mb-2">Sotto-task</label>
                <div className="space-y-2 border border-si-border rounded-2xl p-4 bg-si-muted">
                  {(selectedTodo.subtasks || []).map(st => (
                    <div key={st.id} className="flex items-center gap-3 group/st pr-2">
                      <button
                        onClick={() => toggleSubtask(st.id)}
                        className={`shrink-0 w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${st.isDone ? "bg-si-accent border-si-accent text-white" : "bg-si-surface border-si-border text-transparent hover:border-si-accent"}`}
                      >
                        <Icon name="check" className="w-3 h-3" />
                      </button>
                      <span className={`text-sm flex-1 ${st.isDone ? "text-si-grayLight line-through" : "text-si-inkSoft"}`}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(st.id)}
                        className="opacity-0 group-hover/st:opacity-100 p-1 text-si-grayLight hover:text-si-rose transition-opacity"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-4.5 h-4.5 flex items-center justify-center text-si-grayLight">
                      <Icon name="plus" className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Aggiungi sotto-task..."
                      className="bg-transparent text-sm text-si-inkSoft outline-none flex-1 border-b border-transparent focus:border-si-border pb-0.5 transition-colors"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
