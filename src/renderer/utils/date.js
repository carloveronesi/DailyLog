export const pad2 = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const ymKey = (year, monthIndex0) => `${year}-${pad2(monthIndex0 + 1)}`;
export const sameYMD = (a, b) => ymd(a) === ymd(b);

export const monthNameIT = (monthIndex0) =>
  [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ][monthIndex0];

export const startOfMonth = (year, monthIndex0) => new Date(year, monthIndex0, 1);
export const endOfMonth = (year, monthIndex0) => new Date(year, monthIndex0 + 1, 0);
export const daysInMonth = (year, monthIndex0) => endOfMonth(year, monthIndex0).getDate();

// Monday-first calendar: convert JS getDay() (0=Sun..6=Sat) to (0=Mon..6=Sun)
export const dowMon0 = (d) => (d.getDay() + 6) % 7;
