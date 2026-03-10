import { useState, useMemo, useEffect, useRef } from "react";
import { searchAllLogs } from "../services/storage";
import { Modal, Button, Icon } from "./ui";

export function SearchModal({ open, onClose, onSelectDate }) {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    const results = useMemo(() => {
        if (query.trim().length < 2) return [];
        return searchAllLogs(query);
    }, [query]);

    return (
        <Modal open={open} onClose={onClose} title="Cerca nello storico">
            <div className="space-y-4">
                <div>
                    <input
                        ref={inputRef}
                        type="search"
                        placeholder="Cerca per titolo, cliente, note..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full text-lg p-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/50 shadow-sm transition-all dark:border-slate-700/80 dark:bg-slate-900/50 dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                    {query.trim().length > 0 && query.trim().length < 2 && (
                        <div className="text-center text-slate-500 py-8">
                            Digita almeno 2 caratteri per cercare.
                        </div>
                    )}
                    
                    {query.trim().length >= 2 && results.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            Nessun risultato trovato per "{query}".
                        </div>
                    )}

                    {results.map((res, i) => (
                        <div
                            key={`${res.dateKey}-${res.slot}-${i}`}
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
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
                            
                            {res.entry.client && (
                                <div className="mb-2">
                                    <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/30">
                                        {res.entry.client}
                                    </span>
                                </div>
                            )}
                            
                            {res.entry.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {res.entry.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
