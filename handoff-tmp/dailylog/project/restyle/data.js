// Data fixtures for DailyLog restyle.
// One month (Maggio 2026) populated with realistic Italian content.
// Variants share this — they only restyle the rendering layer.

(function () {
  const TODAY = new Date(2026, 4, 8); // Fri 8 May 2026
  const MONTH = 4, YEAR = 2026;

  // Color tokens for clients/types
  const CLIENTS = {
    Acme:    "#D97706", // amber
    Globex:  "#0EA5E9", // sky
    Initech: "#7C3AED", // violet
    Hooli:   "#EC4899", // pink
  };

  // Italian holidays falling in May 2026
  const HOLIDAYS = new Set(["2026-05-01"]); // Festa del Lavoro

  function ymd(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  // entry helpers
  const C = (client, title) => ({ type: "client", client, title, color: CLIENTS[client] });
  const I = (title) => ({ type: "internal", title, color: "#94A3B8" });
  const V = (title = "Ferie") => ({ type: "vacation", title, color: "#10B981" });
  const E = (title) => ({ type: "event", title, color: "#A78BFA" });

  // Days schema:
  //   { AM, PM, location?: "remote"|"office"|"client", hours?: { "09:00": entry, ... } }
  // hours overrides AM/PM when present (granular timing for Day view).
  const DAYS = {
    "2026-05-01": { holiday: "Festa del Lavoro" },
    "2026-05-04": { AM: C("Acme", "Refactor checkout"), PM: C("Acme", "Refactor checkout"), location: "office" },
    "2026-05-05": { AM: C("Globex", "Design review"), PM: I("Riunione di team"), location: "office" },
    "2026-05-06": { AM: C("Initech", "Onboarding flow"), PM: C("Initech", "Pairing UX"), location: "remote" },
    "2026-05-07": { AM: C("Globex", "Search ranking"), PM: C("Globex", "Search ranking"), location: "client" },
    "2026-05-08": {
      location: "remote",
      hours: {
        "09:00": C("Globex", "Stand-up & triage"),
        "09:30": C("Globex", "Stand-up & triage"),
        "10:00": C("Globex", "Indexer fix"),
        "10:30": C("Globex", "Indexer fix"),
        "11:00": C("Globex", "Indexer fix"),
        "11:30": C("Globex", "Indexer fix"),
        "12:00": I("Demo interno"),
        "12:30": I("Demo interno"),
        "14:00": C("Globex", "Pairing — search ranking"),
        "14:30": C("Globex", "Pairing — search ranking"),
        "15:00": C("Globex", "Pairing — search ranking"),
        "15:30": C("Globex", "Pairing — search ranking"),
        "16:00": C("Hooli", "Discovery call"),
        "16:30": C("Hooli", "Discovery call"),
        "17:00": I("Note + log"),
        "17:30": I("Note + log"),
      }
    },
    "2026-05-11": { AM: C("Acme", "Bugfixes sprint"), PM: C("Acme", "Bugfixes sprint"), location: "remote" },
    "2026-05-12": { AM: C("Globex", "Sprint planning"), PM: C("Globex", "Tech spec ranking"), location: "remote" },
    "2026-05-13": { AM: V(), PM: V(), location: "remote" },
    "2026-05-14": { AM: V(), PM: V(), location: "remote" },
    "2026-05-15": { AM: V(), PM: V(), location: "remote" },
    "2026-05-18": { AM: C("Hooli", "Workshop discovery"), PM: C("Hooli", "Workshop discovery"), location: "client" },
    "2026-05-19": { AM: C("Hooli", "Sintesi insight"), PM: C("Initech", "Code review"), location: "office" },
    "2026-05-20": { AM: C("Initech", "Auth refactor"), PM: C("Initech", "Auth refactor"), location: "remote" },
    "2026-05-21": { AM: E("Conferenza UX Roma"), PM: E("Conferenza UX Roma"), location: "client" },
    "2026-05-22": { AM: E("Conferenza UX Roma"), PM: I("Recap team"), location: "office" },
    "2026-05-25": { AM: C("Acme", "Performance audit"), PM: C("Acme", "Performance audit"), location: "office" },
    "2026-05-26": { AM: C("Globex", "Indexing pipeline"), PM: C("Globex", "Indexing pipeline"), location: "remote" },
    "2026-05-27": { AM: C("Globex", "Roadmap Q3"), PM: I("1:1 con Marco"), location: "remote" },
    "2026-05-28": { AM: C("Initech", "Mobile onboarding"), PM: C("Initech", "Mobile onboarding"), location: "remote" },
    "2026-05-29": { AM: I("Retrospettiva mensile"), PM: I("Pulizia inbox tickets"), location: "office" },
  };

  // Build calendar grid for Maggio 2026 (Mon-first, 6 weeks max)
  function buildGrid() {
    const first = new Date(YEAR, MONTH, 1);
    const dow = (first.getDay() + 6) % 7; // Mon = 0
    const start = new Date(first); start.setDate(first.getDate() - dow);
    const grid = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      grid.push(d);
    }
    while (grid.length > 35 && grid[grid.length - 1].getMonth() !== MONTH && grid[grid.length - 8].getMonth() !== MONTH) {
      grid.length -= 7;
    }
    return grid;
  }

  // Summary
  const SUMMARY = {
    workingDays: 21,
    workedDays: 18,
    clients: [
      { name: "Globex",  days: 7.0 },
      { name: "Acme",    days: 4.0 },
      { name: "Initech", days: 3.5 },
      { name: "Hooli",   days: 1.5 },
    ],
    other: [
      { key: "internal", label: "Internal",  days: 2.0 },
      { key: "vacation", label: "Ferie",     days: 3.0 },
      { key: "event",    label: "Eventi",    days: 1.5 },
    ],
  };

  // To-dos
  const TODOS = [
    { title: "Fixare crash su documenti malformati nell'indexer", project: "Globex", tag: "bug", due: "Oggi" },
    { title: "Scrivere test per la gestione errori", project: "Globex", tag: "qa", due: "Lun 11" },
    { title: "Rivedere la spec ranking con il team", project: "Globex", due: "Mar 12" },
    { title: "Inviare proposta di workshop a Hooli", project: "Hooli", tag: "biz", due: "Mer 13" },
    { title: "Aggiornare il preventivo per Acme Q3", project: "Acme", tag: "biz" },
    { title: "Pubblicare retrospettiva di aprile", project: "Internal" },
    { title: "Verificare migrazione DB Initech (staging)", project: "Initech", tag: "dev" },
  ];
  const TODOS_DONE = [
    { title: "Inviare timesheet aprile a Maria", project: "Internal" },
    { title: "Setup ambiente dev per Hooli", project: "Hooli" },
  ];

  const PEOPLE = [
    { name: "Marco R.", initials: "MR" },
    { name: "Sara B.", initials: "SB" },
    { name: "Luca P.", initials: "LP" },
    { name: "Giulia T.", initials: "GT" },
  ];

  window.DL_DATA = {
    TODAY, MONTH, YEAR, CLIENTS, HOLIDAYS, DAYS, SUMMARY, TODOS, TODOS_DONE, PEOPLE,
    ymd, grid: buildGrid(),
  };
})();
