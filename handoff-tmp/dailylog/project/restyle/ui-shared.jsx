// DailyLog restyle — shared helpers and icons used by all 3 variants.
// Loads BEFORE variant files. Exports to window.DL_UI.

(function () {
  const D = window.DL_DATA;

  // Italian day/month names
  const DOW_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const DOW_LONG  = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
  const MONTHS_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

  function dowMon0(d) { return (d.getDay() + 6) % 7; }
  function isWeekend(d) { const x = d.getDay(); return x === 0 || x === 6; }
  function isHoliday(d) { return D.HOLIDAYS.has(D.ymd(d)); }
  function sameDate(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  // Icons — minimal, single stroke, currentColor
  function Icon({ name, size = 16, strokeWidth = 1.6, style }) {
    const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", style };
    switch (name) {
      case "search":   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
      case "calendar": return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>;
      case "week":     return <svg {...props}><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5v14M15 5v14"/></svg>;
      case "day":      return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
      case "briefcase":return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>;
      case "todo":     return <svg {...props}><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>;
      case "settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
      case "plus":     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
      case "chev-l":   return <svg {...props}><path d="m15 6-6 6 6 6"/></svg>;
      case "chev-r":   return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
      case "chev-d":   return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
      case "x":        return <svg {...props}><path d="m18 6-12 12M6 6l12 12"/></svg>;
      case "home":     return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
      case "building": return <svg {...props}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>;
      case "users":    return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
      case "clock":    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
      case "check":    return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
      case "circle":   return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
      case "circle-dashed": return <svg {...props} strokeDasharray="2 3"><circle cx="12" cy="12" r="9"/></svg>;
      case "repeat":   return <svg {...props}><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
      case "upload":   return <svg {...props}><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></svg>;
      case "tag":      return <svg {...props}><path d="M20.59 13.41 13 21l-9-9V4h8l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></svg>;
      case "flag":     return <svg {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V15"/></svg>;
      case "edit":     return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
      case "trash":    return <svg {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
      case "dot":      return <svg {...props} fill="currentColor" stroke="none"><circle cx="12" cy="12" r="4"/></svg>;
      case "mic":      return <svg {...props}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>;
      case "save":     return <svg {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>;
      case "arrow-r":  return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
      case "circle-half": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor" strokeWidth="0"/></svg>;
      default: return null;
    }
  }

  // Tint a hex with alpha
  function withAlpha(hex, alpha) {
    if (!hex) return undefined;
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function entryLabel(e) {
    if (!e) return "";
    if (e.type === "client") return e.client + (e.title ? ` — ${e.title}` : "");
    if (e.type === "vacation") return "Ferie";
    if (e.type === "event") return e.title || "Evento";
    return e.title || "Internal";
  }

  function entryShortLabel(e) {
    if (!e) return "";
    if (e.type === "client") return e.client;
    if (e.type === "vacation") return "Ferie";
    if (e.type === "event") return e.title || "Evento";
    return e.title || "Internal";
  }

  // group hours into consecutive blocks of same task
  function buildBlocks(hours) {
    if (!hours) return [];
    const slots = Object.keys(hours).sort();
    const blocks = [];
    let cur = null;
    for (const k of slots) {
      const e = hours[k];
      if (cur && cur.entry.title === e.title && cur.entry.client === e.client && cur.entry.type === e.type) {
        cur.end = addHalf(k);
        cur.slots.push(k);
      } else {
        if (cur) blocks.push(cur);
        cur = { start: k, end: addHalf(k), entry: e, slots: [k] };
      }
    }
    if (cur) blocks.push(cur);
    return blocks;
  }
  function addHalf(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    let mm = h * 60 + m + 30;
    return `${String(Math.floor(mm/60)).padStart(2,"0")}:${String(mm%60).padStart(2,"0")}`;
  }

  // Slot times for week/day timelines
  const SLOTS = (() => {
    const out = [];
    for (let h = 9; h < 13; h++) { out.push(`${String(h).padStart(2,"0")}:00`); out.push(`${String(h).padStart(2,"0")}:30`); }
    for (let h = 14; h < 18; h++) { out.push(`${String(h).padStart(2,"0")}:00`); out.push(`${String(h).padStart(2,"0")}:30`); }
    return out;
  })();
  const HOUR_LABELS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  window.DL_UI = {
    DOW_SHORT, DOW_LONG, MONTHS_IT,
    dowMon0, isWeekend, isHoliday, sameDate,
    Icon, withAlpha, entryLabel, entryShortLabel,
    buildBlocks, addHalf, SLOTS, HOUR_LABELS,
  };
})();
