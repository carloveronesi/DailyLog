import { useState, useMemo, useEffect, useRef } from "react";
import { searchAllLogs } from "../services/storage";
import { Modal, Button, Icon } from "./ui";
import { Combobox } from "./Combobox";
import { TASK_TYPES, ensureSubtypesFormat } from "../domain/tasks";

export function SearchModal({ 
    open, 
    onClose, 
    onSelectDate, 
    allPeople = [], 
    allClients = [], 
    settings,
    filters,
    setFilters
}) {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    const taskSubtypes = useMemo(() => ensureSubtypesFormat(settings?.taskSubtypes), [settings]);

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    const results = useMemo(() => {
        const hasActiveFilters = filters && Object.values(filters).some(v => !!v);
        if (query.trim().length < 2 && !hasActiveFilters) return [];
        return searchAllLogs(query, filters);
    }, [query, filters]);

    const updateFilter = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const resetFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            collaborator: "",
            project: "",
            type: "",
            subtypeId: ""
        });
    };

    const collaboratorOptions = useMemo(() => (allPeople || []).map(p => p.name), [allPeople]);
    const projectOptions = useMemo(() => allClients || [], [allClients]);
    
    const subtypeOptions = useMemo(() => {
        if (filters?.type) {
            return (taskSubtypes[filters.type] || []).map(st => ({ id: st.id, label: st.label }));
        }
        const all = Object.values(taskSubtypes).flat();
        const unique = Array.from(new Map(all.map(s => [s.id, s])).values());
        return unique.map(st => ({ id: st.id, label: st.label }));
    }, [filters?.type, taskSubtypes]);

    const activeFiltersCount = useMemo(() => {
        if (!filters) return 0;
        return Object.values(filters).filter(v => !!v).length;
    }, [filters]);

    return (
        <Modal open={open} onClose={onClose} title="Cerca nello storico" className="max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 min-h-0">
                {/* Column Left: Search and Results */}
                <div className="flex flex-col min-h-0">
                    <div className="relative mb-6">
                        <input
                            ref={inputRef}
                            type="search"
                            placeholder="Cerca per titolo, cliente, note..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full text-lg p-4 pr-12 rounded-2xl border border-slate-200 bg-white shadow-soft focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                             <Icon name="search" className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[400px]">
                        {(query.trim().length > 0 && query.trim().length < 2) && activeFiltersCount === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Icon name="search" className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium text-slate-500">Digita almeno 2 caratteri per cercare</p>
                            </div>
                        )}
                        
                        {results.length === 0 && (query.trim().length >= 2 || activeFiltersCount > 0) && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Icon name="search" className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium text-slate-500">Nessun risultato trovato</p>
                            </div>
                        )}

                        {results.map((res, i) => (
                            <div
                                key={`${res.dateKey}-${res.slot}-${i}`}
                                className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800/50 cursor-pointer transition-all hover:shadow-md dark:hover:shadow-none group"
                                onClick={() => {
                                    onSelectDate(res.date, res.rawSlots);
                                    onClose();
                                }}
                            >
                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex-1 break-words leading-tight">
                                        {res.entry.title || "Senza titolo"}
                                    </h4>
                                    <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                                        {res.date.toLocaleDateString("it-IT")} • {res.slot}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {res.entry.client && (
                                        <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/30">
                                            {res.entry.client}
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-slate-600/20 dark:ring-slate-400/20 ${
                                        res.entry.type === 'vacation' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                        res.entry.type === 'client' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                        res.entry.type === 'internal' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                        'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                    }`}>
                                        {TASK_TYPES.find(t => t.id === res.entry.type)?.label || res.entry.type}
                                    </span>
                                </div>
                                
                                {res.entry.notes && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                                        {res.entry.notes}
                                    </p>
                                )}

                                {(res.entry.collaborators || []).length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 overflow-hidden">
                                         <span className="text-[10px] text-slate-400 uppercase font-bold">👥</span>
                                         <div className="flex flex-wrap gap-1.5">
                                            {res.entry.collaborators.map(c => (
                                                <span key={c} className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    {c}
                                                </span>
                                            ))}
                                         </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column Right: Filters */}
                <aside className="lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-8 space-y-6">
                    <div className="flex items-center justify-between group/title">
                        <div className="flex items-center gap-2">
                            <Icon name="settings" className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Filtri</h3>
                        </div>
                        {activeFiltersCount > 0 && (
                            <button 
                                onClick={resetFilters}
                                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                            >
                                <Icon name="rotate-ccw" className="w-3 h-3" />
                                RESET
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-5 overflow-y-auto pr-1">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo Task</label>
                                <select 
                                    value={filters?.type || ""}
                                    onChange={(e) => {
                                        updateFilter("type", e.target.value);
                                        updateFilter("subtypeId", "");
                                        if (e.target.value !== "client") updateFilter("project", "");
                                    }}
                                    className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 transition-all font-semibold"
                                >
                                    <option value="">Tutti i tipi</option>
                                    {TASK_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sottotipo</label>
                                <Combobox 
                                    value={filters?.subtypeId || ""}
                                    onChange={(v) => updateFilter("subtypeId", v)}
                                    options={subtypeOptions}
                                    placeholder="Tutti i sottotipi"
                                />
                            </div>
                        </div>

                        {(filters?.type === "" || filters?.type === "client") && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente / Progetto</label>
                                <Combobox 
                                    value={filters?.project || ""}
                                    onChange={(v) => updateFilter("project", v)}
                                    options={projectOptions}
                                    placeholder="Tutti i clienti"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collaboratore</label>
                            <Combobox 
                                value={filters?.collaborator || ""}
                                onChange={(v) => updateFilter("collaborator", v)}
                                options={collaboratorOptions}
                                placeholder="Tutte le persone"
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Inizio</label>
                                    <input 
                                        type="date" 
                                        value={filters?.startDate || ""}
                                        onChange={(e) => updateFilter("startDate", e.target.value)}
                                        className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 font-semibold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Fine</label>
                                    <input 
                                        type="date" 
                                        value={filters?.endDate || ""}
                                        onChange={(e) => updateFilter("endDate", e.target.value)}
                                        className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </Modal>
    );
}
