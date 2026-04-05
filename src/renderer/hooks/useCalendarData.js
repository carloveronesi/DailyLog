import { useEffect, useMemo, useRef, useState } from "react";
import { SLOT } from "../domain/tasks";
import { loadMonthData, saveMonthData } from "../services/storage";
import { dowMon0, ymd } from "../utils/date";

// Kept outside the hook to avoid re-creating on every render
function restoreEntry(entry, setMonthsData) {
  const { dateKey, mKey, targetYear, targetMonth0, previousData } = entry;
  setMonthsData(prev => {
    const currentMonthData = prev[mKey] || { byDate: {} };
    const nextByDate = { ...currentMonthData.byDate };
    if (previousData) {
      nextByDate[dateKey] = previousData;
    } else {
      delete nextByDate[dateKey];
    }
    const nextMonthData = { ...currentMonthData, byDate: nextByDate };
    saveMonthData(targetYear, targetMonth0, nextMonthData);
    return { ...prev, [mKey]: nextMonthData };
  });
}

export function useCalendarData(initialYear, initialMonth) {
    const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth);

    // Cache multiple months: { "YYYY-MM": { byDate: {...} } }
    const [monthsData, setMonthsData] = useState({});

    // Undo support
    const monthsDataRef = useRef({});
    const undoEntryRef = useRef(null);
    const [hasUndo, setHasUndo] = useState(false);
    const [saveCount, setSaveCount] = useState(0);

    useEffect(() => {
        monthsDataRef.current = monthsData;
    }, [monthsData]);

    // Whenever focal year/month changes, ensure we have current, prev, and next months
    useEffect(() => {
        const focal = new Date(year, month, 1);
        const prev = new Date(year, month - 1, 1);
        const next = new Date(year, month + 1, 1);

        const newMonthsData = {};
        [prev, focal, next].forEach(d => {
            const y = d.getFullYear();
            const m = d.getMonth();
            const monthStr = String(m + 1).padStart(2, '0');
            const mKey = `${y}-${monthStr}`;
            
            newMonthsData[mKey] = loadMonthData(y, m);
        });
        setMonthsData(prevData => ({ ...prevData, ...newMonthsData }));
    }, [year, month]);

    const gridDates = useMemo(() => {
        const first = new Date(year, month, 1);

        // start from Monday of the first week
        const startOffset = dowMon0(first); // 0..6
        const start = new Date(year, month, 1 - startOffset);

        const cells = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            cells.push(d);
        }

        const weeks = [];
        for (let i = 0; i < 6; i++) {
            weeks.push(cells.slice(i * 7, i * 7 + 7));
        }

        const isCurrentMonth = (d) => d.getFullYear() === year && d.getMonth() === month;
        const hasCurrentMonthDay = (week) => week.some((d) => isCurrentMonth(d));
        const hasCurrentMonthWorkday = (week) => week.some((d) => {
            if (!isCurrentMonth(d)) return false;
            const jsDay = d.getDay(); // 0 Sun, 6 Sat
            return jsDay >= 1 && jsDay <= 5;
        });

        // Remove full leading/trailing rows that don't contain any day of the selected month.
        while (weeks.length > 0 && !hasCurrentMonthDay(weeks[0])) weeks.shift();
        while (weeks.length > 0 && !hasCurrentMonthDay(weeks[weeks.length - 1])) weeks.pop();

        // If the month spans 6 weeks but first/last row has only weekends of the selected month,
        // hide that row to keep the calendar compact and focused on working days.
        if (weeks.length === 6 && !hasCurrentMonthWorkday(weeks[0])) weeks.shift();
        if (weeks.length === 6 && !hasCurrentMonthWorkday(weeks[weeks.length - 1])) weeks.pop();

        return weeks.flat();
    }, [year, month]);

    // Merged data from all cached months
    const monthDataByDate = useMemo(() => {
        const merged = {};
        Object.values(monthsData).forEach(m => {
            if (m?.byDate) {
                Object.assign(merged, m.byDate);
            }
        });
        return merged;
    }, [monthsData]);

    // Data for the focal month (for backward compat and backup sync)
    const data = useMemo(() => {
        const monthStr = String(month + 1).padStart(2, '0');
        const mKey = `${year}-${monthStr}`;
        return monthsData[mKey] || { byDate: {} };
    }, [monthsData, year, month]);

    const topMonthClients = useMemo(() => {
        const countByClient = new Map();
        for (const dateKey of Object.keys(monthDataByDate)) {
            const [dYear, dMonth] = dateKey.split("-").map(s => parseInt(s, 10));
            // Only count clients for the focal month to keep the top clients list consistent with view
            if (dYear !== year || dMonth - 1 !== month) continue;

            const day = monthDataByDate[dateKey];
            for (const s of [SLOT.AM, SLOT.PM]) {
                const e = day?.[s];
                if (!e || e.type !== "client") continue;
                const clientName = (e.client || "").trim();
                if (!clientName) continue;
                countByClient.set(clientName, (countByClient.get(clientName) || 0) + 1);
            }
            for (const e of Object.values(day?.hours || {})) {
                if (!e || e.type !== "client") continue;
                const clientName = (e.client || "").trim();
                if (!clientName) continue;
                countByClient.set(clientName, (countByClient.get(clientName) || 0) + 1);
            }
        }

        return Array.from(countByClient.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
            .slice(0, 3)
            .map(([clientName]) => clientName);
    }, [monthDataByDate, year, month]);

    function upsertDay(date, entries) {
        const key = ymd(date);
        const [y, mStr] = key.split("-");
        const targetYear = parseInt(y, 10);
        const targetMonth0 = parseInt(mStr, 10) - 1;
        const mKey = `${y}-${mStr}`;

        // Capture undo snapshot before modifying
        const prevDayData = monthsDataRef.current[mKey]?.byDate?.[key] ?? null;
        undoEntryRef.current = { dateKey: key, mKey, targetYear, targetMonth0, previousData: prevDayData };
        setHasUndo(true);
        setSaveCount(c => c + 1);

        const hours = entries.hours && Object.keys(entries.hours).length > 0 ? entries.hours : undefined;
        const normalized = {
            AM: entries.AM || null,
            PM: entries.PM || null,
            location: entries.location || null,
            ...(hours ? { hours } : {}),
        };
        const isEmpty = !normalized.AM && !normalized.PM && !normalized.hours && (!normalized.location || normalized.location === "remote");

        setMonthsData(prev => {
            const currentMonthData = prev[mKey] || { byDate: {} };
            const nextByDate = { ...currentMonthData.byDate };
            if (isEmpty) {
                delete nextByDate[key];
            } else {
                nextByDate[key] = normalized;
            }
            const nextMonthData = { ...currentMonthData, byDate: nextByDate };
            saveMonthData(targetYear, targetMonth0, nextMonthData);
            return { ...prev, [mKey]: nextMonthData };
        });
    }

    function deleteDay(date) {
        const key = ymd(date);
        const [y, mStr] = key.split("-");
        const targetYear = parseInt(y, 10);
        const targetMonth0 = parseInt(mStr, 10) - 1;
        const mKey = `${y}-${mStr}`;

        // Capture undo snapshot before deleting
        const prevDayData = monthsDataRef.current[mKey]?.byDate?.[key] ?? null;
        undoEntryRef.current = { dateKey: key, mKey, targetYear, targetMonth0, previousData: prevDayData };
        setHasUndo(true);
        setSaveCount(c => c + 1);

        setMonthsData(prev => {
            const currentMonthData = prev[mKey] || { byDate: {} };
            const nextByDate = { ...currentMonthData.byDate };
            delete nextByDate[key];
            const nextMonthData = { ...currentMonthData, byDate: nextByDate };
            saveMonthData(targetYear, targetMonth0, nextMonthData);
            return { ...prev, [mKey]: nextMonthData };
        });
    }

    function undoLastChange() {
        const entry = undoEntryRef.current;
        if (!entry) return;
        undoEntryRef.current = null;
        setHasUndo(false);
        restoreEntry(entry, setMonthsData);
    }

    function reloadFromStorage() {
        // Refresh focal, prev and next
        const focal = new Date(year, month, 1);
        const prev = new Date(year, month - 1, 1);
        const next = new Date(year, month + 1, 1);

        const newMonthsData = {};
        [prev, focal, next].forEach(d => {
            const y = d.getFullYear();
            const m = d.getMonth();
            const monthStr = String(m + 1).padStart(2, '0');
            const mKey = `${y}-${monthStr}`;
            newMonthsData[mKey] = loadMonthData(y, m);
        });
        setMonthsData(prev => ({ ...prev, ...newMonthsData }));
    }

    function prevMonth() {
        const d = new Date(year, month, 1);
        d.setMonth(d.getMonth() - 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    }

    function nextMonth() {
        const d = new Date(year, month, 1);
        d.setMonth(d.getMonth() + 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    }

    function goToday() {
        const today = new Date();
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    }

    function setMonthYear(nextYear, nextMonth) {
        if (nextYear === year && nextMonth === month) return;
        setYear(nextYear);
        setMonth(nextMonth);
    }

    // SetData is preserved for backward compatibility but might not work exactly as before
    // since it now only updates the focal month in state.
    const setData = (newData) => {
        const monthStr = String(month + 1).padStart(2, '0');
        const mKey = `${year}-${monthStr}`;
        setMonthsData(prev => ({ ...prev, [mKey]: newData }));
        saveMonthData(year, month, newData);
    };

    return {
        year,
        month,
        data,
        gridDates,
        monthDataByDate,
        topMonthClients,
        upsertDay,
        deleteDay,
        undoLastChange,
        hasUndo,
        saveCount,
        reloadFromStorage,
        prevMonth,
        nextMonth,
        goToday,
        setMonthYear,
        setData,
    };
}

