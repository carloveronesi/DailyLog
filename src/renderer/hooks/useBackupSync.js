import { useEffect, useState } from "react";
import { getDesktopBridge } from "../services/desktopBridge";
import {
    clearPersistedBackupHandle,
    collectExportData,
    ensureFilePermission,
    loadSettings,
    persistBackupHandle,
    restoreBackupHandle,
    saveSettings,
    writeBackupToFile,
} from "../services/storage";

export function useBackupSync(calendarData, year, month) {
    const desktopBridge = getDesktopBridge();
    const hasDesktopBridge = Boolean(desktopBridge);

    const [settings, setSettings] = useState(() => loadSettings());
    const [settingsStatus, setSettingsStatus] = useState("");
    const [backupFileHandle, setBackupFileHandle] = useState(null);
    const [backupStatus, setBackupStatus] = useState("Backup automatico non attivo");
    const [desktopBackupPath, setDesktopBackupPath] = useState("");
    const [desktopBackupStatus, setDesktopBackupStatus] = useState(
        hasDesktopBridge ? "Backup desktop in inizializzazione..." : ""
    );

    const supportsAutoBackup = typeof window.showSaveFilePicker === "function";
    const supportsHandlePersistence = supportsAutoBackup && typeof window.indexedDB !== "undefined";

    // Save settings
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    // Handle Theme
    useEffect(() => {
        if (settings.theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [settings.theme]);

    // Desktop app: sync minimize-to-tray preference with Electron main process
    useEffect(() => {
        if (!hasDesktopBridge || !desktopBridge?.setMinimizeToTray) return;
        desktopBridge.setMinimizeToTray(Boolean(settings.minimizeToTrayOnMinimize)).catch((err) => {
            setSettingsStatus(`Errore salvataggio setting tray: ${err?.message || err}`);
        });
    }, [desktopBridge, hasDesktopBridge, settings.minimizeToTrayOnMinimize]);

    // Desktop app: initialize auto-backup target path
    useEffect(() => {
        if (!hasDesktopBridge || !desktopBridge?.getAutoBackupPath) return;
        const controller = new AbortController();

        (async () => {
            try {
                const filePath = await desktopBridge.getAutoBackupPath(settings.desktopBackupDir);
                if (controller.signal.aborted) return;
                setDesktopBackupPath(filePath || "");
            } catch (err) {
                if (!controller.signal.aborted) {
                    setDesktopBackupStatus(`Backup desktop non disponibile: ${err?.message || err}`);
                }
            }
        })();

        return () => controller.abort();
    }, [desktopBridge, hasDesktopBridge, settings.desktopBackupDir]);

    // Desktop app: write backup in configured desktop folder at every data change
    useEffect(() => {
        if (!hasDesktopBridge || !desktopBridge?.writeAutoBackup) return;
        const controller = new AbortController();

        (async () => {
            try {
                const payload = JSON.stringify(collectExportData(), null, 2);
                const result = await desktopBridge.writeAutoBackup(payload, settings.desktopBackupDir);
                if (controller.signal.aborted) return;
                if (result?.filePath) setDesktopBackupPath(result.filePath);
                setDesktopBackupStatus(`Backup desktop aggiornato alle ${new Date().toLocaleTimeString("it-IT")}`);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setDesktopBackupStatus(`Backup desktop in errore: ${err?.message || err}`);
                }
            }
        })();

        return () => controller.abort();
    }, [desktopBridge, hasDesktopBridge, calendarData, year, month, settings.desktopBackupDir]);

    // Optional auto-backup on file (Browser)
    useEffect(() => {
        if (hasDesktopBridge) return;
        if (!backupFileHandle) return;
        const controller = new AbortController();

        (async () => {
            try {
                const allowed = await ensureFilePermission(backupFileHandle);
                if (!allowed) throw new Error("permesso file negato");
                await writeBackupToFile(backupFileHandle);
                if (!controller.signal.aborted) {
                    const hhmmss = new Date().toLocaleTimeString("it-IT");
                    setBackupStatus(`Backup aggiornato alle ${hhmmss}`);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setBackupStatus(`Backup in errore: ${err?.message || err}`);
                }
            }
        })();

        return () => controller.abort();
    }, [hasDesktopBridge, backupFileHandle, calendarData, year, month]);

    // Restore persisted backup file handle across sessions
    useEffect(() => {
        if (hasDesktopBridge) return;
        if (!supportsHandlePersistence) return;
        const controller = new AbortController();

        (async () => {
            try {
                const handle = await restoreBackupHandle();
                if (!handle || controller.signal.aborted) return;
                setBackupFileHandle(handle);
                setBackupStatus("Backup auto ripristinato");
            } catch (err) {
                if (!controller.signal.aborted) {
                    setBackupStatus(`Backup non ripristinato: ${err?.message || err}`);
                }
            }
        })();

        return () => controller.abort();
    }, [hasDesktopBridge, supportsHandlePersistence]);

    async function enableAutoBackup() {
        if (!supportsAutoBackup) {
            setBackupStatus("Browser non compatibile con salvataggio automatico su file. Usa Export manuale.");
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
                setBackupStatus("Permesso di scrittura non concesso.");
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
            setBackupStatus(`Configurazione backup fallita: ${err?.message || err}`);
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

    return {
        hasDesktopBridge,
        settings,
        setSettings,
        settingsStatus,
        setSettingsStatus,
        backupFileHandle,
        backupStatus,
        desktopBackupPath,
        desktopBackupStatus,
        supportsAutoBackup,
        enableAutoBackup,
        disableAutoBackup,
        pickDesktopBackupDir,
        useDefaultDesktopBackupDir,
    };
}
