export const TASK_TYPES = [
  { id: "internal", label: "Task interni" },
  { id: "client", label: "Task per cliente" },
  { id: "vacation", label: "Ferie" },
  { id: "event", label: "Evento" },
];

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
      return "bg-emerald-100 text-emerald-800";
    case "event":
      return "bg-purple-100 text-purple-800";
    case "client":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-200 text-slate-800";
  }
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
