import { STORAGE_PREFIX } from "./core";

const BACKUP_DB_NAME = "dailylog-backup-v1";
const BACKUP_STORE_NAME = "settings";
const BACKUP_HANDLE_KEY = "auto-backup-file-handle";

export function collectExportData() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) out[k] = localStorage.getItem(k);
  }
  // Todos (chiave separata dal prefisso principale)
  const todosVal = localStorage.getItem("dailylog_todos");
  if (todosVal !== null) out["dailylog_todos"] = todosVal;
  return out;
}

export function listStoredMonths() {
  const monthRe = /^dailylog:v1:(\d{4}-\d{2})$/;
  const months = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) {
      const m = k.match(monthRe);
      if (m) months.push(m[1]);
    }
  }
  return months.sort();
}

export function exportMonths(monthYMs) {
  if (!monthYMs || monthYMs.length === 0) return;
  const out = {};
  // Dati mensili selezionati
  for (const ym of monthYMs) {
    const k = STORAGE_PREFIX + ym;
    const val = localStorage.getItem(k);
    if (val !== null) out[k] = val;
  }
  // Metadati globali (progetti, settings, persone)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX) && k.includes("__")) out[k] = localStorage.getItem(k);
  }
  // Todos (chiave separata)
  const todosVal = localStorage.getItem("dailylog_todos");
  if (todosVal !== null) out["dailylog_todos"] = todosVal;
  const dateTag = monthYMs.length === 1
    ? monthYMs[0]
    : `${monthYMs[0]}_${monthYMs[monthYMs.length - 1]}`;
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dailylog_export_${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportAll() {
  const out = collectExportData();
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dailylog_export_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importAll(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== "object") throw new Error("Formato JSON non valido");
  const keys = Object.keys(obj);
  let count = 0;
  for (const k of keys) {
    if ((k.startsWith(STORAGE_PREFIX) || k === "dailylog_todos") && typeof obj[k] === "string") {
      localStorage.setItem(k, obj[k]);
      count++;
    }
  }
  return count;
}

function openBackupDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB non disponibile"));
      return;
    }

    const req = window.indexedDB.open(BACKUP_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Apertura IndexedDB fallita"));
  });
}

export async function persistBackupHandle(fileHandle) {
  const db = await openBackupDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
    tx.objectStore(BACKUP_STORE_NAME).put(fileHandle, BACKUP_HANDLE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Salvataggio handle fallito"));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Salvataggio handle annullato"));
    };
  });
}

export async function restoreBackupHandle() {
  const db = await openBackupDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readonly");
    const req = tx.objectStore(BACKUP_STORE_NAME).get(BACKUP_HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("Lettura handle fallita"));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Lettura handle fallita"));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Lettura handle annullata"));
    };
  });
}

export async function clearPersistedBackupHandle() {
  const db = await openBackupDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
    tx.objectStore(BACKUP_STORE_NAME).delete(BACKUP_HANDLE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Pulizia handle fallita"));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Pulizia handle annullata"));
    };
  });
}

export async function ensureFilePermission(fileHandle) {
  try {
    const opts = { mode: "readwrite" };
    if ((await fileHandle.queryPermission(opts)) === "granted") return true;
    if ((await fileHandle.requestPermission(opts)) === "granted") return true;
    return false;
  } catch {
    return false;
  }
}

export async function writeBackupToFile(fileHandle) {
  const payload = JSON.stringify(collectExportData(), null, 2);
  const writable = await fileHandle.createWritable();
  await writable.write(payload);
  await writable.close();
}
