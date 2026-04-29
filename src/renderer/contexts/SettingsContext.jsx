import { createContext, useContext, useMemo } from "react";
import { buildWorkSlots, buildSlots } from "../domain/tasks";

export const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve essere usato all'interno di SettingsContext.Provider");
  return ctx;
}

export function useWorkSlots(customSettings) {
  const ctx = useContext(SettingsContext);
  const settings = customSettings || ctx?.settings;
  if (!settings) throw new Error("useWorkSlots deve essere usato all'interno di SettingsContext.Provider o ricevere customSettings");
  
  return useMemo(() => {
    const wh = settings.workHours;
    const { MORNING_SLOTS, AFTERNOON_SLOTS, WORK_SLOTS, HOURS_PER_DAY } = buildWorkSlots(wh);
    const BREAK_START = wh.morningEnd;
    const BREAK_END = wh.afternoonStart;
    const BREAK_SLOTS = buildSlots(BREAK_START, BREAK_END);
    const DAY_SLOTS = [...MORNING_SLOTS, ...BREAK_SLOTS, ...AFTERNOON_SLOTS];
    return { MORNING_SLOTS, AFTERNOON_SLOTS, WORK_SLOTS, HOURS_PER_DAY, BREAK_START, BREAK_END, DAY_SLOTS };
  }, [settings?.workHours]);
}
