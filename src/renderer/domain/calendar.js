import {
  AFTERNOON_SLOTS,
  MORNING_SLOTS,
  SLOT_MINUTES,
  WORK_SLOTS,
  hasAfternoonHours,
  hasMorningHours,
  hourKey,
  hourLabel,
  isSameTaskEntry,
} from "./tasks";

export const BREAK_START = 13 * 60;
export const BREAK_END = 14 * 60;

export const DAY_SLOTS = [...MORNING_SLOTS, BREAK_START, BREAK_START + SLOT_MINUTES, ...AFTERNOON_SLOTS];

export function hasMissingNotes(entry) {
  if (!entry || entry.type === "vacation" || entry.type === "event") return false;
  return !(entry.notes || "").trim();
}

export function normalizeEntryValue(value) {
  return (value || "").trim().toLocaleLowerCase("it-IT");
}

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

export function buildHourBlocks(dayData) {
  if (!dayData?.hours) return [];
  const blocks = [];
  let current = null;
  const hourKeys = Object.keys(dayData.hours || {});
  const hasHalfSlots = hourKeys.some((k) => k.endsWith(":30"));

  const slotsToScan = hasHalfSlots
    ? WORK_SLOTS
    : WORK_SLOTS.filter((slot) => slot % 60 === 0);
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

export function buildBlocks(dayData) {
  if (!dayData) return [];
  const am = dayData.AM || null;
  const pm = dayData.PM || null;
  const morningHoursActive = hasMorningHours(dayData);
  const afternoonHoursActive = hasAfternoonHours(dayData);
  const isFullDay = !morningHoursActive && !afternoonHoursActive && isSameTaskEntry(am, pm);

  if (isFullDay && am) {
    return [
      {
        entry: am,
        start: MORNING_SLOTS[0],
        end: AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES,
        span: DAY_SLOTS.length,
        slot: "AM",
        label: "Giornata intera",
      },
    ];
  }

  if (morningHoursActive || afternoonHoursActive) {
    return buildHourBlocks(dayData).map((b) => ({
      ...b,
      slot: b.start,
    }));
  }

  const blocks = [];
  if (am) {
    blocks.push({
      entry: am,
      start: MORNING_SLOTS[0],
      end: MORNING_SLOTS[MORNING_SLOTS.length - 1] + SLOT_MINUTES,
      span: MORNING_SLOTS.length,
      slot: "AM",
      label: "Mattina",
    });
  }

  if (pm) {
    blocks.push({
      entry: pm,
      start: AFTERNOON_SLOTS[0],
      end: AFTERNOON_SLOTS[AFTERNOON_SLOTS.length - 1] + SLOT_MINUTES,
      span: AFTERNOON_SLOTS.length,
      slot: "PM",
      label: "Pomeriggio",
    });
  }

  return blocks;
}

export function slotIndex(slotMin) {
  return DAY_SLOTS.indexOf(slotMin);
}
