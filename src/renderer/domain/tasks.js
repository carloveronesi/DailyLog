export const TASK_TYPES = [
  { id: "client", label: "Task per cliente" },
  { id: "internal", label: "Task interni" },
  { id: "vacation", label: "Ferie" },
  { id: "event", label: "Evento" },
];

const CLIENT_COLOR_PALETTE = [
  "#93C5FD",
  "#F9A8D4",
  "#A7F3D0",
  "#FCD34D",
  "#C4B5FD",
  "#FCA5A5",
  "#67E8F9",
  "#FDBA74",
  "#86EFAC",
  "#A5B4FC",
  "#F5D0FE",
  "#99F6E4",
];

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const SLOT = {
  AM: "AM",
  PM: "PM",
};

export const SLOT_MINUTES = 30;

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function slotMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 24 ? value * 60 : value;
  }
  if (typeof value !== "string") return 0;
  const raw = value.trim();
  if (!raw) return 0;
  if (raw.includes(":")) {
    const [h, m] = raw.split(":");
    const hh = Number.parseInt(h, 10);
    const mm = Number.parseInt(m || "0", 10);
    return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
  }
  const asNum = Number.parseInt(raw, 10);
  if (!Number.isFinite(asNum)) return 0;
  if (raw.length <= 2) return asNum * 60;
  const hh = Math.floor(asNum / 100);
  const mm = asNum % 100;
  return hh * 60 + mm;
}

export function slotKey(value) {
  const mins = slotMinutes(value);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function slotLabel(value) {
  return slotKey(value);
}

function buildSlots(startMin, endMin) {
  const out = [];
  for (let m = startMin; m < endMin; m += SLOT_MINUTES) out.push(m);
  return out;
}

export const MORNING_SLOTS = buildSlots(9 * 60, 13 * 60); // 09:00 -> 12:30
export const AFTERNOON_SLOTS = buildSlots(14 * 60, 18 * 60); // 14:00 -> 17:30
export const WORK_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
export const HOURS_PER_DAY = WORK_SLOTS.length / 2; // 8

export function hourKey(h) {
  return slotKey(h);
}

export function hourLabel(h) {
  return slotLabel(h);
}

export function hasMorningHours(dayData) {
  if (!dayData?.hours) return false;
  return MORNING_SLOTS.some((h) => dayData.hours[slotKey(h)]);
}

export function hasAfternoonHours(dayData) {
  if (!dayData?.hours) return false;
  return AFTERNOON_SLOTS.some((h) => dayData.hours[slotKey(h)]);
}

export function defaultEntry() {
  return {
    type: "internal",
    subtypeId: null,
    title: "",
    client: "",
    collaborators: [],
    notes: "",
    wentWrong: "",
    nextSteps: "",
  };
}

export function badgeStyle(type) {
  switch (type) {
    case "vacation":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "event":
      return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300";
    case "client":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
    default:
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  }
}

export function normalizeClientKey(clientName) {
  return (clientName || "").trim().toLocaleLowerCase("it-IT");
}

export function normalizeHexColor(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!HEX_COLOR_RE.test(raw)) return "";
  if (raw.length === 4) {
    const expanded = raw
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  return raw.toUpperCase();
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function textColorForBackground(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#0F172A";
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 150 ? "#0F172A" : "#F8FAFC";
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function getClientColor(clientName, clientColors = {}) {
  const key = normalizeClientKey(clientName);
  const configured = normalizeHexColor(clientColors?.[key]);
  if (configured) return configured;

  const idx = key ? hashString(key) % CLIENT_COLOR_PALETTE.length : 0;
  return CLIENT_COLOR_PALETTE[idx];
}

export function badgePresentation(entry, clientColors = {}) {
  if (!entry || entry.type !== "client") {
    return { className: badgeStyle(entry?.type), style: undefined };
  }

  const bg = getClientColor(entry.client, clientColors);
  return {
    className: "border",
    style: {
      backgroundColor: bg,
      borderColor: withAlpha(bg, 0.9),
      color: textColorForBackground(bg),
    },
  };
}

export function ensureSubtypesFormat(settingsSubtypes) {
  if (!settingsSubtypes) return {};
  const migrated = {};
  for (const [typeId, list] of Object.entries(settingsSubtypes)) {
    migrated[typeId] = list.map((item) => {
      if (typeof item === "string") {
        return {
          id: item.toLowerCase().trim().replace(/[\s\W-]+/g, "-"),
          label: item,
        };
      }
      return item;
    });
  }
  return migrated;
}

export function getSubtypeLabel(type, subtypeId, taskSubtypes) {
  if (!subtypeId) return "Generico";
  const list = taskSubtypes?.[type] || [];
  const found = list.find((st) => st.id === subtypeId);
  return found ? found.label : "Generico";
}

export function displayLabel(entry, taskSubtypes = {}) {
  if (!entry) return "";
  const subtypeLabel = entry.subtypeId ? getSubtypeLabel(entry.type, entry.subtypeId, taskSubtypes) : "";
  const t = (entry.title || "").trim();
  
  const formatLabel = (defaultLabel) => {
    let base = t || defaultLabel;
    if (subtypeLabel && subtypeLabel !== "Generico") {
      return `${subtypeLabel}${t ? ` - ${t}` : ""}`;
    }
    return base;
  };

  if (entry.type === "client") {
    const c = (entry.client || "").trim();
    const tLabel = formatLabel("");
    if (c && tLabel) return `${c} - ${tLabel}`;
    if (c) return c;
  }
  if (entry.type === "vacation") return formatLabel("Ferie");
  if (entry.type === "event") return formatLabel("Evento");
  return formatLabel("Internal");
}

export function isSameTaskEntry(a, b, taskSubtypes = {}) {
  if (!a || !b) return false;
  const typeA = a.type || "internal";
  const typeB = b.type || "internal";
  if (typeA !== typeB) return false;
  if (a.subtypeId !== b.subtypeId) return false;
  const labelA = displayLabel(a, taskSubtypes).trim().toLocaleLowerCase("it-IT");
  const labelB = displayLabel(b, taskSubtypes).trim().toLocaleLowerCase("it-IT");
  return labelA !== "" && labelA === labelB;
}
