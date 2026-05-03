import { useState, useEffect, useCallback } from "react";

/**
 * Gestisce tutto lo stato UI di navigazione: modal aperti, vista corrente,
 * data attiva, selezione editor, filtri summary.
 *
 * @param {object} params
 * @param {object} params.settings        - oggetto settings (per defaultView)
 * @param {Function} params.setMonthYear  - da useCalendarData, usato in goTodayDay
 */
export function useUIState({ settings, setMonthYear }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [summaryHoverFilter, setSummaryHoverFilter] = useState(null);
  const [summaryFixedFilter, setSummaryFixedFilter] = useState(null);
  const [viewMode, setViewMode] = useState("day");
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [hasInitializedView, setHasInitializedView] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);
  const [detailDate, setDetailDate] = useState(null);
  const [detailStart, setDetailStart] = useState(null);
  const [detailEnd, setDetailEnd] = useState(null);
  const [detailSlot, setDetailSlot] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    startDate: "",
    endDate: "",
    collaborator: "",
    project: "",
    type: "",
    subtypeId: ""
  });

  useEffect(() => {
    if (!hasInitializedView && settings?.defaultView) {
      setViewMode(settings.defaultView);
      setHasInitializedView(true);
    }
  }, [settings?.defaultView, hasInitializedView]);

  function openDetail(date, entry, start, end, slot) {
    setDetailDate(date);
    setDetailEntry(entry);
    setDetailStart(start ?? null);
    setDetailEnd(end ?? null);
    setDetailSlot(slot ?? null);
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    setDetailEntry(null);
    setDetailDate(null);
    setDetailStart(null);
    setDetailEnd(null);
    setDetailSlot(null);
  }

  function openEditor(date, slotOrRange = null) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedRange(null);
    if (slotOrRange && typeof slotOrRange === "object" && slotOrRange.start !== undefined) {
      setSelectedRange(slotOrRange);
    } else {
      setSelectedSlot(slotOrRange);
    }
    setActiveDate(date);
    setEditorOpen(true);
  }

  const openDayFromMonth = useCallback((date) => {
    setActiveDate(date);
    setViewMode("day");
  }, []);

  function closeEditor() {
    setEditorOpen(false);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedRange(null);
  }

  function goPrevDay() {
    setActiveDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goNextDay() {
    setActiveDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function goTodayDay() {
    const now = new Date();
    setActiveDate(now);
    setMonthYear(now.getFullYear(), now.getMonth());
  }

  return {
    selectedDate, selectedSlot, selectedRange,
    editorOpen, setEditorOpen,
    settingsOpen, setSettingsOpen,
    searchOpen, setSearchOpen,
    summaryHoverFilter, setSummaryHoverFilter,
    summaryFixedFilter, setSummaryFixedFilter,
    viewMode, setViewMode,
    activeDate, setActiveDate,
    showBackupConfirm, setShowBackupConfirm,
    openEditor, openDayFromMonth, closeEditor,
    goPrevDay, goNextDay, goTodayDay,
    searchFilters, setSearchFilters,
    detailOpen, detailEntry, detailDate, detailStart, detailEnd, detailSlot,
    openDetail, closeDetail,
  };
}
