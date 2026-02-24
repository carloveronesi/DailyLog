const { app, BrowserWindow, dialog, ipcMain, Menu, shell, Tray } = require("electron");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");

let mainWindow = null;
let tray = null;
let minimizeToTrayOnMinimize = false;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

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

function getTrayIconPath() {
  return path.join(__dirname, "assets", "tray.ico");
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

function showMainWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
  destroyTray();
}

function ensureTray() {
  if (tray) return tray;

  const iconPath = getTrayIconPath();
  const trayIconSource = fsSync.existsSync(iconPath) ? iconPath : process.execPath;
  tray = new Tray(trayIconSource);
  tray.setToolTip("DailyLog");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Apri DailyLog", click: () => showMainWindow() },
      { type: "separator" },
      {
        label: "Esci",
        click: () => {
          app.quit();
        },
      },
    ])
  );
  tray.on("double-click", () => showMainWindow());
  tray.on("click", () => showMainWindow());

  return tray;
}

function createWindow() {
  mainWindow = new BrowserWindow({
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

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("minimize", (event) => {
    if (!minimizeToTrayOnMinimize) return;
    event.preventDefault();
    ensureTray();
    mainWindow.hide();
  });

  mainWindow.on("show", () => {
    destroyTray();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
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

ipcMain.handle("app:setMinimizeToTray", async (_event, enabled) => {
  minimizeToTrayOnMinimize = Boolean(enabled);
  if (!minimizeToTrayOnMinimize && mainWindow && mainWindow.isVisible()) {
    destroyTray();
  }
  return minimizeToTrayOnMinimize;
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
