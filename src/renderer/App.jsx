import { useEffect, useMemo, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayView } from "./components/DayView";
import { WeekView } from "./components/WeekView";
import { SearchModal } from "./components/SearchModal";
import { Button, Icon, Modal } from "./components/ui";
import { useCalendarData } from "./hooks/useCalendarData";
import { useBackupSync } from "./hooks/useBackupSync";
import { ymd } from "./utils/date";
import { exportAll, listStoredClients } from "./services/storage";
import { hourKey, WORK_SLOTS, SLOT_MINUTES } from "./domain/tasks";

function SidebarBtn({ icon, label, onClick, disabled, activeClass = "", isActive = false }) {
  const activeBtnClass = isActive ? "bg-slate-100 dark:bg-slate-800" : "";
  const iconColor = activeClass ? activeClass : (isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-700 dark:text-slate-300");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`relative flex items-center justify-center lg:justify-start w-full p-3 lg:px-5 lg:py-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 lg:rounded-none rounded-2xl group/btn overflow-hidden ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${activeBtnClass}`}
    >
      <Icon name={icon} className={`shrink-0 transition-transform duration-200 group-hover/btn:scale-110 ${iconColor}`} />
      <span className="hidden lg:block absolute left-14 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm text-slate-700 dark:text-slate-300 pointer-events-none bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-md shadow-sm z-[100]">
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

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [summaryHoverFilter, setSummaryHoverFilter] = useState(null);
  const [summaryFixedFilter, setSummaryFixedFilter] = useState(null);
  const [viewMode, setViewMode] = useState("day");
  const [activeDate, setActiveDate] = useState(today);

  useEffect(() => {
    if (viewMode !== "day") return;
    if (activeDate.getFullYear() === year && activeDate.getMonth() === month) return;
    setMonthYear(activeDate.getFullYear(), activeDate.getMonth());
  }, [viewMode, activeDate, year, month, setMonthYear]);

  function openEditor(date, slotOrRange = null) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedRange(null);
    if (slotOrRange && typeof slotOrRange === "object" && slotOrRange.start !== undefined) {
      setSelectedRange(slotOrRange);
    } else {
      setSelectedSlot(slotOrRange);
    }
    setActiveDate(date);
    setEditorOpen(true);
  }

  function openDayFromMonth(date) {
    setActiveDate(date);
    setViewMode("day");
  }

  function closeEditor() {
    setEditorOpen(false);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedRange(null);
  }

  function handleImportSuccess() {
    // Force a reload of data from localStorage after import.
    // Use a small delay to ensure all storage writes are completed
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  function toggleTheme() {
    setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }

  function goPrevDay() {
    setActiveDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goNextDay() {
    setActiveDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function goTodayDay() {
    const now = new Date();
    setActiveDate(now);
    setMonthYear(now.getFullYear(), now.getMonth());
  }

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;
  const clientNames = useMemo(() => listStoredClients(), [data, year, month]);

  const dayKey = ymd(activeDate);
  const dayData = monthDataByDate[dayKey] || null;

  function onMoveTask({ start, end, newStart }) {
    if (!dayData?.hours) return;
    const duration = end - start;
    const newEnd = newStart + duration;

    // We only support moving tasks that stay within hour blocks (not AM/PM full blocks)
    // and within the valid work slots
    if (newStart < WORK_SLOTS[0] || newEnd > WORK_SLOTS[WORK_SLOTS.length - 1] + SLOT_MINUTES) return;

    const entryToMove = dayData.hours[hourKey(start)];
    if (!entryToMove) return;

    const nextHours = { ...dayData.hours };

    // Clear old slots
    for (let m = start; m < end; m += SLOT_MINUTES) {
      delete nextHours[hourKey(m)];
    }

    // Fill new slots
    for (let m = newStart; m < newEnd; m += SLOT_MINUTES) {
      nextHours[hourKey(m)] = entryToMove;
    }

    upsertDay(activeDate, {
      AM: dayData.AM || null,
      PM: dayData.PM || null,
      hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
    });
  }

  function onResizeTask({ start, end, newStart, newEnd }) {
    if (!dayData?.hours) return;
    const entryToResize = dayData.hours[hourKey(start)];
    if (!entryToResize) return;

    // Use existing values if not provided
    const finalStart = newStart !== undefined ? newStart : start;
    const finalEnd = newEnd !== undefined ? newEnd : end;

    // Boundary check
    if (finalEnd <= finalStart || finalStart < WORK_SLOTS[0] || finalEnd > WORK_SLOTS[WORK_SLOTS.length - 1] + SLOT_MINUTES) return;

    const nextHours = { ...dayData.hours };

    // Clear old slots
    for (let m = start; m < end; m += SLOT_MINUTES) {
      delete nextHours[hourKey(m)];
    }

    // Fill new slots
    for (let m = finalStart; m < finalEnd; m += SLOT_MINUTES) {
      nextHours[hourKey(m)] = entryToResize;
    }

    upsertDay(activeDate, {
      AM: dayData.AM || null,
      PM: dayData.PM || null,
      hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
    });
  }

  const mainLayoutClass = viewMode === "month"
    ? "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5"
    : "grid grid-cols-1 gap-5";

  return (
    <div className="min-h-screen lg:h-screen flex flex-col-reverse lg:flex-row overflow-hidden bg-white dark:bg-slate-950 transition-colors">
      
      {/* Sidebar: bottom on mobile, left on desktop */}
      <nav className="shrink-0 flex lg:flex-col items-center justify-between lg:w-16 lg:hover:w-48 transition-all duration-300 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 z-50 group px-2 lg:px-0 py-2 lg:py-0 overflow-visible lg:overflow-hidden relative shadow-soft dark:shadow-none">
        
        {/* Top */}
        <div className="flex lg:flex-col items-center w-full lg:pt-4">
           <SidebarBtn icon="search" label="Cerca nello storico" onClick={() => setSearchOpen(true)} />
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
                onClick={backupFileHandle ? disableAutoBackup : enableAutoBackup}
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
              clientColors={settings.clientColors}
              visibleFilter={summaryHoverFilter || summaryFixedFilter}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              activeDate={activeDate}
              monthDataByDate={monthDataByDate}
              clientColors={settings.clientColors}
              onOpenSlot={({ date, start, end, slot }) => {
                 setActiveDate(date);
                 if (start !== undefined && end !== undefined) {
                    openEditor(date, { start, end });
                 } else {
                    openEditor(date, slot);
                 }
              }}
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
            />
          )}
          {viewMode === "day" && (
            <DayView
              date={activeDate}
              dayData={dayData}
              clientColors={settings.clientColors}
              onOpenSlot={(slot) => openEditor(activeDate, slot)}
              onMoveTask={onMoveTask}
              onResizeTask={onResizeTask}
              onDeleteSlot={({ start, end }) => {
                const key = ymd(activeDate);
                const existing = monthDataByDate[key];
                if (!existing?.hours) return;
                const nextHours = {};
                for (const [k, e] of Object.entries(existing.hours)) {
                  // keep slot if it's outside the deleted range
                  const [h, m] = k.split(":").map(Number);
                  const slotMin = h * 60 + m;
                  if (slotMin >= start && slotMin < end) continue;
                  nextHours[k] = e;
                }
                upsertDay(activeDate, {
                  AM: null,
                  PM: null,
                  hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
                });
              }}
              onPrevDay={goPrevDay}
              onNextDay={goNextDay}
              onToday={goTodayDay}
            />
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
                  clientColors={settings.clientColors}
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

      <Modal open={editorOpen} title={selectedDate ? "Task" : "Task"} onClose={closeEditor}>
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
            clientColors={settings.clientColors}
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
    </div>
  );
}
