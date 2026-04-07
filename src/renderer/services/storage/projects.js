import { STORAGE_PREFIX } from "./core";

const PROJECTS_KEY = STORAGE_PREFIX + "__projects";

/**
 * ProjectMeta:
 * {
 *   description: string,
 *   objectives: string,
 *   startDate: string,       // "YYYY-MM-DD" | ""
 *   endDate: string,         // "YYYY-MM-DD" | ""
 *   status: "active" | "completed" | "paused",
 *   team: string[],          // nomi collaboratori interni
 *   clientContacts: string[], // nomi referenti lato cliente
 * }
 *
 * Chiave progetto:
 *   client   → "client::<normalizedClientName>"
 *   internal → "internal::<subtypeId>"   (subtypeId = "" per Generico)
 */

export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects || {}));
}

/** Scansiona tutti i mesi e restituisce i subtypeId univoci usati nei task interni. */
export function listStoredInternalSubtypes() {
  const found = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
    if (storageKey.includes("__")) continue;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const byDate = parsed?.byDate;
      if (!byDate) continue;
      for (const day of Object.values(byDate)) {
        for (const slot of ["AM", "PM"]) {
          const e = day?.[slot];
          if (e?.type === "internal") found.add(e.subtypeId || "");
        }
        for (const e of Object.values(day?.hours || {})) {
          if (e?.type === "internal") found.add(e.subtypeId || "");
        }
      }
    } catch {
      // ignore
    }
  }
  return Array.from(found);
}

/**
 * Aggrega tutti i task corrispondenti al progetto.
 * @param {string} projectId  - "client::nome" | "internal::subtypeId"
 * @param {object} workHours  - { morningStart, morningEnd, afternoonStart, afternoonEnd }
 * @returns {{ totalHours: number, tasks: Array, firstDate: string|null, lastDate: string|null }}
 */
export function aggregateProjectEntries(projectId, workHours) {
  const isClient = projectId.startsWith("client::");
  const isInternal = projectId.startsWith("internal::");
  const idValue = isClient ? projectId.slice(8) : isInternal ? projectId.slice(10) : "";

  const morningHours = (workHours.morningEnd - workHours.morningStart) / 60;
  const afternoonHours = (workHours.afternoonEnd - workHours.afternoonStart) / 60;

  let totalHours = 0;
  const tasks = [];

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
    if (storageKey.includes("__")) continue;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const byDate = parsed?.byDate;
      if (!byDate) continue;

      for (const [dateKey, day] of Object.entries(byDate)) {
        if (!day) continue;

        const matches = (entry) => {
          if (!entry) return false;
          if (isClient) {
            return entry.type === "client" &&
              (entry.client || "").trim().toLocaleLowerCase("it-IT") === idValue;
          }
          if (isInternal) {
            return entry.type === "internal" && (entry.subtypeId || "") === idValue;
          }
          return false;
        };

        for (const slot of ["AM", "PM"]) {
          const entry = day[slot];
          if (matches(entry)) {
            const h = slot === "AM" ? morningHours : afternoonHours;
            totalHours += h;
            tasks.push({ dateKey, slot, entry, hours: h });
          }
        }

        for (const [slotKey, entry] of Object.entries(day.hours || {})) {
          if (matches(entry)) {
            totalHours += 0.5;
            tasks.push({ dateKey, slot: slotKey, entry, hours: 0.5 });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Sort by date then by slot time
  tasks.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    const slotOrder = (s) => {
      if (s === "AM") return -2;
      if (s === "PM") return 9999;
      // "HH:MM" format → minutes
      const [h, m] = s.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    return slotOrder(a.slot) - slotOrder(b.slot);
  });

  const firstDate = tasks.length > 0 ? tasks[0].dateKey : null;
  const lastDate = tasks.length > 0 ? tasks[tasks.length - 1].dateKey : null;

  return { totalHours, tasks, firstDate, lastDate };
}
