import {
  AFTERNOON_SLOTS,
  MORNING_SLOTS,
  SLOT_MINUTES,
  WORK_SLOTS,
  hourKey,
  hourLabel,
  isSameTaskEntry,
  buildSlots,
} from "./tasks";

export const BREAK_START = 13 * 60;
export const BREAK_END = 14 * 60;

export const DAY_SLOTS = [...MORNING_SLOTS, BREAK_START, BREAK_START + SLOT_MINUTES, ...AFTERNOON_SLOTS];

const DEFAULT_WORK_SLOTS = {
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  WORK_SLOTS,
};

export function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

export function normalizeEntryValue(value) {
  return (value || "").trim().toLocaleLowerCase("it-IT");
}

/**
 * Deep equality check used to merge consecutive hour slots into a single visual block.
 * Compares ALL content fields (including notes, wentWrong, nextSteps) so that two
 * adjacent slots are only merged when every detail is identical.
 * NOTE: intentionally different from isSameTaskEntry in tasks.js, which uses a
 * lighter label-based comparison suited for full-day detection.
 */
export function isSameHourEntry(a, b) {
  if (!a || !b) return false;
  return (
    normalizeEntryValue(a.type) === normalizeEntryValue(b.type) &&
    normalizeEntryValue(a.title) === normalizeEntryValue(b.title) &&
    normalizeEntryValue(a.client) === normalizeEntryValue(b.client) &&
    normalizeEntryValue(a.notes) === normalizeEntryValue(b.notes) &&
    normalizeEntryValue(a.wentWrong) === normalizeEntryValue(b.wentWrong) &&
    normalizeEntryValue(a.nextSteps) === normalizeEntryValue(b.nextSteps)
  );
}

export function buildHourBlocks(dayData, workSlots = DEFAULT_WORK_SLOTS) {
  if (!dayData?.hours) return [];
  const blocks = [];
  let current = null;
  const hourKeys = Object.keys(dayData.hours || {});
  const hasHalfSlots = hourKeys.some((k) => k.endsWith(":30"));
  const effectiveWorkSlots = workSlots.WORK_SLOTS;

  const slotsToScan = hasHalfSlots
    ? effectiveWorkSlots
    : effectiveWorkSlots.filter((slot) => slot % 60 === 0);
  const stepMinutes = hasHalfSlots ? SLOT_MINUTES : 60;
  const spanStep = hasHalfSlots ? 1 : 2;

  for (const slot of slotsToScan) {
    const entry = dayData.hours[hourKey(slot)] || null;
    if (!entry) {
      current = null;
      continue;
    }

    if (current && isSameHourEntry(current.entry, entry) && current.end === slot) {
      current.end += stepMinutes;
      current.span += spanStep;
      continue;
    }

    const label = hourLabel(slot);
    current = {
      entry,
      start: slot,
      end: slot + stepMinutes,
      span: spanStep,
      label,
    };
    blocks.push(current);
  }

  return blocks.map((block) => {
    if (block.span <= spanStep) return block;
    return {
      ...block,
      label: `${hourLabel(block.start)} - ${hourLabel(block.end)}`,
    };
  });
}

export function buildBlocks(dayData, workSlots = DEFAULT_WORK_SLOTS) {
  if (!dayData) return [];
  const am = dayData.AM || null;
  const pm = dayData.PM || null;
  const effectiveMorningSlots = workSlots.MORNING_SLOTS;
  const effectiveAfternoonSlots = workSlots.AFTERNOON_SLOTS;
  const hours = dayData.hours || {};
  const morningHoursActive = effectiveMorningSlots.some((h) => hours[hourKey(h)]);
  const afternoonHoursActive = effectiveAfternoonSlots.some((h) => hours[hourKey(h)]);
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  // Compute daySlots for span calculation
  const breakStart = workSlots.BREAK_START ?? BREAK_START;
  const breakEnd = workSlots.BREAK_END ?? BREAK_END;
  const breakSlots = buildSlots(breakStart, breakEnd);
  const daySlotsForSpan = [...effectiveMorningSlots, ...breakSlots, ...effectiveAfternoonSlots];

  if (isFullDay && am) {
    return [
      {
        entry: am,
        start: effectiveMorningSlots[0],
        end: effectiveAfternoonSlots[effectiveAfternoonSlots.length - 1] + SLOT_MINUTES,
        span: daySlotsForSpan.length,
        slot: "AM",
        label: "Giornata intera",
      },
    ];
  }

  if (morningHoursActive || afternoonHoursActive) {
    return buildHourBlocks(dayData, workSlots).map((b) => ({
      ...b,
      slot: b.start,
    }));
  }

  const blocks = [];
  if (am) {
    blocks.push({
      entry: am,
      start: effectiveMorningSlots[0],
      end: effectiveMorningSlots[effectiveMorningSlots.length - 1] + SLOT_MINUTES,
      span: effectiveMorningSlots.length,
      slot: "AM",
      label: "Mattina",
    });
  }

  if (pm) {
    blocks.push({
      entry: pm,
      start: effectiveAfternoonSlots[0],
      end: effectiveAfternoonSlots[effectiveAfternoonSlots.length - 1] + SLOT_MINUTES,
      span: effectiveAfternoonSlots.length,
      slot: "PM",
      label: "Pomeriggio",
    });
  }

  return blocks;
}

export function slotIndex(slotMin, daySlots = DAY_SLOTS) {
  return daySlots.indexOf(slotMin);
}

/**
 * Verifica se un task ricorrente corrisponde a una data specifica.
 * frequency: "daily" | "weekly" | "biweekly" | "triweekly" | "monthly"
 * dowMon0: 0=Lun…4=Ven  (usato per weekly/biweekly/triweekly)
 * dayOfMonth: 1-31       (usato per monthly)
 * anchorYmd: "YYYY-MM-DD" (usato per biweekly/triweekly come data di riferimento)
 */
export function matchesRecurringPattern(task, date) {
  const freq = task.frequency || "weekly";
  const dow = (date.getDay() + 6) % 7;

  if (freq === "daily") return true;

  if (freq === "monthly") {
    return date.getDate() === (task.dayOfMonth ?? 1);
  }

  // weekly / biweekly / triweekly: controlla prima il giorno della settimana
  if ((task.dowMon0 ?? 0) !== dow) return false;

  const intervalDays = freq === "triweekly" ? 21 : freq === "biweekly" ? 14 : 7;
  if (intervalDays === 7) return true;

  if (!task.anchorYmd) return true;
  const [ay, am, ad] = task.anchorYmd.split("-").map(Number);
  const anchor = new Date(ay, am - 1, ad);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((d - anchor) / (24 * 60 * 60 * 1000));
  return Math.abs(diffDays) % intervalDays === 0;
}
