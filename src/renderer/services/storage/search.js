import { STORAGE_PREFIX, SETTINGS_KEY } from "./core";

export function searchAllLogs(query, filters = {}) {
  const { startDate, endDate, collaborator, project, type, subtypeId } = filters;
  const q = (query || "").toLowerCase().trim();

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
        // Date range filter
        if (startDate && dateKey < startDate) continue;
        if (endDate && dateKey > endDate) continue;

        const day = byDate[dateKey];
        if (!day) continue;
        
        // Parse date from dateKey (YYYY-MM-DD)
        const [y, m, d] = dateKey.split("-").map(Number);
        if (!y || !m || !d) continue;
        const dateObj = new Date(y, m - 1, d);
        const dayMatches = new Map();

        const checkEntry = (entry, slotLabel) => {
          if (!entry || typeof entry !== "object") return;
          
          // Apply text query
          const matchTitle = (entry.title || "").toLowerCase().includes(q);
          const matchNotes = (entry.notes || "").toLowerCase().includes(q);
          const matchClient = (entry.client || "").toLowerCase().includes(q);
          const matchNextSteps = (entry.nextSteps || "").toLowerCase().includes(q);
          const queryMatches = !q || (matchTitle || matchNotes || matchClient || matchNextSteps);
          if (!queryMatches) return;

          // Apply specific filters
          if (type && entry.type !== type) return;
          if (project && entry.client !== project) return;
          if (subtypeId && entry.subtypeId !== subtypeId) return;
          if (collaborator && !(entry.collaborators || []).includes(collaborator)) return;

          const uniqueKey = JSON.stringify(entry);
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
