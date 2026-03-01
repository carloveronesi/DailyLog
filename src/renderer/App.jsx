import { useMemo, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { Button, Icon, Modal } from "./components/ui";
import { useCalendarData } from "./hooks/useCalendarData";
import { useBackupSync } from "./hooks/useBackupSync";
import { ymd } from "./utils/date";
import { exportAll, listStoredClients } from "./services/storage";

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
  const [summaryHoverFilter, setSummaryHoverFilter] = useState(null);
  const [summaryFixedFilter, setSummaryFixedFilter] = useState(null);

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

  function handleImportSuccess() {
    // Force a reload of data from localStorage after import.
    setData(null);
    goToday();
  }

  function toggleTheme() {
    setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;
  const clientNames = useMemo(() => listStoredClients(), [data, year, month]);

  return (
    <div className="min-h-screen lg:h-screen lg:flex lg:flex-col lg:overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 pb-3 lg:px-6 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 lg:flex-1 lg:min-h-0">
          <CalendarGrid
            year={year}
            month={month}
            gridDates={gridDates}
            monthDataByDate={monthDataByDate}
            openEditor={openEditor}
            clientColors={settings.clientColors}
            visibleFilter={summaryHoverFilter || summaryFixedFilter}
          />

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
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-soft backdrop-blur dark:border-slate-700/80 dark:bg-slate-800/90">
        <Button
          className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => setSettingsOpen(true)}
          type="button"
          title="Impostazioni"
        >
          <Icon name="settings" className="mr-2" />
          Settings
        </Button>

        <Button
          className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={toggleTheme}
          type="button"
          title="Cambia Tema"
        >
          <Icon name={settings.theme === "dark" ? "sun" : "moon"} />
        </Button>

        {!hasDesktopBridge ? (
          <Button
            className={
              backupFileHandle
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            }
            onClick={backupFileHandle ? disableAutoBackup : enableAutoBackup}
            type="button"
            title={backupFileHandle ? "Disattiva backup automatico su file" : "Collega file per backup automatico"}
            disabled={!supportsAutoBackup && !backupFileHandle}
          >
            {backupFileHandle ? "Backup attivo" : "Backup auto"}
          </Button>
        ) : null}
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
            clientColors={settings.clientColors}
          />
        ) : null}
      </Modal>
    </div>
  );
}
