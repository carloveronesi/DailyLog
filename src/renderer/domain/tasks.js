export const TASK_TYPES = [
  { id: "internal", label: "Task interni" },
  { id: "client", label: "Task per cliente" },
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

export function defaultEntry() {
  return {
    type: "internal",
    title: "",
    client: "",
    notes: "",
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

export function displayLabel(entry) {
  if (!entry) return "";
  if (entry.type === "client") {
    const c = (entry.client || "").trim();
    if (c) return c;
  }
  if (entry.type === "vacation") return "Ferie";
  if (entry.type === "event") return entry.title?.trim() ? entry.title.trim() : "Evento";
  return entry.title?.trim() ? entry.title.trim() : "Internal";
}
