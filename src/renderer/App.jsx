import { useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { Modal } from "./components/ui";
import { TASK_TYPES, badgeStyle } from "./domain/tasks";
import { useCalendarData } from "./hooks/useCalendarData";
import { useBackupSync } from "./hooks/useBackupSync";
import { ymd } from "./utils/date";
import { exportAll } from "./services/storage";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function openEditor(date, slot = null) {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Header
          year={year}
          month={month}
          settings={settings}
          setSettings={setSettings}
          hasDesktopBridge={hasDesktopBridge}
          backupFileHandle={backupFileHandle}
          supportsAutoBackup={supportsAutoBackup}
          enableAutoBackup={enableAutoBackup}
          disableAutoBackup={disableAutoBackup}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          goToday={goToday}
          openSettings={() => setSettingsOpen(true)}
          exportAll={exportAll}
          onImportSuccess={() => {
            // Force a reload of data from localStorage by resetting month
            const d = new Date(year, month, 1);
            setData(null); // Triggers re-render if needed, but goToday is safer
            goToday();
          }}
        />

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <CalendarGrid
            year={year}
            month={month}
            gridDates={gridDates}
            monthDataByDate={monthDataByDate}
            openEditor={openEditor}
          />

          <aside className="space-y-4">
            <SummaryPanel year={year} monthIndex0={month} data={data} />

            <div className="rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur p-4 shadow-soft dark:shadow-soft-dark dark:border-slate-700/50 dark:bg-slate-800/80">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Legenda</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TASK_TYPES.map((t) => (
                  <div key={t.id} className={"rounded-lg px-2 py-1 text-xs font-semibold " + badgeStyle(t.id)}>
                    {t.label}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Dati salvati in locale nel browser (localStorage). Fai Export ogni tanto per backup.
              </div>
              {!hasDesktopBridge ? (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {supportsAutoBackup ? backupStatus : "Backup auto su file non supportato da questo browser."}
                </div>
              ) : null}
              {hasDesktopBridge ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{desktopBackupStatus}</div> : null}
              {hasDesktopBridge && desktopBackupPath ? (
                <div className="mt-1 break-all text-[11px] text-slate-500 dark:text-slate-400">Percorso backup desktop: {desktopBackupPath}</div>
              ) : null}
            </div>
          </aside>
        </main>
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
      />

      <Modal open={editorOpen} title={selectedDate ? "Modifica giornata" : "Modifica"} onClose={closeEditor}>
        {selectedDate ? (
          <Editor
            date={selectedDate}
            initialSlot={selectedSlot}
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
          />
        ) : null}
      </Modal>
    </div>
  );
}
