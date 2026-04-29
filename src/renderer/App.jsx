import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayView } from "./components/DayView";
import { WeekView } from "./components/WeekView";
import { SearchModal } from "./components/SearchModal";
import { TodoView } from "./components/TodoView";
import { ProjectView } from "./components/ProjectView";
import { Button, Icon, Modal } from "./components/ui";
import { useCalendarData } from "./hooks/useCalendarData";
import { useBackupSync } from "./hooks/useBackupSync";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useUIState } from "./hooks/useUIState";
import { SettingsContext, useWorkSlots } from "./contexts/SettingsContext";
import { ymd, sameYMD, dowMon0 } from "./utils/date";
import { exportAll, listStoredClients, listStoredPeople, savePeople, loadProjects } from "./services/storage";
import { LOCATION_TYPES, SLOT_MINUTES, hourKey } from "./domain/tasks";
import { matchesRecurringPattern } from "./domain/calendar";

function SidebarBtn({ icon, label, onClick, disabled, activeClass = "", isActive = false, accent = false }) {
  const activeBtnClass = accent
    ? "bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500"
    : (isActive ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800");
  const iconColor = accent ? "text-white" : (activeClass ? activeClass : (isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-slate-300"));
  const labelColor = accent ? "text-white" : (isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-600 dark:text-slate-400");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col lg:flex-row items-center justify-center w-full py-2 px-1 lg:p-4 transition-colors lg:rounded-none rounded-2xl group/btn overflow-visible ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${activeBtnClass}`}
    >
      <Icon name={icon} className={`shrink-0 transition-transform duration-200 group-hover/btn:scale-110 ${iconColor}`} />
      {/* Mobile label under icon */}
      <span className={`lg:hidden text-[9px] font-bold uppercase tracking-wider mt-0.5 leading-none ${labelColor}`}>
        {label.split(" ")[0]}
      </span>

      {/* Floating Tooltip (desktop only) */}
      <span className="hidden lg:block absolute left-full ml-3 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all transform translate-x-1 group-hover/btn:translate-x-0 font-bold text-[11px] uppercase tracking-widest text-white bg-slate-900/90 dark:bg-slate-700/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl z-[100] pointer-events-none before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-900/90 dark:before:border-r-slate-700/95">
        {label}
      </span>
    </button>
  );
}

export default function App() {
  const today = new Date();

  const {
    year,
    month,
    data,
    gridDates,
    monthDataByDate,
    topMonthClients,
    upsertDay,
    deleteDay,
    undoLastChange,
    redoLastChange,
    hasUndo,
    undoLabel,
    hasRedo,
    redoLabel,
    undoHistory,
    redoHistory,
    saveCount,
    reloadFromStorage,
    prevMonth,
    nextMonth,
    goToday,
    setMonthYear,
    setData,
  } = useCalendarData(today.getFullYear(), today.getMonth());

  const {
    hasDesktopBridge,
    settings,
    setSettings,
    settingsStatus,
    backupFileHandle,
    backupStatus,
    desktopBackupPath,
    desktopBackupStatus,
    supportsAutoBackup,
    enableAutoBackup,
    disableAutoBackup,
    pickDesktopBackupDir,
    useDefaultDesktopBackupDir,
  } = useBackupSync(data, year, month);

  const [allPeople, setAllPeople] = useState(() => listStoredPeople());

  const { WORK_SLOTS } = useWorkSlots(settings);
  const { onMoveTask, onResizeTask, handleSlotDeletion, blockedToast } = useTaskOperations({ monthDataByDate, upsertDay, WORK_SLOTS });

  const {
    selectedDate, selectedSlot, selectedRange,
    editorOpen,
    settingsOpen, setSettingsOpen,
    searchOpen, setSearchOpen,
    summaryHoverFilter, setSummaryHoverFilter,
    summaryFixedFilter, setSummaryFixedFilter,
    viewMode, setViewMode,
    activeDate, setActiveDate,
    showBackupConfirm, setShowBackupConfirm,
    openEditor, openDayFromMonth, closeEditor,
    goPrevDay, goNextDay, goTodayDay,
    searchFilters, setSearchFilters,
  } = useUIState({ settings, setMonthYear });

  // Sincronizza mese calendario con la data attiva nelle viste settimana/giorno
  useEffect(() => {
    if (viewMode === "month" || viewMode === "projects") return;
    if (activeDate.getFullYear() === year && activeDate.getMonth() === month) return;
    setMonthYear(activeDate.getFullYear(), activeDate.getMonth());
  }, [viewMode, activeDate, year, month, setMonthYear]);

  function handleImportSuccess() {
    reloadFromStorage();
  }

  // Copia giorno
  const [copiedDay, setCopiedDay] = useState(null);

  function handleCopyDay(date) {
    const data = monthDataByDate[ymd(date)];
    if (!data) return;
    setCopiedDay(data);
  }

  function handlePasteDay(date) {
    if (!copiedDay) return;
    upsertDay(date, { ...copiedDay }, "Incolla giorno");
  }

  function handleCancelPaste() {
    setCopiedDay(null);
    copiedEntryRef.current = null;
    setCopiedEntry(null);
  }

  // Copia singolo task/slot
  const [copiedEntry, setCopiedEntry] = useState(null); // { entry, slotCount }
  // Ref aggiornato in modo sincrono per evitare closure stale negli handler onOpenSlot
  const copiedEntryRef = useRef(null);

  function handleCopyEntry(entry, start, end) {
    const slotCount = end && start !== undefined ? Math.round((end - start) / SLOT_MINUTES) : 1;
    const val = { entry: { ...entry }, slotCount };
    copiedEntryRef.current = val;
    setCopiedEntry(val);
    setCopiedDay(null);
  }

  function handlePasteEntry(date, slotStart) {
    const val = copiedEntryRef.current;
    if (!val) return;
    const existing = monthDataByDate[ymd(date)] || {};
    const newHours = { ...(existing.hours || {}) };

    // Conta quanti slot consecutivi liberi ci sono da slotStart in WORK_SLOTS
    const startIdx = WORK_SLOTS.indexOf(slotStart);
    let freeCount = 0;
    for (let i = startIdx; i < WORK_SLOTS.length; i++) {
      if (i > startIdx && WORK_SLOTS[i] !== WORK_SLOTS[i - 1] + SLOT_MINUTES) break; // pausa pranzo
      if (newHours[hourKey(WORK_SLOTS[i])]) break; // slot occupato
      freeCount++;
    }
    const slotsToWrite = Math.min(val.slotCount, freeCount);
    if (slotsToWrite === 0) return;

    for (let i = 0; i < slotsToWrite; i++) {
      newHours[hourKey(slotStart + i * SLOT_MINUTES)] = { ...val.entry };
    }
    upsertDay(date, { ...existing, hours: newHours }, "Incolla task");
    copiedEntryRef.current = null;
    setCopiedEntry(null);
  }

  // Task ricorrenti
  function handleApplyRecurring(date) {
    const task = settings.recurringTasks?.find(t => matchesRecurringPattern(t, date));
    if (!task) return;
    const existing = monthDataByDate[ymd(date)] || {};
    if (task.hours) {
      upsertDay(date, { AM: null, PM: null, location: existing.location || null, hours: { ...(existing.hours || {}), ...task.hours } }, "Applica ricorrente");
    } else {
      upsertDay(date, { AM: task.AM || null, PM: task.PM || null, location: existing.location || null }, "Applica ricorrente");
    }
  }

  function handleFillMonth() {
    const tasks = settings.recurringTasks || [];
    if (tasks.length === 0) return;
    for (const d of gridDates) {
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const key = ymd(d);
      const dayData = monthDataByDate[key];
      if (dayData?.AM || dayData?.PM || (dayData?.hours && Object.keys(dayData.hours).length > 0)) continue;
      const task = tasks.find(t => matchesRecurringPattern(t, d));
      if (!task) continue;
      if (task.hours) {
        upsertDay(d, { ...(dayData || {}), hours: { ...task.hours } });
      } else {
        upsertDay(d, { AM: task.AM || null, PM: task.PM || null, location: dayData?.location || null });
      }
    }
  }

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;
  // listStoredClients scans all months in localStorage, not just the current one —
  // re-derive whenever current month data changes (covers both saves and post-import reload).
  // projectsVersion bumps when ProjectView saves/archives, so EntryForm reloads projects immediately.
  const [projectsVersion, setProjectsVersion] = useState(0);
  // clientNames include tutti i clienti (archiviati e no): il filtro archiviati
  // è gestito da EntryForm (dropdown editor) e da ProjectView (sidebar).
  const clientNames = useMemo(() => listStoredClients(), [data, projectsVersion]);

  const dayKey = ymd(activeDate);
  const dayData = monthDataByDate[dayKey] || null;

  const searchTimeoutRef = useRef(null);
  useEffect(() => () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }, []);

  // Toast "Salvato" + undo
  const [savedToast, setSavedToast] = useState(false);
  const savedToastTimerRef = useRef(null);

  useEffect(() => {
    if (saveCount === 0) return;
    setSavedToast(true);
    if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    savedToastTimerRef.current = setTimeout(() => {
      setSavedToast(false);
      savedToastTimerRef.current = null;
    }, 4000);
  }, [saveCount]);

  useEffect(() => () => { if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current); }, []);

  const [showHistory, setShowHistory] = useState(false);

  function handleUndo() {
    undoLastChange();
    setSavedToast(false);
    if (savedToastTimerRef.current) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
  }

  function handleRedo() {
    redoLastChange();
  }

  // Ctrl+Z shortcut + ESC per annullare paste mode
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (editorOpen || settingsOpen || searchOpen) return;
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        if (editorOpen || settingsOpen || searchOpen) return;
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Escape" && (copiedDay || copiedEntry) && !editorOpen && !settingsOpen && !searchOpen) {
        setCopiedDay(null);
        copiedEntryRef.current = null;
        setCopiedEntry(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorOpen, settingsOpen, searchOpen, hasUndo, hasRedo, copiedDay, copiedEntry]);

  const handleToggleLocation = useCallback((date) => {
    const key = ymd(date);
    const existing = monthDataByDate[key] || {};
    const current = existing.location || LOCATION_TYPES.REMOTE;
    let next;
    if (current === LOCATION_TYPES.REMOTE) next = LOCATION_TYPES.OFFICE;
    else if (current === LOCATION_TYPES.OFFICE) next = LOCATION_TYPES.CLIENT;
    else next = LOCATION_TYPES.REMOTE;

    upsertDay(date, { ...existing, location: next }, "Cambia sede");
  }, [monthDataByDate, upsertDay]);

  const isToday = sameYMD(activeDate, new Date());
  const mainLayoutClass = viewMode === "projects"
    ? "flex flex-col lg:flex-1 lg:min-h-0"
    : viewMode === "month"
      ? "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5"
      : viewMode === "day"
        ? (isToday ? "grid grid-cols-1 lg:grid-cols-2 gap-5" : "grid grid-cols-1 gap-5")
        : "grid grid-cols-1 gap-5";

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className="min-h-screen lg:h-screen flex flex-col-reverse lg:flex-row overflow-hidden bg-white dark:bg-slate-950 transition-colors">
        {blockedToast ? (
          <div className="fixed top-4 right-4 z-[120] rounded-2xl border border-rose-200/80 bg-rose-50/95 px-4 py-2 text-sm font-semibold text-rose-700 shadow-soft backdrop-blur dark:border-rose-900/60 dark:bg-rose-950/70 dark:text-rose-200">
            {blockedToast}
          </div>
        ) : null}
        {(copiedDay || copiedEntry) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/95 px-4 py-2.5 shadow-lg backdrop-blur dark:border-sky-800/50 dark:bg-sky-950/80">
            <Icon name="clipboard" className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
              {copiedEntry ? "Clicca su uno slot vuoto per incollare" : "Clicca un giorno per incollare"}
            </span>
            <span className="w-px h-4 bg-sky-200 dark:bg-sky-700" />
            <button type="button" onClick={handleCancelPaste} className="text-sm font-semibold text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-200 transition-colors">
              Annulla
              <span className="ml-1.5 text-[10px] font-normal text-sky-400 dark:text-sky-600">Esc</span>
            </button>
          </div>
        )}
        {savedToast ? (
          <div className={`fixed ${(copiedDay || copiedEntry) ? "bottom-20" : "bottom-6"} left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/95 px-4 py-2.5 shadow-lg backdrop-blur dark:border-emerald-800/50 dark:bg-emerald-950/80`}>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Salvato</span>
          </div>
        ) : null}
        {(hasUndo || hasRedo) && (
          <div className="fixed bottom-6 right-6 z-[120]">
            {showHistory && (
              <div className="mb-2 w-56 rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur dark:border-slate-700/50 dark:bg-slate-800/95 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {undoHistory.length === 0 && redoHistory.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 text-center">Nessuna azione</div>
                  ) : (
                    <>
                      {undoHistory.map((label, i) => (
                        <div key={`u${i}`} className={`px-4 py-1.5 text-sm truncate ${i === 0 ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                          {label}
                        </div>
                      ))}
                      <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-y border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
                        — ora —
                      </div>
                      {redoHistory.map((label, i) => (
                        <div key={`r${i}`} className="px-4 py-1.5 text-sm text-slate-400 dark:text-slate-500 truncate italic">
                          {label}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur dark:border-slate-700/50 dark:bg-slate-800/95 overflow-hidden">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasUndo}
                title={undoLabel ? `Annulla: ${undoLabel} (Ctrl+Z)` : "Niente da annullare"}
                className="p-3 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
              >
                <Icon name="undo" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(h => !h)}
                title="Cronologia azioni"
                className={`p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${showHistory ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`}
              >
                <Icon name="history" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!hasRedo}
                title={redoLabel ? `Ripristina: ${redoLabel} (Ctrl+Y)` : "Niente da ripristinare"}
                className="p-3 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
              >
                <Icon name="redo" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        )}
        {/* Sidebar: bottom on mobile, left on desktop */}
        <nav className="shrink-0 flex lg:flex-col items-center justify-between lg:w-16 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 z-50 group px-2 lg:px-0 py-2 lg:py-0 overflow-visible relative shadow-soft dark:shadow-none transition-all duration-300">

          {/* Top */}
          <div className="flex lg:flex-col items-center w-full lg:pt-4 space-x-2 lg:space-x-0 lg:space-y-1">
            <SidebarBtn icon="search" label="Cerca nello storico" onClick={() => setSearchOpen(true)} />
          </div>

          {/* Middle */}
          <div className="flex flex-1 lg:flex-none justify-center lg:flex-col items-center w-full lg:mt-auto lg:mb-auto space-x-2 lg:space-x-0 lg:space-y-1 px-4 lg:px-0">
            {viewMode !== "projects" && (
              <>
                <SidebarBtn
                  icon="plus"
                  label="Nuovo Task"
                  onClick={() => openEditor(activeDate, null)}
                  accent={true}
                />
                <div className="hidden lg:block w-8 h-px bg-slate-200 dark:bg-slate-700 my-1" />
              </>
            )}
            <SidebarBtn
              icon="day"
              label="Vista Giorno"
              onClick={() => setViewMode("day")}
              isActive={viewMode === "day"}
            />
            <SidebarBtn
              icon="week"
              label="Vista Sett."
              onClick={() => setViewMode("week")}
              isActive={viewMode === "week"}
            />
            <SidebarBtn
              icon="calendar"
              label="Vista Mese"
              onClick={() => setViewMode("month")}
              isActive={viewMode === "month"}
            />
            <div className="hidden lg:block w-8 h-px bg-slate-200 dark:bg-slate-700 my-1" />
            <SidebarBtn
              icon="briefcase"
              label="Progetti"
              onClick={() => setViewMode("projects")}
              accent={viewMode !== "projects"}
              isActive={viewMode === "projects"}
            />
          </div>

          {/* Bottom */}
          <div className="flex lg:flex-col items-center w-full lg:pb-4">
            <SidebarBtn icon="settings" label="Impostazioni" onClick={() => setSettingsOpen(true)} />

            {!hasDesktopBridge && (
              <button
                type="button"
                onClick={backupFileHandle ? () => setShowBackupConfirm(true) : (supportsAutoBackup ? enableAutoBackup : undefined)}
                disabled={!supportsAutoBackup && !backupFileHandle}
                className={`relative flex items-center justify-center w-full p-3 lg:p-4 transition-colors rounded-2xl lg:rounded-none group/btn overflow-visible ${!supportsAutoBackup && !backupFileHandle ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"}`}
                title={backupFileHandle ? "Backup automatico attivo — clicca per disattivare" : supportsAutoBackup ? "Backup automatico non attivo — clicca per attivare" : "Backup automatico non supportato dal browser"}
              >
                <Icon
                  name={backupFileHandle ? "check" : "upload"}
                  className={`shrink-0 transition-transform duration-200 group-hover/btn:scale-110 ${backupFileHandle ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}
                />
                {!backupFileHandle && supportsAutoBackup && (
                  <span className="absolute top-2 right-2 lg:top-3 lg:right-3 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
                )}
                <span className="hidden lg:block absolute left-full ml-3 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all transform translate-x-1 group-hover/btn:translate-x-0 font-bold text-[11px] uppercase tracking-widest text-white bg-slate-900/90 dark:bg-slate-700/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl z-[100] pointer-events-none before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-900/90 dark:before:border-r-slate-700/95">
                  {backupFileHandle ? "Backup attivo" : "Backup non attivo"}
                </span>
              </button>
            )}

          </div>
        </nav>

        <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-6 lg:px-6 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <main className={`${mainLayoutClass} lg:flex-1 lg:min-h-0 lg:items-stretch`}>
              {viewMode === "month" && (
                <CalendarGrid
                  year={year}
                  month={month}
                  gridDates={gridDates}
                  monthDataByDate={monthDataByDate}
                  onDayClick={copiedDay ? handlePasteDay : openDayFromMonth}
                  visibleFilter={summaryHoverFilter || summaryFixedFilter}
                  onToggleLocation={handleToggleLocation}
                  pasteMode={!!copiedDay}
                  onApplyRecurring={handleApplyRecurring}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  activeDate={activeDate}
                  monthDataByDate={monthDataByDate}
                  onOpenSlot={({ date, start, end, slot }) => {
                    if (copiedEntryRef.current && start !== undefined) {
                      handlePasteEntry(date, start);
                      return;
                    }
                    setActiveDate(date);
                    if (start !== undefined && end !== undefined) {
                      openEditor(date, { start, end });
                    } else {
                      openEditor(date, slot);
                    }
                  }}
                  onMoveTask={onMoveTask}
                  onResizeTask={onResizeTask}
                  onDeleteSlot={handleSlotDeletion}
                  goPrevWeek={() => {
                    setActiveDate(prev => {
                      const next = new Date(prev);
                      next.setDate(next.getDate() - 7);
                      return next;
                    });
                  }}
                  goNextWeek={() => {
                    setActiveDate(prev => {
                      const next = new Date(prev);
                      next.setDate(next.getDate() + 7);
                      return next;
                    });
                  }}
                  goToday={goTodayDay}
                  onToggleLocation={handleToggleLocation}
                  onCopyDay={handleCopyDay}
                  pasteMode={!!copiedDay}
                  onPasteDay={handlePasteDay}
                  onCopyEntry={handleCopyEntry}
                />
              )}
              {viewMode === "day" && (
                <>
                  <DayView
                    date={activeDate}
                    dayData={dayData}
                    onOpenSlot={(slot) => {
                      if (copiedEntryRef.current && slot?.start !== undefined) {
                        handlePasteEntry(activeDate, slot.start);
                        return;
                      }
                      openEditor(activeDate, slot);
                    }}
                    onMoveTask={(args) => onMoveTask(activeDate, args)}
                    onResizeTask={(args) => onResizeTask(activeDate, args)}
                    onDeleteSlot={(args) => handleSlotDeletion(activeDate, args)}
                    onPrevDay={goPrevDay}
                    onNextDay={goNextDay}
                    onToday={goTodayDay}
                    onGoToMonth={() => setViewMode("month")}
                    onToggleLocation={handleToggleLocation}
                    onCopyDay={() => handleCopyDay(activeDate)}
                    pasteMode={!!copiedDay}
                    onPasteDay={() => handlePasteDay(activeDate)}
                    onCopyEntry={handleCopyEntry}
                  />
                  {isToday && settings.showTodo !== false && (
                    <TodoView
                      isEmbedded
                      availableProjects={clientNames}
                      availableTags={settings.todoTags}
                      onAddGlobalTodoTag={(newTag) => {
                        setSettings(prev => {
                          const tags = prev.todoTags || [];
                          if (tags.some(t => t.toLowerCase() === newTag.toLowerCase())) return prev;
                          return { ...prev, todoTags: [...tags, newTag] };
                        });
                      }}
                    />
                  )}
                </>
              )}

              {viewMode === "month" ? (
                <aside className="space-y-4 flex flex-col lg:h-full lg:overflow-hidden">
                  <div className="shrink-0">
                    <Header
                      year={year}
                      month={month}
                      prevMonth={prevMonth}
                      nextMonth={nextMonth}
                      goToday={goToday}
                      onFillMonth={settings.recurringTasks?.length > 0 ? handleFillMonth : undefined}
                    />
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl pb-2">
                    <SummaryPanel
                      year={year}
                      monthIndex0={month}
                      data={data}
                      onHoverFilterChange={setSummaryHoverFilter}
                      activeFilter={summaryHoverFilter || summaryFixedFilter}
                      fixedFilter={summaryFixedFilter}
                      onFixedFilterChange={setSummaryFixedFilter}
                    />
                  </div>
                </aside>
              ) : null}

              {viewMode === "projects" && (
                <ProjectView
                  clientNames={clientNames}
                  allPeople={allPeople}
                  onProjectsChange={() => setProjectsVersion(v => v + 1)}
                />
              )}
            </main>
          </div>
        </div>

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          hasDesktopBridge={hasDesktopBridge}
          settings={settings}
          setSettings={setSettings}
          settingsStatus={settingsStatus}
          desktopBackupPath={desktopBackupPath}
          pickDesktopBackupDir={pickDesktopBackupDir}
          useDefaultDesktopBackupDir={useDefaultDesktopBackupDir}
          clientNames={clientNames}
          exportAll={exportAll}
          onImportSuccess={handleImportSuccess}
          backupFileHandle={backupFileHandle}
          backupStatus={backupStatus}
          supportsAutoBackup={supportsAutoBackup}
          enableAutoBackup={enableAutoBackup}
          onDisableAutoBackup={() => setShowBackupConfirm(true)}
        />

        <Modal open={editorOpen} onClose={closeEditor} className="max-w-2xl lg:max-w-4xl">
          {selectedDate ? (
            <Editor
              date={selectedDate}
              initialSlot={selectedSlot}
              initialRange={selectedRange}
              existingEntries={existingEntries}
              onSave={(entries) => {
                const prev = monthDataByDate[ymd(selectedDate)];
                const prevSlots = Object.keys(prev?.hours || {}).length;
                const newSlots = Object.keys(entries.hours || {}).length;
                const prevHalf = !!(prev?.AM || prev?.PM);
                const newHalf = !!(entries.AM || entries.PM);
                let saveLabel = "Modifica task";
                if (!prev || (!prev.AM && !prev.PM && prevSlots === 0)) {
                  saveLabel = "Crea task";
                } else if (newSlots > prevSlots || (!prevHalf && newHalf)) {
                  saveLabel = "Aggiungi task";
                } else if (newSlots < prevSlots || (prevHalf && !newHalf)) {
                  saveLabel = "Rimuovi task";
                }
                upsertDay(selectedDate, entries, saveLabel);
                closeEditor();
              }}
              onDeleteDay={() => {
                deleteDay(selectedDate, "Elimina giorno");
                closeEditor();
              }}
              topClients={topMonthClients}
              allClients={clientNames}
              allPeople={allPeople}
              onSavePeople={(updatedPeople) => {
                savePeople(updatedPeople);
                setAllPeople(updatedPeople);
              }}
            />
          ) : null}
        </Modal>

        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          allPeople={allPeople}
          allClients={clientNames}
          settings={settings}
          filters={searchFilters}
          setFilters={setSearchFilters}
          onSelectDate={(date, rawSlots) => {
            // Go to the month containing this date
            setMonthYear(date.getFullYear(), date.getMonth());
            // And open the day directly
            openDayFromMonth(date);

            if (rawSlots && rawSlots.length > 0) {
              // Filter out AM/PM from exact hour ranges if present, for more granular opening
              const hourSlots = rawSlots.filter(s => s.includes(":"));
              if (hourSlots.length > 0) {
                const mins = hourSlots.map(s => {
                  const [h, m] = s.split(":").map(Number);
                  return h * 60 + m;
                }).sort((a, b) => a - b);

                const start = mins[0];
                const end = mins[mins.length - 1] + 30; // Add 30 minutes for the last slot
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => openEditor(date, { start, end }), 10);
              } else {
                // only AM or PM
                // we can leave editor's fallback logic by passing null, but we forcefully open it
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => openEditor(date), 10);
              }
            } else {
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = setTimeout(() => openEditor(date), 10);
            }
          }}
        />

        <Modal
          open={showBackupConfirm}
          title="Disattivare Backup Automatico?"
          onClose={() => setShowBackupConfirm(false)}
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Sei sicuro di voler disattivare il salvataggio automatico? I tuoi dati non verranno più sincronizzati periodicamente sul file selezionato.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowBackupConfirm(false)}
              >
                Annulla
              </Button>
              <Button
                className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                onClick={() => {
                  disableAutoBackup();
                  setShowBackupConfirm(false);
                }}
              >
                Disattiva
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SettingsContext.Provider>
  );
}









