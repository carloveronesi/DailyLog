import { Button, Modal } from "./ui";

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
}) {
  return (
    <Modal open={open} title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-600">
          Qui puoi configurare preferenze dell'app. Per ora c&apos;e solo il percorso backup desktop.
        </div>

        {hasDesktopBridge ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-800">Comportamento finestra</div>
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
                <span className="text-sm text-slate-700">
                  Quando minimizzo, nascondi la finestra e mostra l&apos;icona nella tray.
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-800">Percorso salvataggi backup</div>
              <div className="text-xs text-slate-500">Se vuoto, viene usata la cartella predefinita in Documenti.</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs break-all text-slate-700">
                {settings.desktopBackupDir || "(predefinito: Documenti\\DailyLog\\backup)"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white"
                  onClick={pickDesktopBackupDir}
                  type="button"
                >
                  Scegli cartella
                </Button>
                <Button
                  className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white"
                  onClick={useDefaultDesktopBackupDir}
                  type="button"
                >
                  Usa predefinito
                </Button>
              </div>
            </div>
            {settingsStatus ? <div className="text-xs text-slate-500">{settingsStatus}</div> : null}
            {desktopBackupPath ? <div className="text-xs text-slate-500 break-all">File backup: {desktopBackupPath}</div> : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Le impostazioni backup cartella sono disponibili solo nella versione desktop Electron.
          </div>
        )}

        <div className="pt-2">
          <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onClose} type="button">
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
