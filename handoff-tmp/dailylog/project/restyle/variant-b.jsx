// Variant B — Geist Console
// Geist Sans + Geist Mono. Dense, hairline, sharp. Top color tab on cells.

(function () {
  const D = window.DL_DATA;
  const U = window.DL_UI;
  const { Icon, withAlpha, entryLabel, entryShortLabel, buildBlocks, SLOTS, HOUR_LABELS, MONTHS_IT, DOW_SHORT, DOW_LONG, dowMon0, isWeekend, isHoliday, sameDate } = U;

  // Theme B — Geist Console (light, dense, indigo accent, hairline borders)
  const T = {
    bg: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceMuted: "#F4F4F5",
    surfaceWeekend: "#F7F7F8",
    ink: "#0A0A0A",
    inkSoft: "#262626",
    muted: "#737373",
    mutedSoft: "#A3A3A3",
    border: "#E5E5E5",
    borderSoft: "#EDEDED",
    accent: "#5B5BD6",
    accentHover: "#4F4FCC",
    accentBg: "#F0F0FA",
    accentSoft: "#EBEBF8",
    rose: "#E5484D",
    amber: "#FFB224",
    success: "#30A46C",
    sans: '"Geist", "Inter", system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, "SF Mono", monospace',
  };

  // ---------- Sidebar (narrow icon rail) ----------
  function Sidebar({ active = "month" }) {
    const items = [
      { id: "day", icon: "day", label: "D" },
      { id: "week", icon: "week", label: "W" },
      { id: "month", icon: "calendar", label: "M" },
      { id: "projects", icon: "briefcase" },
      { id: "todo", icon: "todo" },
    ];
    return (
      <nav style={{ width: 56, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 2, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.ink, color: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.mono, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>D</div>
        <button style={{ width: 36, height: 36, borderRadius: 8, border: 0, background: "transparent", color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} strokeWidth={1.6} /></button>
        <div style={{ width: 24, height: 1, background: T.border, margin: "6px 0" }} />
        {items.map(it => (
          <button key={it.id} title={it.id} style={{
            width: 36, height: 36, borderRadius: 8, border: 0, cursor: "pointer",
            background: active === it.id ? T.ink : "transparent",
            color: active === it.id ? T.bg : T.muted,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Icon name={it.icon} size={17} strokeWidth={1.7} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{ width: 36, height: 36, borderRadius: 8, border: 0, background: "transparent", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="settings" size={17} /></button>
      </nav>
    );
  }

  // ---------- Header ----------
  function PageHeader({ view = "month" }) {
    const titles = {
      month: { tabs: ["Giorno", "Settimana", "Mese"], active: 2, title: "Maggio 2026", sub: "01 — 31 / 05 / 2026" },
      week:  { tabs: ["Giorno", "Settimana", "Mese"], active: 1, title: "Settimana 19", sub: "Lun 04 — Dom 10 / 05 / 2026" },
      day:   { tabs: ["Giorno", "Settimana", "Mese"], active: 0, title: "Venerdì 8 Maggio", sub: "08 / 05 / 2026 · Remoto" },
      editor:{ tabs: ["Giorno", "Settimana", "Mese"], active: 0, title: "Modifica voce", sub: "08 / 05 / 2026 · 14:00 — 16:00" },
    }[view];

    return (
      <header style={{ borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, background: T.surface }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: T.sans, fontSize: 20, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>{titles.title}</h1>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.muted, marginTop: 2 }}>{titles.sub}</div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Segmented view switcher */}
        <div style={{ display: "flex", padding: 2, background: T.surfaceMuted, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          {titles.tabs.map((t, i) => (
            <button key={t} style={{
              padding: "6px 12px", borderRadius: 6, border: 0, cursor: "pointer",
              background: titles.active === i ? T.surface : "transparent",
              color: titles.active === i ? T.ink : T.muted,
              fontFamily: T.sans, fontSize: 12.5, fontWeight: 500,
              boxShadow: titles.active === i ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 8, background: T.surface }}>
          <button style={navBtn()}><Icon name="chev-l" size={14} /></button>
          <div style={{ width: 1, height: 18, background: T.border }} />
          <button style={{ ...navBtn(), padding: "0 12px", fontFamily: T.sans, fontSize: 12.5, fontWeight: 500 }}>Oggi</button>
          <div style={{ width: 1, height: 18, background: T.border }} />
          <button style={navBtn()}><Icon name="chev-r" size={14} /></button>
        </div>

        {view === "month" && (
          <button style={ghostBtn()}><Icon name="repeat" size={13} style={{ marginRight: 6 }} /> Riempi mancanti</button>
        )}
        <button style={primaryBtn()}><Icon name="plus" size={13} style={{ marginRight: 4 }} /> Nuova voce</button>
      </header>
    );

    function navBtn()   { return { width: 32, height: 30, border: 0, background: "transparent", color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }; }
    function ghostBtn() { return { height: 32, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, cursor: "pointer", fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center" }; }
    function primaryBtn(){ return { height: 32, padding: "0 14px", borderRadius: 8, border: 0, background: T.ink, color: T.bg, cursor: "pointer", fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center" }; }
  }

  // ---------- Day cell (top color bar) ----------
  function DayCell({ d }) {
    const inMonth = d.getMonth() === D.MONTH;
    const wknd = isWeekend(d);
    const hol = isHoliday(d);
    const today = sameDate(d, D.TODAY);
    const data = D.DAYS[D.ymd(d)];

    let bg = T.surface;
    if (!inMonth) bg = "transparent";
    else if (hol) bg = "#FFF8E8";
    else if (wknd) bg = T.surfaceWeekend;

    // Determine top accent strip color
    let topColor = null;
    if (inMonth && !wknd && !hol && data) {
      if (data.hours) {
        const blocks = buildBlocks(data.hours);
        topColor = blocks[0]?.entry.color;
      } else if (data.AM) topColor = data.AM.color;
      else if (data.PM) topColor = data.PM.color;
    }

    return (
      <div style={{
        background: bg, border: `1px solid ${T.border}`, borderRadius: 6,
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden", minHeight: 0,
      }}>
        {topColor && <div style={{ height: 3, background: topColor }} />}
        {!topColor && <div style={{ height: 3 }} />}
        <div style={{ padding: "6px 8px 8px", display: "flex", flexDirection: "column", gap: 4, flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              fontFamily: T.mono, fontSize: 12, fontWeight: 500,
              color: !inMonth ? T.mutedSoft : (wknd || hol) ? T.muted : T.ink,
              ...(today ? { color: T.accent, fontWeight: 600 } : {}),
            }}>{String(d.getDate()).padStart(2, "0")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {today && <span style={{ width: 5, height: 5, borderRadius: 999, background: T.accent }} />}
              {inMonth && !wknd && !hol && data?.location && data.location !== "remote" && (
                <Icon name={data.location === "office" ? "building" : "users"} size={11} strokeWidth={1.7} style={{ color: T.muted }} />
              )}
            </div>
          </div>
          {hol && inMonth && (
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: "#946800", letterSpacing: "0.04em", marginTop: 4 }}>// festività</div>
          )}
          {inMonth && !hol && !wknd && data && <CellEntries data={data} />}
        </div>
      </div>
    );
  }

  function CellEntries({ data }) {
    if (data.hours) {
      const blocks = buildBlocks(data.hours);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflow: "hidden" }}>
          {blocks.slice(0, 4).map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, padding: "2px 6px", background: T.surfaceMuted, borderRadius: 3, border: `1px solid ${T.borderSoft}` }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: b.entry.color, flexShrink: 0 }} />
              <span style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted }}>{b.start}</span>
              <span style={{ flex: 1, fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryShortLabel(b.entry)}</span>
            </div>
          ))}
          {blocks.length > 4 && <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, paddingLeft: 6 }}>+{blocks.length - 4}</div>}
        </div>
      );
    }
    if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
      return <Bar entry={data.AM} period="ALL" full />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        <Bar entry={data.AM} period="AM" />
        <Bar entry={data.PM} period="PM" />
      </div>
    );
  }

  function Bar({ entry, period, full }) {
    if (!entry) {
      return <div style={{ flex: 1, border: `1px dashed ${T.border}`, borderRadius: 3, minHeight: 18, display: "flex", alignItems: "center", paddingLeft: 6, fontFamily: T.mono, fontSize: 9.5, color: T.mutedSoft }}>{period} · vuoto</div>;
    }
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flex: 1, minHeight: full ? 60 : 22,
        padding: "3px 6px", borderRadius: 3,
        background: T.surfaceMuted, border: `1px solid ${T.borderSoft}`,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 1, background: entry.color, flexShrink: 0 }} />
        <span style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, flexShrink: 0 }}>{period}</span>
        <span style={{ flex: 1, fontFamily: T.sans, fontSize: full ? 13 : 11, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryShortLabel(entry)}</span>
      </div>
    );
  }

  // ---------- Month view ----------
  function MonthView() {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, padding: 16, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DOW_SHORT.map((w, i) => (
              <div key={w} style={{ fontFamily: T.mono, fontSize: 10, color: i >= 5 ? T.muted : T.inkSoft, padding: "4px 8px" }}>{w.toLowerCase()}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 4, flex: 1, minHeight: 0 }}>
            {D.grid.map((d, i) => <DayCell key={i} d={d} />)}
          </div>
        </div>
        <SummaryPanel />
      </div>
    );
  }

  function SummaryPanel() {
    return (
      <aside style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSoft}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 2 }}>// summary</div>
          <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>Maggio 2026</div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${T.borderSoft}` }}>
          <Stat value={D.SUMMARY.workingDays} label="giorni" />
          <Stat value={D.SUMMARY.workedDays} label="compilati" border />
          <Stat value={`${Math.round(D.SUMMARY.workedDays / D.SUMMARY.workingDays * 100)}%`} label="completi" border />
        </div>

        <SectionTable title="Clienti" rows={D.SUMMARY.clients.map(c => ({ dot: D.CLIENTS[c.name], label: c.name, value: c.days, pct: c.days / D.SUMMARY.workedDays }))} />
        <SectionTable title="Altre attività" rows={D.SUMMARY.other.map(o => ({ dot: o.key === "internal" ? "#737373" : o.key === "vacation" ? T.success : "#A78BFA", label: o.label, value: o.days, pct: o.days / D.SUMMARY.workingDays }))} />

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.borderSoft}`, marginTop: "auto" }}>
          <button style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: 0, background: T.ink, color: T.bg, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="upload" size={13} /> Esporta CSV
          </button>
        </div>
      </aside>
    );
  }

  function Stat({ value, label, border }) {
    return (
      <div style={{ padding: "12px 14px", borderLeft: border ? `1px solid ${T.borderSoft}` : 0 }}>
        <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 1 }}>{label}</div>
      </div>
    );
  }

  function SectionTable({ title, rows }) {
    return (
      <div style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
        <div style={{ padding: "10px 16px 6px", fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: "0.02em" }}>// {title.toLowerCase()}</div>
        {rows.map((r, i) => (
          <div key={r.label} style={{ padding: "7px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: r.dot, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: T.sans, fontSize: 12.5, color: T.ink }}>{r.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.inkSoft, minWidth: 36, textAlign: "right" }}>{r.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }

  // ---------- Week view ----------
  function WeekView() {
    const weekStart = new Date(2026, 4, 4);
    const days = Array.from({length: 7}, (_, i) => { const x = new Date(weekStart); x.setDate(weekStart.getDate() + i); return x; });

    return (
      <div style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: `1px solid ${T.border}`, background: T.surfaceMuted }}>
            <div style={{ borderRight: `1px solid ${T.borderSoft}` }} />
            {days.map((d, i) => {
              const today = sameDate(d, new Date(2026,4,8));
              return (
                <div key={i} style={{ padding: "10px 12px", borderRight: i < 6 ? `1px solid ${T.borderSoft}` : 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: i >= 5 ? T.muted : T.inkSoft, textTransform: "lowercase" }}>{DOW_SHORT[i].toLowerCase()}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 600, color: today ? T.accent : (i >= 5 ? T.muted : T.ink), letterSpacing: "-0.02em" }}>{String(d.getDate()).padStart(2,"0")}</span>
                  {today && <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 9, color: T.accent, padding: "2px 5px", border: `1px solid ${T.accent}`, borderRadius: 3 }}>OGGI</span>}
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", position: "relative" }}>
            <div style={{ borderRight: `1px solid ${T.borderSoft}`, background: T.surfaceMuted }}>
              {HOUR_LABELS.slice(0, 9).map(h => (
                <div key={h} style={{ height: 60, padding: "3px 8px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 10, color: T.muted }}>{h}</div>
              ))}
            </div>
            {days.map((d, di) => <WeekDayCol key={di} d={d} last={di === 6} />)}
          </div>
        </div>
      </div>
    );
  }

  function WeekDayCol({ d, last }) {
    const wknd = isWeekend(d);
    const hol = isHoliday(d);
    const data = D.DAYS[D.ymd(d)];
    const slotH = 30;

    const items = [];
    if (data?.hours) {
      const blocks = buildBlocks(data.hours);
      blocks.forEach((b, i) => {
        const top = toMin(b.start) * slotH / 30;
        const height = (toMin(b.end) - toMin(b.start)) * slotH / 30 - 1;
        items.push({ key: `b${i}`, top, height, entry: b.entry, label: `${b.start}` });
      });
    } else if (data?.AM || data?.PM) {
      if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
        items.push({ key: "full", top: 0, height: 18 * slotH - 1, entry: data.AM, label: "tutto il gg" });
      } else {
        if (data.AM) items.push({ key: "am", top: 0, height: 8 * slotH - 1, entry: data.AM, label: "AM" });
        if (data.PM) items.push({ key: "pm", top: 10 * slotH, height: 8 * slotH - 1, entry: data.PM, label: "PM" });
      }
    }

    return (
      <div style={{ position: "relative", borderRight: last ? 0 : `1px solid ${T.borderSoft}`, background: wknd ? T.surfaceWeekend : T.surface, minHeight: 18 * slotH }}>
        {Array.from({length: 18}).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: "rgba(0,0,0,0.025)" }} />
        {hol && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 8 }}>
            <Icon name="flag" size={14} style={{ color: "#946800" }} />
            <div style={{ fontFamily: T.mono, fontSize: 10, color: "#946800", marginTop: 4 }}>// festività</div>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: "#946800", marginTop: 2, textAlign: "center" }}>1° Maggio</div>
          </div>
        )}
        {items.map(it => (
          <div key={it.key} style={{
            position: "absolute", left: 2, right: 2, top: it.top + 1, height: it.height,
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ height: 2, background: it.entry.color }} />
            <div style={{ padding: "3px 6px", flex: 1, minHeight: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted }}>{it.label}</div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, color: T.ink, lineHeight: 1.15, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryShortLabel(it.entry)}</div>
              {it.entry.title && entryShortLabel(it.entry) !== it.entry.title && it.height > 50 && (
                <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.muted, lineHeight: 1.25, marginTop: 1, overflow: "hidden" }}>{it.entry.title}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return (h - 9) * 60 + m; }

  // ---------- Day view + Todo ----------
  function DayView() {
    return (
      <div style={{ flex: 1, padding: 16, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <DayTimeline />
        <TodoPanel />
      </div>
    );
  }

  function DayTimeline() {
    const data = D.DAYS["2026-05-08"];
    const slotH = 36;
    const blocks = buildBlocks(data.hours);

    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>// 2026-05-08 · ven</div>
            <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 2 }}>8h registrate · 0h vuote</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>sede</span>
            {[["home", false], ["building", false], ["users", true]].map(([ic, a], i) => (
              <button key={i} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${a ? T.ink : T.border}`, background: a ? T.ink : T.surface, color: a ? T.bg : T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={ic} size={12} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "60px 1fr", position: "relative" }}>
          <div style={{ borderRight: `1px solid ${T.borderSoft}`, background: T.surfaceMuted }}>
            {HOUR_LABELS.slice(0, 9).map(h => (
              <div key={h} style={{ height: 72, padding: "4px 10px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 11, color: T.muted }}>{h}</div>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: "rgba(0,0,0,0.025)" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: T.mono, fontSize: 10, color: T.muted }}>// pausa pranzo</div>
            </div>
            {blocks.map((b, i) => {
              const top = toMin(b.start) * slotH / 30;
              const height = (toMin(b.end) - toMin(b.start)) * slotH / 30 - 4;
              return (
                <div key={i} style={{ position: "absolute", left: 8, right: 8, top: top + 2, height, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 3, background: b.entry.color }} />
                  <div style={{ padding: "8px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{b.start} → {b.end}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, padding: "1px 6px", border: `1px solid ${T.border}`, borderRadius: 3 }}>{b.entry.type === "client" ? "cliente" : b.entry.type}</span>
                    </div>
                    <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 4, letterSpacing: "-0.005em" }}>{entryShortLabel(b.entry)}</div>
                    {b.entry.title && entryShortLabel(b.entry) !== b.entry.title && height > 60 && (
                      <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 2 }}>{b.entry.title}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function TodoPanel() {
    return (
      <aside style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="todo" size={14} style={{ color: T.ink }} />
          <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink }}>To-do</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, padding: "1px 6px", background: T.surfaceMuted, borderRadius: 4 }}>{D.TODOS.length}</span>
          <div style={{ flex: 1 }} />
          <button style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={13} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {D.TODOS.map((t, i) => (
            <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${T.border}`, marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, padding: "1px 5px", background: T.surfaceMuted, borderRadius: 3, border: `1px solid ${T.borderSoft}` }}>{t.project}</span>
                  {t.tag && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, padding: "1px 5px", background: T.accentBg, borderRadius: 3, border: `1px solid ${T.accentSoft}` }}>{t.tag}</span>}
                  {t.due && <span style={{ fontFamily: T.mono, fontSize: 10, color: t.due === "Oggi" ? T.rose : T.muted }}>{t.due}</span>}
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderSoft}` }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 6 }}>// fatti</div>
          </div>
          {D.TODOS_DONE.map((t, i) => (
            <div key={i} style={{ padding: "8px 14px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: T.success, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="check" size={9} strokeWidth={3} /></div>
              <div style={{ flex: 1, fontFamily: T.sans, fontSize: 12.5, color: T.muted, textDecoration: "line-through" }}>{t.title}</div>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>{t.project}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ---------- Editor ----------
  function EditorView() {
    return (
      <div style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>// /day/2026-05-08/entries/3</div>
            <div style={{ flex: 1 }} />
            <button style={{ height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontFamily: T.sans, fontSize: 12.5, cursor: "pointer" }}>Annulla</button>
            <button style={{ height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.rose, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>Elimina</button>
            <button style={{ height: 30, padding: "0 14px", borderRadius: 6, border: 0, background: T.ink, color: T.bg, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>Salva</button>
          </div>

          <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, borderRight: `1px solid ${T.borderSoft}` }}>
              <input value="Pairing — search ranking" style={{ border: 0, outline: 0, background: "transparent", fontFamily: T.sans, fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em", padding: 0 }} />
              <Row label="Tipo">
                <Segmented options={["Cliente", "Internal", "Ferie", "Evento"]} active={0} />
              </Row>
              <Row label="Cliente">
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 32, border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: D.CLIENTS["Globex"] }} />
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, flex: 1 }}>Globex</span>
                  <Icon name="chev-d" size={12} style={{ color: T.muted }} />
                </div>
              </Row>
              <Row label="Sottotipo">
                <Segmented options={["Sviluppo", "Design", "Pairing", "Ricerca"]} active={2} />
              </Row>
              <Row label="Sede">
                <div style={{ display: "flex", gap: 6 }}>
                  {[["home", "Remoto", false], ["building", "Ufficio", true], ["users", "Cliente", false]].map(([ic, l, a], i) => (
                    <button key={i} style={{ flex: 1, height: 32, borderRadius: 6, border: `1px solid ${a ? T.ink : T.border}`, background: a ? T.ink : T.surface, color: a ? T.bg : T.inkSoft, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon name={ic} size={12} /> {l}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Orario">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ height: 32, padding: "0 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, display: "flex", alignItems: "center", fontFamily: T.mono, fontSize: 13, color: T.ink }}>14:00</span>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>—</span>
                  <span style={{ height: 32, padding: "0 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, display: "flex", alignItems: "center", fontFamily: T.mono, fontSize: 13, color: T.ink }}>16:00</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, padding: "3px 6px", background: T.surfaceMuted, borderRadius: 3 }}>2.0 h</span>
                </div>
              </Row>
              <Row label="Collaboratori">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {D.PEOPLE.slice(0,2).map(p => (
                    <span key={p.name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 3px", border: `1px solid ${T.border}`, borderRadius: 999, background: T.surface }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: T.accentBg, color: T.accent, fontFamily: T.mono, fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.initials}</span>
                      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink }}>{p.name}</span>
                    </span>
                  ))}
                  <span style={{ padding: "3px 9px", border: `1px dashed ${T.border}`, borderRadius: 999, fontFamily: T.sans, fontSize: 12, color: T.muted, cursor: "pointer" }}>+ Aggiungi</span>
                </div>
              </Row>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <Row label="Note">
                <div style={{ minHeight: 90, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.55 }}>
                  Sessione di pairing su ranking ricerca. Discussa la strategia BM25 con boost editoriale; Marco ha proposto un'implementazione incrementale partendo dai segnali di click.
                </div>
              </Row>
              <Row label="Cosa è andato storto">
                <div style={{ minHeight: 60, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontFamily: T.sans, fontSize: 13, color: T.muted, lineHeight: 1.55, fontStyle: "italic" }}>
                  Indexer ha avuto un crash su 3 documenti malformati — da gestire con try/catch.
                </div>
              </Row>
              <Row label="Prossimi passi">
                <div style={{ minHeight: 60, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface, fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.55 }}>
                  Lunedì: implementare gestione documenti malformati + scrivere test.
                </div>
              </Row>
              <Row label="Allegati">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.surfaceMuted }}>
                    <Icon name="upload" size={13} style={{ color: T.muted }} />
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.ink }}>ranking-notes.md</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginLeft: "auto" }}>4.2 KB</span>
                  </div>
                  <button style={{ padding: "8px 10px", border: `1px dashed ${T.border}`, borderRadius: 6, background: "transparent", color: T.muted, fontFamily: T.sans, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Icon name="plus" size={12} /> Aggiungi allegato
                  </button>
                </div>
              </Row>
            </div>
          </div>
        </div>
      </div>
    );

    function Row({ label, children }) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, paddingTop: 8 }}>{label}</div>
          <div>{children}</div>
        </div>
      );
    }
    function Segmented({ options, active }) {
      return (
        <div style={{ display: "inline-flex", padding: 2, background: T.surfaceMuted, border: `1px solid ${T.border}`, borderRadius: 6 }}>
          {options.map((o, i) => (
            <button key={o} style={{
              padding: "5px 12px", borderRadius: 4, border: 0, cursor: "pointer",
              background: i === active ? T.surface : "transparent",
              color: i === active ? T.ink : T.muted,
              fontFamily: T.sans, fontSize: 12, fontWeight: 500,
              boxShadow: i === active ? "0 1px 1px rgba(0,0,0,0.06)" : "none",
            }}>{o}</button>
          ))}
        </div>
      );
    }
  }

  // ---------- Root ----------
  function VariantB({ view = "month" }) {
    return (
      <div style={{ width: "100%", height: "100%", background: T.bg, color: T.ink, fontFamily: T.sans, display: "flex", overflow: "hidden" }}>
        <Sidebar active={view === "editor" ? "day" : view} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <PageHeader view={view} />
          {view === "month" && <MonthView />}
          {view === "week" && <WeekView />}
          {view === "day" && <DayView />}
          {view === "editor" && <EditorView />}
        </div>
      </div>
    );
  }

  window.VariantB = VariantB;
})();
