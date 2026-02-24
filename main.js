const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

function resolveBackupPaths(customDir) {
  const fallbackDir = path.join(app.getPath("documents"), "DailyLog", "backup");
  const requestedDir = typeof customDir === "string" ? customDir.trim() : "";
  const backupDir = requestedDir || fallbackDir;

  if (!path.isAbsolute(backupDir)) {
    throw new Error("Il percorso backup deve essere assoluto");
  }

  const backupFile = path.join(backupDir, "dailylog_auto_backup.json");
  return { backupDir, backupFile };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "dailylog.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("backup:getAutoPath", async (_event, customDir) => {
  return resolveBackupPaths(customDir).backupFile;
});

ipcMain.handle("backup:writeAuto", async (_event, payload, customDir) => {
  if (typeof payload !== "string") {
    throw new Error("Payload backup non valido");
  }

  const { backupDir, backupFile } = resolveBackupPaths(customDir);
  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(backupFile, payload, "utf8");

  return {
    dirPath: backupDir,
    filePath: backupFile,
    updatedAt: new Date().toISOString(),
  };
});

ipcMain.handle("backup:pickDir", async (event, currentDir) => {
  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const defaultPath =
    typeof currentDir === "string" && currentDir.trim() ? currentDir.trim() : app.getPath("documents");

  const result = await dialog.showOpenDialog(ownerWindow, {
    title: "Seleziona cartella backup DailyLog",
    defaultPath,
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled || !result.filePaths?.length) return null;
  return result.filePaths[0];
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
