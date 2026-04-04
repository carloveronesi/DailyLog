import { createContext, useContext } from "react";

export const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings deve essere usato all'interno di SettingsContext.Provider");
  return ctx;
}
