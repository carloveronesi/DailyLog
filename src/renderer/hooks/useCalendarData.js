import { useEffect, useMemo, useState } from "react";
import { SLOT } from "../domain/tasks";
import { loadMonthData, saveMonthData } from "../services/storage";
import { dowMon0, ymd } from "../utils/date";

export function useCalendarData(initialYear, initialMonth) {
    const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth);
    const [data, setData] = useState(() => loadMonthData(year, month));

    // Reload data when year or month changes
    useEffect(() => {
        const loaded = loadMonthData(year, month);
        setData(loaded);
    }, [year, month]);

    // Persist on data change
    useEffect(() => {
        saveMonthData(year, month, data);
    }, [data, year, month]);

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
        return cells;
    }, [year, month]);

    const monthDataByDate = data?.byDate || {};

    const topMonthClients = useMemo(() => {
        const countByClient = new Map();
        for (const dateKey of Object.keys(monthDataByDate)) {
            const day = monthDataByDate[dateKey];
            for (const s of [SLOT.AM, SLOT.PM]) {
                const e = day?.[s];
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
    }, [monthDataByDate]);

    function upsertDay(date, entries) {
        const key = ymd(date);
        setData((prev) => {
            const next = { ...prev, byDate: { ...(prev.byDate || {}) } };
            const normalized = {
                AM: entries.AM || null,
                PM: entries.PM || null,
            };
            // If both slots are null, delete day
            if (!normalized.AM && !normalized.PM) {
                delete next.byDate[key];
            } else {
                next.byDate[key] = normalized;
            }
            return next;
        });
    }

    function deleteDay(date) {
        const key = ymd(date);
        setData((prev) => {
            const next = { ...prev, byDate: { ...(prev.byDate || {}) } };
            delete next.byDate[key];
            return next;
        });
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

    return {
        year,
        month,
        data,
        gridDates,
        monthDataByDate,
        topMonthClients,
        upsertDay,
        deleteDay,
        prevMonth,
        nextMonth,
        goToday,
        setData,
    };
}
