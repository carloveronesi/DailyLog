import { STORAGE_PREFIX, SETTINGS_KEY, PEOPLE_KEY } from "./core";
import { ensureSubtypesFormat, normalizeHexColor } from "../../domain/tasks";

export const DEFAULT_SETTINGS = {
  desktopBackupDir: "",
  minimizeToTrayOnMinimize: false,
  clientColors: {},
  theme: "light",
  defaultView: "day",
  taskSubtypes: {},
};

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

export function listStoredPeople() {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function savePeople(people) {
  if (!Array.isArray(people)) return;
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}
