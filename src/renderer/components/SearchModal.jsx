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
    const [showFilters, setShowFilters] = useState(false);
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
        // If no type selected, show all subtypes
        const all = Object.values(taskSubtypes).flat();
        const unique = Array.from(new Map(all.map(s => [s.id, s])).values());
        return unique.map(st => ({ id: st.id, label: st.label }));
    }, [filters?.type, taskSubtypes]);

    const activeFiltersCount = useMemo(() => {
        if (!filters) return 0;
        return Object.values(filters).filter(v => !!v).length;
    }, [filters]);

    return (
        <Modal open={open} onClose={onClose} title="Cerca nello storico">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="search"
                            placeholder="Cerca per titolo, cliente, note..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full text-lg p-3 pr-10 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/50 shadow-sm transition-all dark:border-slate-700/80 dark:bg-slate-900/50 dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                             <Icon name="search" className="w-5 h-5" />
                        </div>
                    </div>
                    <Button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 min-w-[100px] gap-2 ${showFilters || activeFiltersCount > 0 ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"}`}
                    >
                        <Icon name="settings" className="w-4 h-4" />
                        <span>Filtri</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>

                {showFilters && (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dal</label>
                                <input 
                                    type="date" 
                                    value={filters?.startDate || ""}
                                    onChange={(e) => updateFilter("startDate", e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Al</label>
                                <input 
                                    type="date" 
                                    value={filters?.endDate || ""}
                                    onChange={(e) => updateFilter("endDate", e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente / Progetto</label>
                                <Combobox 
                                    value={filters?.project || ""}
                                    onChange={(v) => updateFilter("project", v)}
                                    options={projectOptions}
                                    placeholder="Tutti i clienti"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collaboratore</label>
                                <Combobox 
                                    value={filters?.collaborator || ""}
                                    onChange={(v) => updateFilter("collaborator", v)}
                                    options={collaboratorOptions}
                                    placeholder="Tutte le persone"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo Task</label>
                                <select 
                                    value={filters?.type || ""}
                                    onChange={(e) => {
                                        updateFilter("type", e.target.value);
                                        updateFilter("subtypeId", "");
                                    }}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none h-[42px]"
                                >
                                    <option value="">Tutti i tipi</option>
                                    {TASK_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sottotipo</label>
                                <Combobox 
                                    value={filters?.subtypeId || ""}
                                    onChange={(v) => updateFilter("subtypeId", v)}
                                    options={subtypeOptions}
                                    placeholder="Tutti i sottotipi"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <Icon name="rotate-ccw" className="w-3.5 h-3.5" />
                                Reset Filtri
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 min-h-[100px]">
                    {(query.trim().length > 0 && query.trim().length < 2) && activeFiltersCount === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            Digita almeno 2 caratteri per cercare.
                        </div>
                    )}
                    
                    {results.length === 0 && (query.trim().length >= 2 || activeFiltersCount > 0) && (
                        <div className="text-center text-slate-500 py-8">
                            Nessun risultato trovato.
                        </div>
                    )}

                    {results.map((res, i) => (
                        <div
                            key={`${res.dateKey}-${res.slot}-${i}`}
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            onClick={() => {
                                onSelectDate(res.date, res.rawSlots);
                                onClose();
                            }}
                        >
                            <div className="flex items-start justify-between mb-1 gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex-1 break-words">
                                    {res.entry.title || "Senza titolo"}
                                </h4>
                                <div className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                                    {res.date.toLocaleDateString("it-IT")} • {res.slot}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                                {res.entry.client && (
                                    <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/30">
                                        {res.entry.client}
                                    </span>
                                )}
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-slate-600/20 dark:ring-slate-400/20 ${
                                    res.entry.type === 'vacation' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                    res.entry.type === 'client' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                    res.entry.type === 'internal' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                    'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                }`}>
                                    {TASK_TYPES.find(t => t.id === res.entry.type)?.label || res.entry.type}
                                </span>
                            </div>
                            
                            {res.entry.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {res.entry.notes}
                                </p>
                            )}

                            {(res.entry.collaborators || []).length > 0 && (
                                <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                                     <span className="text-[10px] text-slate-400 uppercase font-bold">👥</span>
                                     <div className="flex flex-wrap gap-1">
                                        {res.entry.collaborators.map(c => (
                                            <span key={c} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
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
        </Modal>
    );
}
