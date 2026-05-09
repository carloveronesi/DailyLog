import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
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
import { useTodos } from "./hooks/useTodos";
import { useUIState } from "./hooks/useUIState";
import { SettingsContext, useWorkSlots } from "./contexts/SettingsContext";
import { ymd, sameYMD, dowMon0 } from "./utils/date";
import { exportAll, listStoredClients, listStoredPeople, savePeople, loadProjects } from "./services/storage";
import { LOCATION_TYPES, SLOT_MINUTES, hourKey } from "./domain/tasks";
import { matchesRecurringPattern } from "./domain/calendar";

function SidebarBtn({ icon, label, onClick, disabled, isActive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`relative flex flex-col items-center justify-center w-[60px] h-[52px] rounded-xl transition-all border-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        isActive
          ? "bg-white text-si-accent"
          : "bg-transparent text-si-gray hover:text-si-ink hover:bg-white/60"
      }`}
      style={isActive ? { boxShadow: "0 1px 2px rgba(40,40,80,0.06), 0 4px 12px rgba(40,40,80,0.08)" } : {}}
    >
      <Icon name={icon} className="w-5 h-5 shrink-0" />
      <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 leading-none">
        {label.split(" ")[0]}
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
    detailOpen, detailEntry, detailDate, detailStart, detailEnd, detailSlot,
    openDetail, closeDetail,
  } = useUIState({ settings, setMonthYear });

  const { todos, addTodo, updateTodo, deleteTodo, toggleDone } = useTodos();
  const pendingTodoCount = useMemo(() => todos.filter(t => !t.isDone).length, [todos]);

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
      if (e.key === "Escape" && detailOpen && !editorOpen && !settingsOpen && !searchOpen) {
        closeDetail();
        return;
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
  }, [editorOpen, settingsOpen, searchOpen, hasUndo, hasRedo, copiedDay, copiedEntry, detailOpen]);

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

  function navigate(view) {
    setViewMode(view);
    setSettingsOpen(false);
    closeEditor();
    closeDetail();
    setSearchOpen(false);
  }

  const isToday = sameYMD(activeDate, new Date());
  const showTodoPanel = settings.showTodo !== false;
  const mainLayoutClass = viewMode === "projects" || viewMode === "todo"
    ? "flex flex-col lg:flex-1 lg:min-h-0"
    : viewMode === "month"
      ? "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5"
      : viewMode === "day" && showTodoPanel
        ? "grid grid-cols-1 lg:grid-cols-2 gap-5"
        : "grid grid-cols-1 gap-5";

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className="min-h-screen lg:h-screen flex flex-col-reverse lg:flex-row overflow-hidden" style={{ background: "transparent" }}>
        {blockedToast ? (
          <div className="fixed top-4 right-4 z-[120] rounded-2xl border border-si-rose/20 bg-si-rose/5 px-4 py-2 text-sm font-semibold text-si-rose shadow-si backdrop-blur">
            {blockedToast}
          </div>
        ) : null}
        {(copiedDay || copiedEntry) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 rounded-2xl border border-si-accentSoft bg-si-accentBg px-4 py-2.5 shadow-si backdrop-blur">
            <Icon name="clipboard" className="w-4 h-4 text-si-accent shrink-0" />
            <span className="text-sm font-semibold text-si-accent">
              {copiedEntry ? "Clicca su uno slot vuoto per incollare" : "Clicca un giorno per incollare"}
            </span>
            <span className="w-px h-4 bg-si-accentSoft" />
            <button type="button" onClick={handleCancelPaste} className="text-sm font-semibold text-si-accent hover:text-si-accentDark transition-colors">
              Annulla
              <span className="ml-1.5 text-[10px] font-normal text-si-gray">Esc</span>
            </button>
          </div>
        )}
        {savedToast ? (
          <div className={`fixed ${(copiedDay || copiedEntry) ? "bottom-20" : "bottom-6"} left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 rounded-2xl border border-si-success/20 bg-si-success/8 px-4 py-2.5 shadow-si backdrop-blur`}>
            <span className="text-sm font-semibold text-si-success">Salvato</span>
          </div>
        ) : null}
        {(hasUndo || hasRedo) && (
          <div className="fixed bottom-6 right-6 z-[120]">
            {showHistory && (
              <div className="mb-2 w-56 rounded-2xl border border-si-border bg-si-surface shadow-si-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {undoHistory.length === 0 && redoHistory.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-si-grayLight text-center">Nessuna azione</div>
                  ) : (
                    <>
                      {undoHistory.map((label, i) => (
                        <div key={`u${i}`} className={`px-4 py-1.5 text-sm truncate ${i === 0 ? "font-semibold text-si-ink" : "text-si-gray"}`}>
                          {label}
                        </div>
                      ))}
                      <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-si-grayLight border-y border-si-border bg-si-muted">
                        — ora —
                      </div>
                      {redoHistory.map((label, i) => (
                        <div key={`r${i}`} className="px-4 py-1.5 text-sm text-si-grayLight truncate italic">
                          {label}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center rounded-2xl border border-si-border bg-si-surface shadow-si overflow-hidden">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasUndo}
                title={undoLabel ? `Annulla: ${undoLabel} (Ctrl+Z)` : "Niente da annullare"}
                className="p-3 transition-colors hover:bg-si-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="undo" className="w-4 h-4 text-si-inkSoft" />
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(h => !h)}
                title="Cronologia azioni"
                className={`p-3 transition-colors hover:bg-si-muted ${showHistory ? "text-si-accent" : "text-si-grayLight"}`}
              >
                <Icon name="history" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!hasRedo}
                title={redoLabel ? `Ripristina: ${redoLabel} (Ctrl+Y)` : "Niente da ripristinare"}
                className="p-3 transition-colors hover:bg-si-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="redo" className="w-4 h-4 text-si-inkSoft" />
              </button>
            </div>
          </div>
        )}
        {/* Sidebar: bottom on mobile, left on desktop */}
        <nav className="shrink-0 flex lg:flex-col items-center justify-between lg:w-[84px] z-50 px-2 lg:px-0 py-2 lg:py-4 overflow-visible relative border-t lg:border-t-0 border-si-border">

          {/* Logo (desktop only) */}
          <div
            className="hidden lg:flex items-center justify-center w-[44px] h-[44px] rounded-[14px] mb-3 shrink-0"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
          >
            <span className="text-white font-bold text-[18px] tracking-tight">D</span>
          </div>

          {/* Middle nav */}
          <div className="flex flex-1 lg:flex-none justify-center lg:flex-col items-center gap-1 px-2 lg:px-0">
            <SidebarBtn icon="day" label="Giorno" onClick={() => navigate("day")} isActive={viewMode === "day"} />
            <SidebarBtn icon="week" label="Settimana" onClick={() => navigate("week")} isActive={viewMode === "week"} />
            <SidebarBtn icon="calendar" label="Mese" onClick={() => navigate("month")} isActive={viewMode === "month"} />
            <div className="hidden lg:block w-8 h-px bg-si-border my-1" />
            <SidebarBtn icon="briefcase" label="Progetti" onClick={() => navigate("projects")} isActive={viewMode === "projects"} />
            <SidebarBtn icon="list-check" label="To-do" onClick={() => navigate("todo")} isActive={viewMode === "todo"} />
          </div>

          {/* Bottom */}
          <div className="flex lg:flex-col items-center gap-1">
            <SidebarBtn icon="search" label="Cerca" onClick={() => setSearchOpen(true)} />
            <SidebarBtn icon="settings" label="Impostazioni" onClick={() => setSettingsOpen(true)} />
            {!hasDesktopBridge && (
              <button
                type="button"
                onClick={backupFileHandle ? () => setShowBackupConfirm(true) : (supportsAutoBackup ? enableAutoBackup : undefined)}
                disabled={!supportsAutoBackup && !backupFileHandle}
                title={backupFileHandle ? "Backup automatico attivo" : supportsAutoBackup ? "Backup non attivo" : "Backup non supportato"}
                className={`flex flex-col items-center justify-center w-[60px] h-[52px] rounded-xl border-0 transition-all ${
                  !supportsAutoBackup && !backupFileHandle ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-white/60"
                }`}
              >
                <Icon
                  name={backupFileHandle ? "check" : "upload"}
                  className={`w-5 h-5 shrink-0 ${backupFileHandle ? "text-si-success" : "text-si-amber"}`}
                />
                {!backupFileHandle && supportsAutoBackup && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-si-amber animate-pulse" />
                )}
              </button>
            )}
          </div>
        </nav>

        <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto">
          <div className="w-full lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <Header
              view={viewMode}
              year={year}
              month={month}
              activeDate={activeDate}
              onPrev={prevMonth}
              onNext={nextMonth}
              onToday={goToday}
              onFillMonth={viewMode === "month" && (settings.recurringTasks?.length > 0) ? handleFillMonth : undefined}
              onNewTask={viewMode === "month" ? () => openEditor(activeDate, null) : undefined}
              pendingTodoCount={pendingTodoCount}
            />
            <main className={`px-4 pb-6 lg:px-6 ${mainLayoutClass} lg:flex-1 lg:min-h-0 lg:items-stretch`}>
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
                  onOpenTask={({ date, entry, start, end, slot }) => {
                    setActiveDate(date);
                    openDetail(date, entry, start, end, slot);
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
                  onNewTask={() => openEditor(activeDate, null)}
                  onToggleLocation={handleToggleLocation}
                  onCopyDay={handleCopyDay}
                  pasteMode={!!copiedDay}
                  onPasteDay={handlePasteDay}
                  onCopyEntry={handleCopyEntry}
                />
              )}
              {viewMode === "day" && (<>
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
                  onOpenTask={({ entry, start, end, slot }) => {
                    openDetail(activeDate, entry, start, end, slot);
                  }}
                  onMoveTask={(args) => onMoveTask(activeDate, args)}
                  onResizeTask={(args) => onResizeTask(activeDate, args)}
                  onDeleteSlot={(args) => handleSlotDeletion(activeDate, args)}
                  onPrevDay={goPrevDay}
                  onNextDay={goNextDay}
                  onToday={goTodayDay}
                  onNewTask={() => openEditor(activeDate, null)}
                  onGoToMonth={() => setViewMode("month")}
                  onToggleLocation={handleToggleLocation}
                  onCopyDay={() => handleCopyDay(activeDate)}
                  pasteMode={!!copiedDay}
                  onPasteDay={() => handlePasteDay(activeDate)}
                  onCopyEntry={handleCopyEntry}
                  pendingTodoCount={pendingTodoCount}
                  onGoToTodo={() => navigate("todo")}
                />
                {showTodoPanel && (
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
                    todos={todos}
                    addTodo={addTodo}
                    updateTodo={updateTodo}
                    deleteTodo={deleteTodo}
                    toggleDone={toggleDone}
                  />
                )}
              </>)}

              {viewMode === "month" ? (
                <aside className="flex flex-col lg:h-full lg:overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto pb-2">
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

              {viewMode === "todo" && (
                <TodoView
                  availableProjects={clientNames}
                  availableTags={settings.todoTags}
                  onAddGlobalTodoTag={(newTag) => {
                    setSettings(prev => {
                      const tags = prev.todoTags || [];
                      if (tags.some(t => t.toLowerCase() === newTag.toLowerCase())) return prev;
                      return { ...prev, todoTags: [...tags, newTag] };
                    });
                  }}
                  todos={todos}
                  addTodo={addTodo}
                  updateTodo={updateTodo}
                  deleteTodo={deleteTodo}
                  toggleDone={toggleDone}
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

        <Modal open={editorOpen} onClose={closeEditor} fullscreen>
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

        {detailOpen && detailEntry && (
          <TaskDetailPanel
            date={detailDate}
            entry={detailEntry}
            start={detailStart}
            end={detailEnd}
            slot={detailSlot}
            onClose={closeDetail}
            onEdit={() => {
              closeDetail();
              if (detailStart !== null && detailEnd !== null) {
                openEditor(detailDate, { start: detailStart, end: detailEnd });
              } else if (detailSlot) {
                openEditor(detailDate, detailSlot);
              } else {
                openEditor(detailDate);
              }
            }}
          />
        )}

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
            <p className="text-si-gray">
              Sei sicuro di voler disattivare il salvataggio automatico? I tuoi dati non verranno più sincronizzati periodicamente sul file selezionato.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="bg-si-muted border border-si-border text-si-ink hover:bg-si-border"
                onClick={() => setShowBackupConfirm(false)}
              >
                Annulla
              </Button>
              <Button
                className="bg-si-rose text-white hover:opacity-90"
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









