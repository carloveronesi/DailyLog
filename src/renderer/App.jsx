import { useEffect, useMemo, useRef, useState } from "react";
import { DayCell } from "./components/DayCell";
import { Editor } from "./components/Editor";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryPanel } from "./components/SummaryPanel";
import { Button, Icon, Modal } from "./components/ui";
import { SLOT, TASK_TYPES, badgeStyle } from "./domain/tasks";
import { getDesktopBridge } from "./services/desktopBridge";
import {
  clearPersistedBackupHandle,
  collectExportData,
  ensureFilePermission,
  exportAll,
  importAll,
  loadMonthData,
  loadSettings,
  persistBackupHandle,
  restoreBackupHandle,
  saveMonthData,
  saveSettings,
  writeBackupToFile,
} from "./services/storage";
import { dowMon0, monthNameIT, ymd } from "./utils/date";

export default function App() {
  const today = new Date();
  const desktopBridge = getDesktopBridge();
  const hasDesktopBridge = Boolean(desktopBridge);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [data, setData] = useState(() => loadMonthData(year, month));
  const [settings, setSettings] = useState(() => loadSettings());

  const [selectedDate, setSelectedDate] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");
  const [backupFileHandle, setBackupFileHandle] = useState(null);
  const [backupStatus, setBackupStatus] = useState("Backup automatico non attivo");
  const [desktopBackupPath, setDesktopBackupPath] = useState("");
  const [desktopBackupStatus, setDesktopBackupStatus] = useState(
    hasDesktopBridge ? "Backup desktop in inizializzazione..." : ""
  );
  const fileInputRef = useRef(null);
  const supportsAutoBackup = typeof window.showSaveFilePicker === "function";
  const supportsHandlePersistence = supportsAutoBackup && typeof window.indexedDB !== "undefined";

  useEffect(() => {
    const loaded = loadMonthData(year, month);
    setData(loaded);
  }, [year, month]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Desktop app: sync minimize-to-tray preference with Electron main process
  useEffect(() => {
    if (!hasDesktopBridge || !desktopBridge?.setMinimizeToTray) return;
    desktopBridge.setMinimizeToTray(Boolean(settings.minimizeToTrayOnMinimize)).catch((err) => {
      setSettingsStatus(`Errore salvataggio setting tray: ${err?.message || err}`);
    });
  }, [desktopBridge, hasDesktopBridge, settings.minimizeToTrayOnMinimize]);

  // Persist on data change
  useEffect(() => {
    saveMonthData(year, month, data);
  }, [data, year, month]);

  // Desktop app: initialize auto-backup target path
  useEffect(() => {
    if (!hasDesktopBridge || !desktopBridge?.getAutoBackupPath) return;
    let cancelled = false;

    (async () => {
      try {
        const filePath = await desktopBridge.getAutoBackupPath(settings.desktopBackupDir);
        if (cancelled) return;
        setDesktopBackupPath(filePath || "");
      } catch (err) {
        if (!cancelled) {
          setDesktopBackupStatus(`Backup desktop non disponibile: ${err?.message || err}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [desktopBridge, hasDesktopBridge, settings.desktopBackupDir]);

  // Desktop app: write backup in configured desktop folder at every data change
  useEffect(() => {
    if (!hasDesktopBridge || !desktopBridge?.writeAutoBackup) return;
    let cancelled = false;

    (async () => {
      try {
        const payload = JSON.stringify(collectExportData(), null, 2);
        const result = await desktopBridge.writeAutoBackup(payload, settings.desktopBackupDir);
        if (cancelled) return;
        if (result?.filePath) setDesktopBackupPath(result.filePath);
        setDesktopBackupStatus(`Backup desktop aggiornato alle ${new Date().toLocaleTimeString("it-IT")}`);
      } catch (err) {
        if (!cancelled) {
          setDesktopBackupStatus(`Backup desktop in errore: ${err?.message || err}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [desktopBridge, hasDesktopBridge, data, year, month, settings.desktopBackupDir]);

  // Optional auto-backup on file
  useEffect(() => {
    if (hasDesktopBridge) return;
    if (!backupFileHandle) return;
    let cancelled = false;

    (async () => {
      try {
        const allowed = await ensureFilePermission(backupFileHandle);
        if (!allowed) throw new Error("permesso file negato");
        await writeBackupToFile(backupFileHandle);
        if (!cancelled) {
          const hhmmss = new Date().toLocaleTimeString("it-IT");
          setBackupStatus(`Backup aggiornato alle ${hhmmss}`);
        }
      } catch (err) {
        if (!cancelled) {
          setBackupStatus(`Backup in errore: ${err?.message || err}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasDesktopBridge, backupFileHandle, data, year, month]);

  // Restore persisted backup file handle across sessions
  useEffect(() => {
    if (hasDesktopBridge) return;
    if (!supportsHandlePersistence) return;
    let cancelled = false;

    (async () => {
      try {
        const handle = await restoreBackupHandle();
        if (!handle || cancelled) return;
        setBackupFileHandle(handle);
        setBackupStatus("Backup auto ripristinato");
      } catch (err) {
        if (!cancelled) {
          setBackupStatus(`Backup non ripristinato: ${err?.message || err}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasDesktopBridge, supportsHandlePersistence]);

  const gridDates = useMemo(() => {
    const first = new Date(year, month, 1);

    // start from Monday of the first week
    const startOffset = dowMon0(first); // 0..6
    const start = new Date(year, month, 1 - startOffset);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [year, month]);

  const monthDataByDate = data?.byDate || {};
  const topMonthClients = useMemo(() => {
    const countByClient = new Map();
    for (const dateKey of Object.keys(monthDataByDate)) {
      const day = monthDataByDate[dateKey];
      for (const s of [SLOT.AM, SLOT.PM]) {
        const e = day?.[s];
        if (!e || e.type !== "client") continue;
        const clientName = (e.client || "").trim();
        if (!clientName) continue;
        countByClient.set(clientName, (countByClient.get(clientName) || 0) + 1);
      }
    }

    return Array.from(countByClient.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
      .slice(0, 3)
      .map(([clientName]) => clientName);
  }, [monthDataByDate]);

  function openEditor(date) {
    setSelectedDate(date);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setSelectedDate(null);
  }

  function upsertDay(date, entries) {
    const key = ymd(date);
    setData((prev) => {
      const next = { ...prev, byDate: { ...(prev.byDate || {}) } };
      const normalized = {
        AM: entries.AM || null,
        PM: entries.PM || null,
      };
      // If both slots are null, delete day
      if (!normalized.AM && !normalized.PM) {
        delete next.byDate[key];
      } else {
        next.byDate[key] = normalized;
      }
      return next;
    });
    closeEditor();
  }

  function deleteDay(date) {
    const key = ymd(date);
    setData((prev) => {
      const next = { ...prev, byDate: { ...(prev.byDate || {}) } };
      delete next.byDate[key];
      return next;
    });
    closeEditor();
  }

  function prevMonth() {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function nextMonth() {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  async function handleImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const count = await importAll(f);
      alert(`Import completato. Voci aggiornate: ${count}`);
      // reload current
      setData(loadMonthData(year, month));
    } catch (err) {
      alert(`Import fallito: ${err?.message || err}`);
    } finally {
      e.target.value = "";
    }
  }

  async function enableAutoBackup() {
    if (!supportsAutoBackup) {
      alert("Browser non compatibile con salvataggio automatico su file. Usa Export manuale.");
      return;
    }

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `dailylog_backup_${new Date().toISOString().slice(0, 10)}.json`,
        types: [
          {
            description: "JSON backup",
            accept: { "application/json": [".json"] },
          },
        ],
      });

      const allowed = await ensureFilePermission(handle);
      if (!allowed) {
        alert("Permesso di scrittura non concesso.");
        return;
      }

      if (supportsHandlePersistence) {
        await persistBackupHandle(handle);
      }
      setBackupFileHandle(handle);
      await writeBackupToFile(handle);
      setBackupStatus(`Backup aggiornato alle ${new Date().toLocaleTimeString("it-IT")}`);
    } catch (err) {
      if (err?.name === "AbortError") return;
      alert(`Configurazione backup fallita: ${err?.message || err}`);
    }
  }

  async function disableAutoBackup() {
    if (supportsHandlePersistence) {
      try {
        await clearPersistedBackupHandle();
      } catch {
        // keep going: local toggle should still work
      }
    }
    setBackupFileHandle(null);
    setBackupStatus("Backup automatico non attivo");
  }

  async function pickDesktopBackupDir() {
    if (!hasDesktopBridge || !desktopBridge?.pickBackupDirectory) return;
    setSettingsStatus("");
    try {
      const selected = await desktopBridge.pickBackupDirectory(settings.desktopBackupDir);
      if (!selected) return;
      setSettings((prev) => ({ ...prev, desktopBackupDir: selected }));
      setSettingsStatus("Cartella backup aggiornata.");
    } catch (err) {
      setSettingsStatus(`Errore selezione cartella: ${err?.message || err}`);
    }
  }

  function useDefaultDesktopBackupDir() {
    setSettings((prev) => ({ ...prev, desktopBackupDir: "" }));
    setSettingsStatus("Ripristinato percorso predefinito.");
  }

  const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  const selectedKey = selectedDate ? ymd(selectedDate) : null;
  const existingEntries = selectedKey ? monthDataByDate[selectedKey] : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <header className="rounded-3xl border border-slate-200/90 bg-white/70 backdrop-blur px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">DailyLog</div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {monthNameIT(month)} {year}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white" onClick={prevMonth} type="button">
              <Icon name="chev-left" />
            </Button>
            <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white" onClick={nextMonth} type="button">
              <Icon name="chev-right" />
            </Button>
            <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white" onClick={goToday} type="button">
              Oggi
            </Button>

            <Button
              className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white"
              onClick={() => setSettingsOpen(true)}
              type="button"
              title="Impostazioni"
            >
              <Icon name="settings" className="mr-2" />
              Settings
            </Button>

            <div className="w-px h-8 bg-slate-200 mx-1" />

            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={exportAll} type="button" title="Esporta backup JSON">
              <Icon name="download" className="mr-2" />
              Export
            </Button>

            <Button
              className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white"
              onClick={() => fileInputRef.current?.click()}
              type="button"
              title="Importa backup JSON"
            >
              <Icon name="upload" className="mr-2" />
              Import
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />

            {!hasDesktopBridge ? (
              <Button
                className={
                  backupFileHandle
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-white/95 border border-slate-200 text-slate-800 hover:bg-white"
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
        </header>

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <section className="rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur p-5 shadow-soft">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((w) => (
                <div key={w} className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {w}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
              {gridDates.map((d) => {
                const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const key = ymd(d);
                const entries = monthDataByDate[key] || null;
                return (
                  <DayCell
                    key={key}
                    date={d}
                    isCurrentMonth={isCurrentMonth}
                    isWeekend={isWeekend}
                    entries={entries}
                    onClick={() => openEditor(d)}
                  />
                );
              })}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Weekend evidenziati in rosso. Click su un giorno per inserire o modificare (0.5 o 1 giornata).
            </div>
          </section>

          <aside className="space-y-4">
            <SummaryPanel year={year} monthIndex0={month} data={data} />

            <div className="rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur p-4 shadow-soft">
              <div className="text-sm font-semibold text-slate-700">Legenda</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TASK_TYPES.map((t) => (
                  <div key={t.id} className={"rounded-lg px-2 py-1 text-xs font-semibold " + badgeStyle(t.id)}>
                    {t.label}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Dati salvati in locale nel browser (localStorage). Fai Export ogni tanto per backup.
              </div>
              {!hasDesktopBridge ? (
                <div className="mt-2 text-xs text-slate-500">
                  {supportsAutoBackup ? backupStatus : "Backup auto su file non supportato da questo browser."}
                </div>
              ) : null}
              {hasDesktopBridge ? <div className="mt-2 text-xs text-slate-500">{desktopBackupStatus}</div> : null}
              {hasDesktopBridge && desktopBackupPath ? (
                <div className="mt-1 break-all text-[11px] text-slate-500">Percorso backup desktop: {desktopBackupPath}</div>
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
            existingEntries={existingEntries}
            onSave={(entries) => upsertDay(selectedDate, entries)}
            onDeleteDay={() => deleteDay(selectedDate)}
            topClients={topMonthClients}
          />
        ) : null}
      </Modal>
    </div>
  );
}
