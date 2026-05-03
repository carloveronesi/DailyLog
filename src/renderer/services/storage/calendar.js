import { STORAGE_PREFIX, SETTINGS_KEY } from "./core";
import { ymKey, pad2 } from "../../utils/date";

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

export function renameClientInStorage(oldName, newName) {
  const oldNorm = oldName.trim().toLocaleLowerCase("it-IT");
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
      let dirty = false;
      for (const dateKey of Object.keys(byDate)) {
        const day = byDate[dateKey];
        for (const slot of ["AM", "PM"]) {
          const entry = day?.[slot];
          if (entry?.type === "client" && (entry.client || "").trim().toLocaleLowerCase("it-IT") === oldNorm) {
            entry.client = newName;
            dirty = true;
          }
        }
        for (const entry of Object.values(day?.hours || {})) {
          if (entry?.type === "client" && (entry.client || "").trim().toLocaleLowerCase("it-IT") === oldNorm) {
            entry.client = newName;
            dirty = true;
          }
        }
      }
      if (dirty) localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      // ignore malformed payloads
    }
  }
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
