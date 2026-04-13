import { useState } from "react";
import { Icon, Button, Modal } from "./ui";
import { useTodos } from "../hooks/useTodos";

function DateInput({ value, onChange, placeholder }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={onChange}
      className={`min-w-[120px] rounded-lg px-2 py-1.5 text-sm bg-transparent transition hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-300 dark:hover:bg-slate-800 dark:focus:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 outline-none ${!value ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"}`}
    />
  );
}

export function TodoView({ 
  isEmbedded = false, 
  availableProjects = [], 
  availableTags = [],
  onAddGlobalTodoTag
}) {
  const { todos, addTodo, updateTodo, deleteTodo, toggleDone } = useTodos();
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");

  const pending = todos.filter(t => !t.isDone);
  const done = todos.filter(t => t.isDone);

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
    ? "flex h-full bg-white/80 backdrop-blur dark:bg-slate-800/80 rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-700"
    : "flex h-full bg-white dark:bg-slate-950 rounded-3xl overflow-hidden relative shadow-soft dark:shadow-none border border-slate-200 dark:border-slate-800";

  return (
    <div className={containerClass}>
      
      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attività</h2>
          </div>
          
          {[
            { groupName: "DA FARE", groupTodos: pending, showAdd: true },
            ...(done.length > 0 ? [{ groupName: "FATTI", groupTodos: done, showAdd: false }] : []),
          ].map(({ groupName, groupTodos, showAdd }) => (
            <div key={groupName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="list-check" className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-sm tracking-wide text-slate-500 dark:text-slate-400 uppercase">{groupName}</h3>
                <span className="text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{groupTodos.length}</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_40px] lg:grid-cols-[1fr_120px_120px_40px] gap-2 lg:gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <div>Nome / Progetto</div>
                  <div className="hidden sm:block text-center">Inizio</div>
                  <div className="hidden sm:block text-center">Scadenza</div>
                  <div></div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {groupTodos.map(todo => {
                    const doneSubtasks = (todo.subtasks || []).filter(s => s.isDone).length;
                    const totalSubtasks = (todo.subtasks || []).length;
                    const hasSubtasks = totalSubtasks > 0;
                    
                    return (
                      <div key={todo.id} className="grid grid-cols-[1fr_auto_auto_40px] lg:grid-cols-[1fr_120px_120px_40px] gap-2 lg:gap-4 p-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group/row">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => toggleDone(todo.id)}
                            className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${todo.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-transparent hover:border-slate-400"}`}
                          >
                            <Icon name="check" className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <button 
                              onClick={() => setSelectedTodoId(todo.id)}
                              className={`truncate font-medium text-sm text-left outline-none ${todo.isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}
                            >
                              {todo.title || <span className="opacity-40 italic font-normal">Senza titolo...</span>}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              {todo.project && (
                                <span className={
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight " +
                                  (todo.project.toLowerCase() === "interno" 
                                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                    : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400")
                                }>
                                  {todo.project}
                                </span>
                              )}
                              {hasSubtasks && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex items-center gap-1 ${todo.isDone ? "opacity-50" : ""}`}>
                                  <Icon name="list-check" className="w-3 h-3" />
                                  {doneSubtasks}/{totalSubtasks}
                                </span>
                              )}
                              {(todo.tags || []).map(tag => (
                                <span key={tag} className="text-[9px] font-bold px-1 py-0.5 rounded border border-slate-200 text-slate-400 dark:border-slate-700 uppercase tracking-tighter">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden sm:block">
                          <DateInput 
                            value={todo.startDate} 
                            onChange={(e) => updateTodo(todo.id, { startDate: e.target.value })} 
                          />
                        </div>
                        
                        <div className="hidden sm:block">
                          <DateInput 
                            value={todo.endDate} 
                            onChange={(e) => updateTodo(todo.id, { endDate: e.target.value })} 
                          />
                        </div>
                        
                        <div className="flex justify-end opacity-0 group-hover/row:opacity-100 transition">
                           <button onClick={() => deleteTodo(todo.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded">
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
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          <button
                            onClick={handleSaveNew}
                            disabled={!newTodoTitle.trim()}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            Salva
                          </button>
                          <button
                            onClick={handleCancelNew}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                          >
                            <Icon name="x" className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddNew}
                          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                        >
                          <Icon name="list-check" className="w-4 h-4" />
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
        <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-slate-800 animate-in fade-in slide-in-from-right-6 duration-300">
          {/* Header with Back Button */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTodoId(null)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition group"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition">
                  <Icon name="chev-left" className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Torna alla lista</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Dettaglio Attività</div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-10">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => toggleDone(selectedTodo.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedTodo.isDone ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTodo.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-500"}`}>
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Titolo</label>
                <input 
                  type="text"
                  value={selectedTodo.title}
                  onChange={(e) => updateTodo(selectedTodo.id, { title: e.target.value })}
                  placeholder="Titolo attività"
                  className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 focus:ring-0 px-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progetto</label>
                  <select
                    value={selectedTodo.project || ""}
                    onChange={(e) => updateTodo(selectedTodo.id, { project: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <option value="">Nessuno</option>
                    <option value="Interno">Interno</option>
                    {availableProjects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tag</label>
                  <div className="flex flex-wrap gap-1 min-h-[42px] p-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700">
                    {availableTags.map(tag => {
                      const isSelected = (selectedTodo.tags || []).includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={
                            "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all " +
                            (isSelected 
                              ? "bg-sky-600 text-white shadow-sm" 
                              : "bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-700")
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                    <input 
                      type="text"
                      placeholder="+ Tag..."
                      className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none px-2 py-0.5 w-16 focus:w-24 transition-all"
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
              <div className="grid grid-cols-[30px_1fr] items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                <Icon name="calendar" className="w-4 h-4 justify-self-center text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inizio</span>
                  <input 
                    type="date"
                    value={selectedTodo.startDate || ""}
                    onChange={(e) => updateTodo(selectedTodo.id, { startDate: e.target.value })}
                    className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-[30px_1fr] items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                <Icon name="calendar" className="w-4 h-4 justify-self-center text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scadenza</span>
                  <input 
                    type="date"
                    value={selectedTodo.endDate || ""}
                    onChange={(e) => updateTodo(selectedTodo.id, { endDate: e.target.value })}
                    className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrizione</label>
                <textarea
                  value={selectedTodo.description}
                  onChange={(e) => updateTodo(selectedTodo.id, { description: e.target.value })}
                  placeholder="Aggiungi una descrizione dettagliata..."
                  className="w-full min-h-[120px] bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-400 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-sky-500/10 outline-none transition"
                />
              </div>

              <div className="space-y-4 pt-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Sotto-task</label>
                <div className="space-y-2 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/10">
                  {(selectedTodo.subtasks || []).map(st => (
                    <div key={st.id} className="flex items-center gap-3 group/st pr-2">
                      <button 
                        onClick={() => toggleSubtask(st.id)}
                        className={`shrink-0 w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${st.isDone ? "bg-sky-500 border-sky-500 text-white" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-sky-400"}`}
                      >
                        <Icon name="check" className="w-3 h-3" />
                      </button>
                      <span className={`text-sm flex-1 ${st.isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                        {st.title}
                      </span>
                      <button 
                        onClick={() => deleteSubtask(st.id)}
                        className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-4.5 h-4.5 flex items-center justify-center text-slate-300">
                      <Icon name="plus" className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Aggiungi sotto-task..."
                      className="bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none flex-1 border-b border-transparent focus:border-slate-200 dark:focus:border-slate-700 pb-0.5 transition-colors"
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
