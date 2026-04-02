import { useEffect, useMemo, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayView } from "./components/DayView";
import { WeekView } from "./components/WeekView";
import { SearchModal } from "./components/SearchModal";
import { TodoView } from "./components/TodoView";
import { Button, Icon, Modal } from "./components/ui";
import { useCalendarData } from "./hooks/useCalendarData";
import { useBackupSync } from "./hooks/useBackupSync";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useUIState } from "./hooks/useUIState";
import { SettingsContext } from "./contexts/SettingsContext";
import { ymd } from "./utils/date";
import { exportAll, listStoredClients, listStoredPeople, savePeople } from "./services/storage";
import { LOCATION_TYPES } from "./domain/tasks";

function SidebarBtn({ icon, label, onClick, disabled, activeClass = "", isActive = false }) {
  const activeBtnClass = isActive ? "bg-slate-100 dark:bg-slate-800" : "";
  const iconColor = activeClass ? activeClass : (isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-slate-300");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center w-full p-3 lg:p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 lg:rounded-none rounded-2xl group/btn overflow-visible ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${activeBtnClass}`}
    >
      <Icon name={icon} className={`shrink-0 transition-transform duration-200 group-hover/btn:scale-110 ${iconColor}`} />
      
      {/* Floating Tooltip */}
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

  const { onMoveTask, onResizeTask, handleSlotDeletion, blockedToast } = useTaskOperations({ monthDataByDate, upsertDay });

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
  } = useUIState({ settings, setMonthYear });

  // Sincronizza mese calendario con la data attiva nelle viste settimana/giorno
  useEffect(() => {
    if (viewMode === "month") return;
    if (activeDate.getFullYear() === year && activeDate.getMonth() === month) return;
    setMonthYear(activeDate.getFullYear(), activeDate.getMonth());
  }, [viewMode, activeDate, year, month, setMonthYear]);

  function handleImportSuccess() {
    reloadFromStorage();
  }

  function toggleTheme() {
    setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;
  // listStoredClients scans all months in localStorage, not just the current one —
  // re-derive whenever current month data changes (covers both saves and post-import reload).
  const clientNames = useMemo(() => listStoredClients(), [data]);

  const dayKey = ymd(activeDate);
  const dayData = monthDataByDate[dayKey] || null;

  function handleToggleLocation(date) {
    const key = ymd(date);
    const existing = monthDataByDate[key] || {};
    const current = existing.location || LOCATION_TYPES.REMOTE;
    let next;
    if (current === LOCATION_TYPES.REMOTE) next = LOCATION_TYPES.OFFICE;
    else if (current === LOCATION_TYPES.OFFICE) next = LOCATION_TYPES.CLIENT;
    else next = LOCATION_TYPES.REMOTE;

    upsertDay(date, { ...existing, location: next });
  }

  const mainLayoutClass = viewMode === "month"
    ? "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5"
    : viewMode === "day"
      ? "grid grid-cols-1 lg:grid-cols-2 gap-5"
      : "grid grid-cols-1 gap-5";

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
    <div className="min-h-screen lg:h-screen flex flex-col-reverse lg:flex-row overflow-hidden bg-white dark:bg-slate-950 transition-colors">
      {blockedToast ? (
        <div className="fixed top-4 right-4 z-[120] rounded-2xl border border-rose-200/80 bg-rose-50/95 px-4 py-2 text-sm font-semibold text-rose-700 shadow-soft backdrop-blur dark:border-rose-900/60 dark:bg-rose-950/70 dark:text-rose-200">
          {blockedToast}
        </div>
      ) : null}      
      {/* Sidebar: bottom on mobile, left on desktop */}
      <nav className="shrink-0 flex lg:flex-col items-center justify-between lg:w-16 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 z-50 group px-2 lg:px-0 py-2 lg:py-0 overflow-visible relative shadow-soft dark:shadow-none transition-all duration-300">
        
        {/* Top */}
        <div className="flex lg:flex-col items-center w-full lg:pt-4 space-x-2 lg:space-x-0 lg:space-y-1">
           <SidebarBtn icon="search" label="Cerca nello storico" onClick={() => setSearchOpen(true)} />
           <SidebarBtn 
              icon="list-check" 
              label="DA FARE" 
              onClick={() => setViewMode("day")} 
              isActive={viewMode === "day" && activeDate} // Just an example, maybe just isActive={false} if we want it to be a pure shortcut
           />
        </div>
        
        {/* Middle */}
        <div className="flex flex-1 lg:flex-none justify-center lg:flex-col items-center w-full lg:mt-auto lg:mb-auto space-x-2 lg:space-x-0 lg:space-y-1 px-4 lg:px-0">
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
        </div>

        {/* Bottom */}
        <div className="flex lg:flex-col items-center w-full lg:pb-4">
           <SidebarBtn icon={settings.theme === "dark" ? "sun" : "moon"} label="Cambia Tema" onClick={toggleTheme} />
           <SidebarBtn icon="settings" label="Impostazioni" onClick={() => setSettingsOpen(true)} />
           
            {!hasDesktopBridge ? (
              <SidebarBtn 
                icon={backupFileHandle ? "check" : "upload"} 
                label={backupFileHandle ? "Backup attivo" : "Backup auto"} 
                onClick={backupFileHandle ? () => setShowBackupConfirm(true) : enableAutoBackup}
                disabled={!supportsAutoBackup && !backupFileHandle}
                activeClass={backupFileHandle ? "text-emerald-600 dark:text-emerald-500" : ""}
              />
           ) : null}

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
              onDayClick={openDayFromMonth}
              visibleFilter={summaryHoverFilter || summaryFixedFilter}
              onToggleLocation={handleToggleLocation}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              activeDate={activeDate}
              monthDataByDate={monthDataByDate}
              onOpenSlot={({ date, start, end, slot }) => {
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
            />
          )}
          {viewMode === "day" && (
            <>
              <DayView
                date={activeDate}
                dayData={dayData}
                onOpenSlot={(slot) => openEditor(activeDate, slot)}
                onMoveTask={(args) => onMoveTask(activeDate, args)}
                onResizeTask={(args) => onResizeTask(activeDate, args)}
                onDeleteSlot={(args) => handleSlotDeletion(activeDate, args)}
                onPrevDay={goPrevDay}
                onNextDay={goNextDay}
                onToday={goTodayDay}
                onToggleLocation={handleToggleLocation}
              />
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
      />

      <Modal open={editorOpen} onClose={closeEditor}>
        {selectedDate ? (
          <Editor
            date={selectedDate}
            initialSlot={selectedSlot}
            initialRange={selectedRange}
            existingEntries={existingEntries}
            onSave={(entries) => {
              upsertDay(selectedDate, entries);
              closeEditor();
            }}
            onDeleteDay={() => {
              deleteDay(selectedDate);
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
                 }).sort((a,b) => a-b);
                 
                 const start = mins[0];
                 const end = mins[mins.length - 1] + 30; // Add 30 minutes for the last slot
                 setTimeout(() => openEditor(date, { start, end }), 10);
               } else {
                 // only AM or PM
                 // we can leave editor's fallback logic by passing null, but we forcefully open it
                 setTimeout(() => openEditor(date), 10);
               }
             } else {
               setTimeout(() => openEditor(date), 10);
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









