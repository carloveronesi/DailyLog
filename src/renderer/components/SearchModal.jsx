import { useState, useMemo, useEffect, useRef } from "react";
import { searchAllLogs } from "../services/storage";
import { Modal, Icon } from "./ui";
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
        <Modal open={open} onClose={onClose} fullscreen>
            {/* Header */}
            <div className="shrink-0 mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-si-accent mb-1">Ricerca</div>
                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-si-ink">Cerca nello storico</h2>
            </div>

            {/* Search bar */}
            <div className="shrink-0 relative mb-5">
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Cerca per titolo, cliente, note..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full text-lg p-4 pr-12 rounded-2xl border border-si-border bg-si-muted shadow-si focus:outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition-all text-si-ink placeholder-si-grayLight"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-si-grayLight pointer-events-none">
                    <Icon name="search" className="w-6 h-6" />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                {/* Results */}
                <div className="overflow-y-auto pr-1 space-y-3 min-h-0">
                    {(query.trim().length > 0 && query.trim().length < 2) && activeFiltersCount === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-si-grayLight">
                            <Icon name="search" className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium text-si-gray">Digita almeno 2 caratteri per cercare</p>
                        </div>
                    )}

                    {results.length === 0 && (query.trim().length >= 2 || activeFiltersCount > 0) && (
                        <div className="flex flex-col items-center justify-center py-20 text-si-grayLight">
                            <Icon name="search" className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium text-si-gray">Nessun risultato trovato</p>
                        </div>
                    )}

                    {results.length === 0 && query.trim().length === 0 && activeFiltersCount === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-si-grayLight">
                            <Icon name="search" className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium text-si-gray">Usa la barra di ricerca o i filtri per iniziare</p>
                        </div>
                    )}

                    {results.map((res, i) => (
                        <div
                            key={`${res.dateKey}-${res.slot}-${i}`}
                            className="p-4 border border-si-border rounded-2xl bg-si-muted hover:bg-si-surface cursor-pointer transition-all hover:shadow-si"
                            onClick={() => {
                                onSelectDate(res.date, res.rawSlots);
                                onClose();
                            }}
                        >
                            <div className="flex items-start justify-between mb-3 gap-2">
                                <h4 className="font-bold text-si-ink flex-1 break-words leading-tight">
                                    {res.entry.title || "Senza titolo"}
                                </h4>
                                <div className="text-[11px] font-mono font-bold text-si-gray bg-si-muted border border-si-border px-2 py-1 rounded-lg shrink-0">
                                    {res.date.toLocaleDateString("it-IT")} • {res.slot}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {res.entry.client && (
                                    <span className="inline-flex items-center rounded-full bg-si-accentSoft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-si-accent">
                                        {res.entry.client}
                                    </span>
                                )}
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                    res.entry.type === 'vacation' ? 'bg-si-success/10 text-si-success' :
                                    res.entry.type === 'client' ? 'bg-si-accentSoft text-si-accent' :
                                    res.entry.type === 'internal' ? 'bg-si-amberSoft text-si-amber' :
                                    'bg-si-violetSoft text-si-violet'
                                }`}>
                                    {TASK_TYPES.find(t => t.id === res.entry.type)?.label || res.entry.type}
                                </span>
                            </div>

                            {res.entry.notes && (
                                <p className="text-sm text-si-gray line-clamp-2 leading-relaxed italic">
                                    {res.entry.notes}
                                </p>
                            )}

                            {(res.entry.collaborators || []).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-si-border flex items-center gap-2 overflow-hidden">
                                    <span className="text-[10px] text-si-gray uppercase font-bold">👥</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {res.entry.collaborators.map(c => (
                                            <span key={c} className="text-[10px] font-bold text-si-inkSoft bg-si-muted px-2 py-0.5 rounded-lg border border-si-border">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Filters card */}
                <div className="rounded-[20px] border border-si-border bg-si-muted p-5 flex flex-col min-h-0 overflow-y-auto">
                    <div className="flex items-center justify-between mb-5 shrink-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-si-gray">Filtri</h3>
                            {activeFiltersCount > 0 && (
                                <span className="text-[10px] font-bold bg-si-accentSoft text-si-accent px-2 py-0.5 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-[11px] font-bold text-si-rose hover:text-si-rose/80 transition-colors flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                            >
                                <Icon name="rotate-ccw" className="w-3 h-3" />
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Tipo Task</label>
                            <select
                                value={filters?.type || ""}
                                onChange={(e) => {
                                    updateFilter("type", e.target.value);
                                    updateFilter("subtypeId", "");
                                    if (e.target.value !== "client") updateFilter("project", "");
                                }}
                                className="w-full text-sm p-3 rounded-xl border border-si-border bg-si-surface shadow-si outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent transition-all font-semibold text-si-ink"
                            >
                                <option value="">Tutti i tipi</option>
                                {TASK_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Sottotipo</label>
                            <Combobox
                                value={filters?.subtypeId || ""}
                                onChange={(v) => updateFilter("subtypeId", v)}
                                options={subtypeOptions}
                                placeholder="Tutti i sottotipi"
                            />
                        </div>

                        {(filters?.type === "" || filters?.type === "client") && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Cliente / Progetto</label>
                                <Combobox
                                    value={filters?.project || ""}
                                    onChange={(v) => updateFilter("project", v)}
                                    options={projectOptions}
                                    placeholder="Tutti i clienti"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Collaboratore</label>
                            <Combobox
                                value={filters?.collaborator || ""}
                                onChange={(v) => updateFilter("collaborator", v)}
                                options={collaboratorOptions}
                                placeholder="Tutte le persone"
                            />
                        </div>

                        <div className="pt-4 border-t border-si-border space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Data Inizio</label>
                                <input
                                    type="date"
                                    value={filters?.startDate || ""}
                                    onChange={(e) => updateFilter("startDate", e.target.value)}
                                    className="w-full text-sm p-3 rounded-xl border border-si-border bg-si-surface shadow-si outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent font-semibold text-si-ink"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-si-gray">Data Fine</label>
                                <input
                                    type="date"
                                    value={filters?.endDate || ""}
                                    onChange={(e) => updateFilter("endDate", e.target.value)}
                                    className="w-full text-sm p-3 rounded-xl border border-si-border bg-si-surface shadow-si outline-none focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent font-semibold text-si-ink"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
