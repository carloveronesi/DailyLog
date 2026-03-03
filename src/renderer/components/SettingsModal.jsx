import { useRef } from "react";
import { importAll } from "../services/storage";
import { Button, Icon, Modal } from "./ui";
import { getClientColor, normalizeClientKey, normalizeHexColor } from "../domain/tasks";

export function SettingsModal({
  open,
  onClose,
  hasDesktopBridge,
  settings,
  setSettings,
  settingsStatus,
  desktopBackupPath,
  pickDesktopBackupDir,
  useDefaultDesktopBackupDir,
  clientNames = [],
  exportAll,
  onImportSuccess,
}) {
  const fileInputRef = useRef(null);

  async function handleImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const count = await importAll(f);
      alert(`Import completato. Voci aggiornate: ${count}`);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      alert(`Import fallito: ${err?.message || err}`);
    } finally {
      e.target.value = "";
    }
  }

  function setClientColor(clientName, color) {
    const key = normalizeClientKey(clientName);
    const normalized = normalizeHexColor(color);
    if (!key || !normalized) return;

    setSettings((prev) => ({
      ...prev,
      clientColors: {
        ...(prev.clientColors || {}),
        [key]: normalized,
      },
    }));
  }

  function resetClientColor(clientName) {
    const key = normalizeClientKey(clientName);
    if (!key) return;

    setSettings((prev) => {
      const nextColors = { ...(prev.clientColors || {}) };
      delete nextColors[key];
      return {
        ...prev,
        clientColors: nextColors,
      };
    });
  }

  return (
    <Modal open={open} title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Qui puoi configurare preferenze dell&apos;app, inclusi colori cliente e backup desktop.
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Colori clienti</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ogni cliente ha un colore automatico. Puoi personalizzarlo qui.
          </div>
          {clientNames.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Nessun cliente trovato nei dati salvati.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {clientNames.map((clientName) => {
                const key = normalizeClientKey(clientName);
                const hasCustom = Boolean(normalizeHexColor(settings.clientColors?.[key]));
                const color = getClientColor(clientName, settings.clientColors);
                return (
                  <div
                    key={clientName}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/40"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: color }} />
                      <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="color"
                        className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800"
                        value={color}
                        onChange={(e) => setClientColor(clientName, e.target.value)}
                        aria-label={`Colore per ${clientName}`}
                      />
                      <Button
                        className="bg-white/95 border border-slate-200 text-slate-700 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs"
                        onClick={() => resetClientColor(clientName)}
                        type="button"
                        disabled={!hasCustom}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Import / Export</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Esporta tutti i dati in JSON oppure importa un backup esistente.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200" onClick={exportAll} type="button">
              <Icon name="download" className="mr-2" />
              Export
            </Button>
            <Button
              className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Icon name="upload" className="mr-2" />
              Import
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>

        {hasDesktopBridge ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Comportamento finestra</div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                  checked={Boolean(settings.minimizeToTrayOnMinimize)}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minimizeToTrayOnMinimize: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Quando minimizzo, nascondi la finestra e mostra l&apos;icona nella tray.
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Percorso salvataggi backup</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Se vuoto, viene usata la cartella predefinita in Documenti.</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs break-all text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                {settings.desktopBackupDir || "(predefinito: Documenti\\DailyLog\\backup)"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={pickDesktopBackupDir}
                  type="button"
                >
                  Scegli cartella
                </Button>
                <Button
                  className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={useDefaultDesktopBackupDir}
                  type="button"
                >
                  Usa predefinito
                </Button>
              </div>
            </div>
            {settingsStatus ? <div className="text-xs text-slate-500 dark:text-slate-400">{settingsStatus}</div> : null}
            {desktopBackupPath ? <div className="text-xs text-slate-500 break-all dark:text-slate-400">File backup: {desktopBackupPath}</div> : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
            Le impostazioni backup cartella sono disponibili solo nella versione desktop Electron.
          </div>
        )}

        <div className="pt-2">
          <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200" onClick={onClose} type="button">
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
