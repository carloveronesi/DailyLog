import { useState } from "react";
import { Icon, Button } from "./ui";
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

export function TodoView() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleDone } = useTodos();
  const [selectedTodoId, setSelectedTodoId] = useState(null);

  // Grouping todos
  const groups = {
    "DA FARE": todos.filter(t => t.group === "DA FARE"),
  };

  const selectedTodo = todos.find(t => t.id === selectedTodoId) || null;

  function handleAddNew() {
    addTodo({});
  }

  return (
    <div className="flex h-full bg-white dark:bg-slate-950 rounded-3xl overflow-hidden relative shadow-soft dark:shadow-none border border-slate-200 dark:border-slate-800">
      
      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Attività</h2>
          
          {Object.entries(groups).map(([groupName, groupTodos]) => (
            <div key={groupName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="list-check" className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-sm tracking-wide text-slate-500 dark:text-slate-400 uppercase">{groupName}</h3>
                <span className="text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{groupTodos.length}</span>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_150px_150px_80px_40px] gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div>Nome</div>
                  <div>Data di inizio</div>
                  <div>Data di scadenza</div>
                  <div>Priorità</div>
                  <div></div>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {groupTodos.map(todo => (
                    <div key={todo.id} className="grid grid-cols-[1fr_150px_150px_80px_40px] gap-4 p-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group/row">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button 
                          onClick={() => toggleDone(todo.id)}
                          className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${todo.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-transparent hover:border-slate-400"}`}
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setSelectedTodoId(todo.id)}
                          className={`truncate font-medium text-sm text-left outline-none ${todo.isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {todo.title}
                        </button>
                      </div>
                      
                      <div>
                        <DateInput 
                          value={todo.startDate} 
                          onChange={(e) => updateTodo(todo.id, { startDate: e.target.value })} 
                        />
                      </div>
                      
                      <div>
                        <DateInput 
                          value={todo.endDate} 
                          onChange={(e) => updateTodo(todo.id, { endDate: e.target.value })} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-center text-slate-300">
                        <Icon name="list-check" className="w-4 h-4 opacity-50" />
                      </div>
                      
                      <div className="flex justify-end opacity-0 group-hover/row:opacity-100 transition">
                         <button onClick={() => deleteTodo(todo.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded">
                           <Icon name="trash" className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3">
                    <button 
                      onClick={handleAddNew}
                      className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                    >
                      <Icon name="list-check" className="w-4 h-4" />
                      Aggiungi Attività
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel */}
      {selectedTodo && (
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button 
              onClick={() => toggleDone(selectedTodo.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${selectedTodo.isDone ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTodo.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-500"}`}>
                {selectedTodo.isDone && <Icon name="check" className="w-2.5 h-2.5" />}
              </span>
              {selectedTodo.isDone ? "Completato" : "Segna come completato"}
            </button>
            
            <button onClick={() => setSelectedTodoId(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
             <input 
               type="text"
               value={selectedTodo.title}
               onChange={(e) => updateTodo(selectedTodo.id, { title: e.target.value })}
               placeholder="Titolo attività"
               className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 focus:ring-0 px-0"
             />
             
             <div className="space-y-4">
                <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                  <Icon name="calendar" className="w-4 h-4 justify-self-center text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inizio</span>
                    <input 
                      type="date"
                      value={selectedTodo.startDate || ""}
                      onChange={(e) => updateTodo(selectedTodo.id, { startDate: e.target.value })}
                      className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                  <Icon name="calendar" className="w-4 h-4 justify-self-center text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scadenza</span>
                    <input 
                      type="date"
                      value={selectedTodo.endDate || ""}
                      onChange={(e) => updateTodo(selectedTodo.id, { endDate: e.target.value })}
                      className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
             </div>
             
             <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
               <textarea
                  value={selectedTodo.description}
                  onChange={(e) => updateTodo(selectedTodo.id, { description: e.target.value })}
                  placeholder="Aggiungi una descrizione..."
                  className="w-full min-h-[150px] bg-transparent border-none outline-none resize-none text-sm text-slate-600 dark:text-slate-400 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-0 px-0"
               />
             </div>
          </div>
          
          <div className="absolute bottom-0 right-0 w-80 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900/50 flex justify-end">
             <button onClick={() => deleteTodo(selectedTodo.id)} className="text-sm flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium">
               <Icon name="trash" className="w-4 h-4" /> Elimina
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
