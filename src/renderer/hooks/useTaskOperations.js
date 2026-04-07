import { useEffect, useRef, useState } from "react";
import { hourKey, SLOT_MINUTES, WORK_SLOTS as DEFAULT_WORK_SLOTS } from "../domain/tasks";
import { ymd } from "../utils/date";

function hasOverlap(hours, rangeStart, rangeEnd, ignoreStart, ignoreEnd) {
  const hasIgnore = ignoreStart !== undefined && ignoreEnd !== undefined;
  const ignoreFrom = hasIgnore ? Math.min(ignoreStart, ignoreEnd) : undefined;
  const ignoreTo   = hasIgnore ? Math.max(ignoreStart, ignoreEnd) : undefined;
  for (let m = rangeStart; m < rangeEnd; m += SLOT_MINUTES) {
    if (hasIgnore && m >= ignoreFrom && m < ignoreTo) continue;
    if (hours[hourKey(m)]) return true;
  }
  return false;
}

export function useTaskOperations({ monthDataByDate, upsertDay, WORK_SLOTS = DEFAULT_WORK_SLOTS }) {
  const [blockedToast, setBlockedToast] = useState(null);
  const blockedToastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (blockedToastTimerRef.current) clearTimeout(blockedToastTimerRef.current);
      blockedToastTimerRef.current = null;
      setBlockedToast(null);
    };
  }, []);

  function showBlockedToast(message) {
    if (!message) return;
    setBlockedToast(message);
    if (blockedToastTimerRef.current) clearTimeout(blockedToastTimerRef.current);
    blockedToastTimerRef.current = setTimeout(() => {
      setBlockedToast(null);
      blockedToastTimerRef.current = null;
    }, 1800);
  }

  function onMoveTask(date, { start, end, newStart }) {
    const specificDayData = monthDataByDate[ymd(date)] || null;
    if (!specificDayData?.hours) return;
    const duration = end - start;
    const newEnd = newStart + duration;

    if (hasOverlap(specificDayData.hours, newStart, newEnd, start, end)) {
      showBlockedToast("Impossibile spostare: sovrappone un altro task.");
      return;
    }

    if (newStart < WORK_SLOTS[0] || newEnd > WORK_SLOTS[WORK_SLOTS.length - 1] + SLOT_MINUTES) return;

    const entryToMove = specificDayData.hours[hourKey(start)];
    if (!entryToMove) return;

    const nextHours = { ...specificDayData.hours };
    for (let m = start; m < end; m += SLOT_MINUTES) delete nextHours[hourKey(m)];
    for (let m = newStart; m < newEnd; m += SLOT_MINUTES) nextHours[hourKey(m)] = entryToMove;

    upsertDay(date, {
      AM: specificDayData.AM || null,
      PM: specificDayData.PM || null,
      location: specificDayData.location || null,
      hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
    }, "Sposta task");
  }

  function onResizeTask(date, { start, end, newStart, newEnd }) {
    const specificDayData = monthDataByDate[ymd(date)] || null;
    if (!specificDayData?.hours) return;
    const entryToResize = specificDayData.hours[hourKey(start)];
    if (!entryToResize) return;

    const finalStart = newStart !== undefined ? newStart : start;
    const finalEnd = newEnd !== undefined ? newEnd : end;

    if (finalEnd <= finalStart || finalStart < WORK_SLOTS[0] || finalEnd > WORK_SLOTS[WORK_SLOTS.length - 1] + SLOT_MINUTES) return;

    if (hasOverlap(specificDayData.hours, finalStart, finalEnd, start, end)) {
      showBlockedToast("Impossibile ridimensionare: sovrappone un altro task.");
      return;
    }

    const nextHours = { ...specificDayData.hours };
    for (let m = start; m < end; m += SLOT_MINUTES) delete nextHours[hourKey(m)];
    for (let m = finalStart; m < finalEnd; m += SLOT_MINUTES) nextHours[hourKey(m)] = entryToResize;

    upsertDay(date, {
      AM: specificDayData.AM || null,
      PM: specificDayData.PM || null,
      location: specificDayData.location || null,
      hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
    }, "Ridimensiona task");
  }

  function handleSlotDeletion(date, { start, end }) {
    const key = ymd(date);
    const existing = monthDataByDate[key];
    if (!existing?.hours) return;
    const toDelete = new Set();
    for (let m = start; m < end; m += SLOT_MINUTES) toDelete.add(hourKey(m));
    const nextHours = {};
    for (const [k, e] of Object.entries(existing.hours)) {
      if (!toDelete.has(k)) nextHours[k] = e;
    }
    upsertDay(date, {
      AM: existing.AM || null,
      PM: existing.PM || null,
      location: existing.location || null,
      hours: Object.keys(nextHours).length > 0 ? nextHours : undefined,
    }, "Elimina task");
  }

  return { onMoveTask, onResizeTask, handleSlotDeletion, blockedToast };
}
