const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dailylogDesktop", {
  isDesktop: true,
  getAutoBackupPath: (customDir) => ipcRenderer.invoke("backup:getAutoPath", customDir),
  writeAutoBackup: (payload, customDir) => ipcRenderer.invoke("backup:writeAuto", payload, customDir),
  pickBackupDirectory: (currentDir) => ipcRenderer.invoke("backup:pickDir", currentDir),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke("app:setMinimizeToTray", enabled),
});
