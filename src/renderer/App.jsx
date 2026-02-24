import { useMemo, useState } from "react";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Header } from "./components/Header";
import { CalendarGrid } from "./components/CalendarGrid";
import { Modal } from "./components/ui";
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
  const clientNames = useMemo(() => listStoredClients(), [data, year, month]);

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
            clientColors={settings.clientColors}
          />

          <aside className="space-y-4">
            <SummaryPanel year={year} monthIndex0={month} data={data} clientColors={settings.clientColors} />
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
        clientNames={clientNames}
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
