import { ymKey } from "../utils/date";
import { ensureSubtypesFormat } from "../domain/tasks";

export const STORAGE_PREFIX = "dailylog:v1:";
export const SETTINGS_KEY = STORAGE_PREFIX + "__settings";
export const DEFAULT_SETTINGS = {
  desktopBackupDir: "",
  minimizeToTrayOnMinimize: false,
  clientColors: {},
  theme: "light",
  defaultView: "day",
  taskSubtypes: {},
};
const BACKUP_DB_NAME = "dailylog-backup-v1";
const BACKUP_STORE_NAME = "settings";
const BACKUP_HANDLE_KEY = "auto-backup-file-handle";

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function normalizeHourKey(key) {
  if (typeof key !== "string") return "";
  const raw = key.trim();
  if (!raw) return "";
  if (raw.includes(":")) {
    const [h, m] = raw.split(":");
    const hh = Number.parseInt(h, 10);
    const mm = Number.parseInt(m || "0", 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "";
    return `${pad2(hh)}:${pad2(mm)}`;
  }
  if (!/^\d+$/.test(raw)) return "";
  if (raw.length <= 2) {
    const hh = Number.parseInt(raw, 10);
    if (!Number.isFinite(hh)) return "";
    return `${pad2(hh)}:00`;
  }
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num)) return "";
  const hh = Math.floor(num / 100);
  const mm = num % 100;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function normalizeDayHours(day) {
  if (!day || typeof day !== "object") return day;
  if (!day.hours || typeof day.hours !== "object") return day;
  const normalized = {};
  for (const [k, v] of Object.entries(day.hours)) {
    const nk = normalizeHourKey(k);
    if (!nk) continue;
    normalized[nk] = v;
  }
  return { ...day, hours: normalized };
}

function normalizeHexColor(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!HEX_COLOR_RE.test(raw)) return "";
  if (raw.length === 4) {
    const expanded = raw.slice(1).split("").map((c) => c + c).join("");
    return `#${expanded.toUpperCase()}`;
  }
  return raw.toUpperCase();
}

function normalizeClientColors(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = (k || "").trim().toLocaleLowerCase("it-IT");
    const color = normalizeHexColor(v);
    if (!key || !color) continue;
    out[key] = color;
  }
  return out;
}

export function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    desktopBackupDir: typeof raw.desktopBackupDir === "string" ? raw.desktopBackupDir : "",
    minimizeToTrayOnMinimize: Boolean(raw.minimizeToTrayOnMinimize),
    theme: typeof raw.theme === "string" ? raw.theme : "light",
    clientColors: normalizeClientColors(raw.clientColors),
    defaultView: typeof raw.defaultView === "string" ? raw.defaultView : "day",
    taskSubtypes: ensureSubtypesFormat((raw.taskSubtypes && typeof raw.taskSubtypes === "object") ? raw.taskSubtypes : {}),
  };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

export function collectExportData() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) out[k] = localStorage.getItem(k);
  }
  return out;
}

export function loadMonthData(year, monthIndex0) {
  const key = STORAGE_PREFIX + ymKey(year, monthIndex0);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { byDate: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { byDate: {} };
    if (!parsed.byDate || typeof parsed.byDate !== "object") return { byDate: {} };
    const next = { ...parsed, byDate: { ...parsed.byDate } };
    for (const dateKey of Object.keys(next.byDate)) {
      next.byDate[dateKey] = normalizeDayHours(next.byDate[dateKey]);
    }
    return next;
  } catch {
    return { byDate: {} };
  }
}

export function saveMonthData(year, monthIndex0, data) {
  const key = STORAGE_PREFIX + ymKey(year, monthIndex0);
  localStorage.setItem(key, JSON.stringify(data));
}

export function listStoredClients() {
  const byKey = new Map();

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
    if (storageKey === SETTINGS_KEY) continue;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const byDate = parsed?.byDate;
      if (!byDate || typeof byDate !== "object") continue;

      for (const dateKey of Object.keys(byDate)) {
        const day = byDate[dateKey];
        for (const slot of ["AM", "PM"]) {
          const entry = day?.[slot];
          if (!entry || entry.type !== "client") continue;

          const name = (entry.client || "").trim();
          if (!name) continue;

          const normalized = name.toLocaleLowerCase("it-IT");
          if (!byKey.has(normalized)) byKey.set(normalized, name);
        }
        for (const entry of Object.values(day?.hours || {})) {
          if (!entry || entry.type !== "client") continue;

          const name = (entry.client || "").trim();
          if (!name) continue;

          const normalized = name.toLocaleLowerCase("it-IT");
          if (!byKey.has(normalized)) byKey.set(normalized, name);
        }
      }
    } catch {
      // Ignore malformed month payloads.
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "it"));
}

export function searchAllLogs(query) {
  if (!query || typeof query !== "string") return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
    if (storageKey === SETTINGS_KEY) continue;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const byDate = parsed?.byDate;
      if (!byDate || typeof byDate !== "object") continue;

      for (const dateKey of Object.keys(byDate)) {
        const day = byDate[dateKey];
        if (!day) continue;
        
        // Parse date from dateKey (YYYY-MM-DD)
        const [y, m, d] = dateKey.split("-").map(Number);
        if (!y || !m || !d) continue;
        const dateObj = new Date(y, m - 1, d);
        const dayMatches = new Map();

        const checkEntry = (entry, slotLabel) => {
          if (!entry || typeof entry !== "object") return;
          const matchTitle = (entry.title || "").toLowerCase().includes(q);
          const matchNotes = (entry.notes || "").toLowerCase().includes(q);
          const matchClient = (entry.client || "").toLowerCase().includes(q);
          const matchRetrospective = (entry.retrospective || "").toLowerCase().includes(q);
          const matchNextSteps = (entry.nextSteps || "").toLowerCase().includes(q);

          if (matchTitle || matchNotes || matchClient || matchRetrospective || matchNextSteps) {
            const uniqueKey = JSON.stringify({
              t: entry.title || "",
              n: entry.notes || "",
              c: entry.client || "",
              r: entry.retrospective || "",
              s: entry.nextSteps || ""
            });

            if (!dayMatches.has(uniqueKey)) {
              dayMatches.set(uniqueKey, {
                date: dateObj,
                dateKey,
                slots: [slotLabel],
                entry
              });
            } else {
              dayMatches.get(uniqueKey).slots.push(slotLabel);
            }
          }
        };

        checkEntry(day.AM, "AM");
        checkEntry(day.PM, "PM");
        
        if (day.hours && typeof day.hours === "object") {
          for (const [hourKey, entry] of Object.entries(day.hours)) {
            checkEntry(entry, hourKey);
          }
        }

        for (const match of dayMatches.values()) {
          const times = match.slots.filter(s => s !== "AM" && s !== "PM").sort();
          const ampm = match.slots.filter(s => s === "AM" || s === "PM");
          
          let slotText = "";
          if (times.length > 0) {
            if (times.length === 1) {
               slotText = times[0];
            } else {
               slotText = `${times[0]} - ${times[times.length - 1]}`;
            }
          }
          if (ampm.length > 0) {
             slotText = slotText ? `${slotText} (${ampm.join(", ")})` : ampm.join(", ");
          }

          results.push({
            date: match.date,
            dateKey: match.dateKey,
            slot: slotText,
            rawSlots: match.slots,
            entry: match.entry
          });
        }
      }
    } catch {
      // Ignore malformed payloads
    }
  }

  // Sort by date descending, then by slot
  return results.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return (a.slot || "").localeCompare(b.slot || "");
  });
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

export async function importAll(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== "object") throw new Error("Formato JSON non valido");
  const keys = Object.keys(obj);
  let count = 0;
  for (const k of keys) {
    if (k.startsWith(STORAGE_PREFIX) && typeof obj[k] === "string") {
      localStorage.setItem(k, obj[k]);
      count++;
    }
  }
  return count;
}
