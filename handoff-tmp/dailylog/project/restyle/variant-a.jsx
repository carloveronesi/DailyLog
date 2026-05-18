// Variant A — Plex Editorial
// IBM Plex Sans + Plex Mono. Warm off-white. Hairline borders. Generous spacing.
// Cell style: white card with thin 3px colored left bar (Things/Linear).

(function () {
  const D = window.DL_DATA;
  const U = window.DL_UI;
  const { Icon, withAlpha, entryLabel, entryShortLabel, buildBlocks, SLOTS, HOUR_LABELS, MONTHS_IT, DOW_SHORT, DOW_LONG, dowMon0, isWeekend, isHoliday, sameDate } = U;

  // Theme A
  const T = {
    bg: "#FAF7F0",
    surface: "#FFFFFF",
    surfaceMuted: "#F4EFE3",
    ink: "#1B1A17",
    inkSoft: "#3D3A33",
    muted: "#75705F",
    border: "#E8E1CE",
    borderSoft: "#EFEAD9",
    accent: "#4F46E5",
    accentSoft: "#EEF0FB",
    accentBg: "#F2F1FC",
    rose: "#B22A2A",
    amber: "#9A6B00",
    sans: '"IBM Plex Sans", "Helvetica Neue", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", monospace',
    serif: '"IBM Plex Serif", Georgia, serif',
  };

  // ---------- Sidebar ----------
  function Sidebar({ active = "month" }) {
    const items = [
      { id: "search",   icon: "search",    label: "Cerca" },
      { id: "day",      icon: "day",       label: "Giorno" },
      { id: "week",     icon: "week",      label: "Settimana" },
      { id: "month",    icon: "calendar",  label: "Mese" },
      { id: "projects", icon: "briefcase", label: "Progetti" },
      { id: "todo",     icon: "todo",      label: "To-do" },
    ];
    return (
      <nav style={{ width: 92, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 4, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.ink, color: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontWeight: 700, fontSize: 19, marginBottom: 16 }}>D</div>
        {items.map((it, i) => (
          <React.Fragment key={it.id}>
            {i === 4 && <div style={{ width: 28, height: 1, background: T.border, margin: "8px 0" }} />}
            <button style={{ ...sideBtn(active === it.id), border: 0, background: "transparent", cursor: "pointer", padding: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: active === it.id ? T.accent : T.inkSoft, background: active === it.id ? T.accentBg : "transparent" }}>
                <Icon name={it.icon} size={20} strokeWidth={1.5} />
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: active === it.id ? T.accent : T.muted, marginTop: 2 }}>{it.label}</div>
            </button>
          </React.Fragment>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{ ...sideBtn(false), border: 0, background: "transparent", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}>
            <Icon name="settings" size={20} strokeWidth={1.5} />
          </div>
        </button>
      </nav>
    );
  }
  function sideBtn() { return { display: "flex", flexDirection: "column", alignItems: "center" }; }

  // ---------- Header ----------
  function PageHeader({ view = "month" }) {
    const labels = { month: ["Maggio", "2026"], week: ["Settimana 19", "4 — 10 Maggio 2026"], day: ["Venerdì", "8 Maggio 2026"], editor: ["Editor", "Venerdì 8 Maggio 2026"] };
    const [eyebrow, title] = view === "month" ? ["Mese", `${labels.month[0]} ${labels.month[1]}`] :
                              view === "week"  ? ["Settimana", labels.week[1]] :
                              view === "day"   ? ["Giorno", `${labels.day[0]} ${labels.day[1]}`] :
                                                 ["Editor", labels.editor[1]];
    return (
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "24px 32px 20px", borderBottom: `1px solid ${T.borderSoft}` }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>DailyLog · {eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 600, fontSize: 38, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 }}>{title}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={iconBtn()}><Icon name="chev-l" size={16} /></button>
          <button style={iconBtn()}><Icon name="chev-r" size={16} /></button>
          <button style={textBtn()}>Oggi</button>
          {view === "month" && <button style={textBtn()}><Icon name="repeat" size={14} style={{ marginRight: 6 }} /> Riempi</button>}
          <button style={accentBtn()}><Icon name="plus" size={14} style={{ marginRight: 4 }} /> Nuovo</button>
        </div>
      </header>
    );

    function iconBtn() {
      return { width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
    }
    function textBtn() {
      return { height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, cursor: "pointer", fontFamily: T.sans, fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center" };
    }
    function accentBtn() {
      return { height: 36, padding: "0 16px", borderRadius: 10, border: 0, background: T.ink, color: T.bg, cursor: "pointer", fontFamily: T.sans, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", letterSpacing: "-0.01em" };
    }
  }

  // ---------- Day cell ----------
  function DayCell({ d }) {
    const inMonth = d.getMonth() === D.MONTH;
    const wknd = isWeekend(d);
    const hol = isHoliday(d);
    const today = sameDate(d, D.TODAY);
    const key = D.ymd(d);
    const data = D.DAYS[key];

    let bg = T.surface;
    let border = T.border;
    let dayColor = T.ink;
    if (!inMonth) { bg = "transparent"; dayColor = "#BFB7A0"; }
    else if (hol) { bg = "#F8F2E2"; border = "#EBDFB8"; dayColor = T.amber; }
    else if (wknd) { bg = "#F4EFE3"; border = T.borderSoft; dayColor = T.muted; }

    return (
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 6, minHeight: 0, position: "relative", overflow: "hidden" }}>
        {today && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.accent }} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            fontFamily: T.mono, fontWeight: 500, fontSize: 14, color: dayColor,
            ...(today ? { background: T.accent, color: "#fff", borderRadius: 999, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 } : {})
          }}>{d.getDate()}</div>
          {inMonth && !wknd && !hol && data?.location && data.location !== "remote" && (
            <div style={{ width: 18, height: 18, borderRadius: 6, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={data.location === "office" ? "building" : "users"} size={12} strokeWidth={1.6} />
            </div>
          )}
        </div>
        {hol && inMonth && (
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.12em", color: T.amber, textTransform: "uppercase", textAlign: "center", marginTop: 8 }}>Festività</div>
        )}
        {inMonth && !hol && !wknd && data && <CellEntries data={data} />}
      </div>
    );
  }

  function CellEntries({ data }) {
    if (data.hours) {
      const blocks = buildBlocks(data.hours);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflow: "hidden" }}>
          {blocks.slice(0, 4).map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 8, minHeight: 0 }}>
              <div style={{ width: 3, borderRadius: 2, background: b.entry.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: "0.02em" }}>{b.start}–{b.end}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, color: T.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryShortLabel(b.entry)}</div>
              </div>
            </div>
          ))}
          {blocks.length > 4 && <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, paddingLeft: 11 }}>+ {blocks.length - 4} altri</div>}
        </div>
      );
    }
    if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
      // Full day
      return <Bar entry={data.AM} period="Giorno intero" full />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <Bar entry={data.AM} period="AM" />
        <Bar entry={data.PM} period="PM" />
      </div>
    );
  }

  function Bar({ entry, period, full }) {
    if (!entry) {
      return <div style={{ flex: 1, border: `1px dashed ${T.borderSoft}`, borderRadius: 8 }} />;
    }
    return (
      <div style={{ display: "flex", alignItems: "stretch", gap: 8, flex: 1, minHeight: full ? 64 : 28 }}>
        <div style={{ width: 3, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted, letterSpacing: "0.02em" }}>{period}</div>
          <div style={{ fontFamily: T.sans, fontSize: full ? 14 : 12, fontWeight: 600, color: T.ink, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryShortLabel(entry)}</div>
          {entry.title && entryShortLabel(entry) !== entry.title && (
            <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.muted, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Month view ----------
  function MonthView() {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, padding: "20px 32px 28px", minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
            {DOW_SHORT.map((w, i) => (
              <div key={w} style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: i >= 5 ? T.muted : T.inkSoft, padding: "0 4px" }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 8, flex: 1, minHeight: 0 }}>
            {D.grid.map((d, i) => <DayCell key={i} d={d} />)}
          </div>
        </div>
        <SummaryPanel />
      </div>
    );
  }

  function SummaryPanel() {
    return (
      <aside style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Riepilogo</div>
        <h3 style={{ margin: 0, fontFamily: T.serif, fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>Maggio 2026</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, marginBottom: 16 }}>
          <Stat label="Giorni lav." value={`${D.SUMMARY.workingDays}`} unit="gg" />
          <Stat label="Compilati" value={`${D.SUMMARY.workedDays}`} unit="gg" pct={D.SUMMARY.workedDays / D.SUMMARY.workingDays} />
        </div>

        <Section title="Clienti">
          {D.SUMMARY.clients.map(c => (
            <Row key={c.name} dot={D.CLIENTS[c.name]} label={c.name} value={`${c.days.toFixed(1)} gg`} />
          ))}
        </Section>
        <div style={{ height: 14 }} />
        <Section title="Altre attività">
          {D.SUMMARY.other.map(o => {
            const dot = o.key === "internal" ? "#94A3B8" : o.key === "vacation" ? "#10B981" : "#A78BFA";
            return <Row key={o.key} dot={dot} label={o.label} value={`${o.days.toFixed(1)} gg`} />;
          })}
        </Section>
      </aside>
    );
  }

  function Stat({ label, value, unit, pct }) {
    return (
      <div style={{ border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.12em", color: T.muted, textTransform: "uppercase" }}>{label}</div>
        <div style={{ display: "baseline", marginTop: 4 }}>
          <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: T.ink }}>{value}</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginLeft: 4 }}>{unit}</span>
        </div>
        {pct !== undefined && (
          <div style={{ height: 2, background: T.borderSoft, marginTop: 8, borderRadius: 1, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, pct * 100)}%`, background: T.accent }} />
          </div>
        )}
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div>
        <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      </div>
    );
  }

  function Row({ dot, label, value }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${T.borderSoft}` }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink }}>{label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.inkSoft }}>{value}</span>
      </div>
    );
  }

  // ---------- Week view ----------
  function WeekView() {
    // Mon 4 — Sun 10 May
    const weekStart = new Date(2026, 4, 4);
    const days = Array.from({length: 7}, (_, i) => {
      const x = new Date(weekStart); x.setDate(weekStart.getDate() + i); return x;
    });

    return (
      <div style={{ flex: 1, padding: "20px 32px 28px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: `1px solid ${T.borderSoft}` }}>
            <div />
            {days.map((d, i) => (
              <div key={i} style={{ padding: "12px 14px", borderLeft: `1px solid ${T.borderSoft}`, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: i >= 5 ? T.muted : T.inkSoft }}>{DOW_SHORT[i]}</div>
                <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: i >= 5 ? T.muted : T.ink, letterSpacing: "-0.01em", display: "flex", alignItems: "baseline", gap: 8 }}>
                  {d.getDate()}
                  {sameDate(d, new Date(2026,4,8)) && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.accent, letterSpacing: "0.12em" }}>OGGI</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", position: "relative" }}>
            {/* Hour labels column */}
            <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${T.borderSoft}` }}>
              {HOUR_LABELS.slice(0, 9).map((h, i) => (
                <div key={h} style={{ height: 64, padding: "4px 8px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 10, color: T.muted }}>
                  {h}
                </div>
              ))}
            </div>
            {days.map((d, di) => <WeekDayCol key={di} d={d} />)}
          </div>
        </div>
      </div>
    );
  }

  function WeekDayCol({ d }) {
    const wknd = isWeekend(d);
    const hol = isHoliday(d);
    const data = D.DAYS[D.ymd(d)];
    const slotH = 32; // 30-min slot height (so hour=64)

    // Build positions
    const items = [];
    if (data?.hours) {
      const blocks = buildBlocks(data.hours);
      blocks.forEach((b, i) => {
        const startMin = toMin(b.start);
        const endMin = toMin(b.end);
        // adjust for break
        const top = positionTop(startMin) * slotH / 30;
        const height = (endMin - startMin) * slotH / 30 - 2;
        items.push({ key: `b${i}`, top, height, entry: b.entry, label: `${b.start}–${b.end}` });
      });
    } else if (data?.AM || data?.PM) {
      if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
        items.push({ key: "full", top: 0, height: 18 * slotH - 2, entry: data.AM, label: "Giorno intero" });
      } else {
        if (data.AM) items.push({ key: "am", top: 0, height: 8 * slotH - 2, entry: data.AM, label: "AM" });
        if (data.PM) items.push({ key: "pm", top: 10 * slotH, height: 8 * slotH - 2, entry: data.PM, label: "PM" });
      }
    }

    return (
      <div style={{ position: "relative", borderLeft: `1px solid ${T.borderSoft}`, background: wknd ? T.surfaceMuted : T.surface, minHeight: 18 * slotH }}>
        {/* Hour grid */}
        {Array.from({length: 18}).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
        ))}
        {/* Lunch break */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: "rgba(180, 165, 130, 0.06)" }} />
        {hol && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 600, color: T.amber }}>1° Maggio</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.amber, letterSpacing: "0.14em" }}>FESTA DEL LAVORO</div>
          </div>
        )}
        {items.map(it => (
          <div key={it.key} style={{ position: "absolute", left: 4, right: 4, top: it.top, height: it.height, display: "flex", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", padding: "5px 6px" }}>
            <div style={{ width: 3, background: it.entry.color, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted }}>{it.label}</div>
              <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entryShortLabel(it.entry)}</div>
              {it.entry.title && entryShortLabel(it.entry) !== it.entry.title && it.height > 50 && (
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, lineHeight: 1.25, overflow: "hidden" }}>{it.entry.title}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function toMin(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return (h - 9) * 60 + m;
  }
  function positionTop(min) {
    // Account for break (13-14 = 4 slots empty), but for visual we use raw min
    return min;
  }

  // ---------- Day view + Todo ----------
  function DayView() {
    return (
      <div style={{ flex: 1, padding: "20px 32px 28px", minHeight: 0, display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <DayTimeline />
        <TodoPanel />
      </div>
    );
  }

  function DayTimeline() {
    const data = D.DAYS["2026-05-08"];
    const slotH = 38;
    const blocks = buildBlocks(data.hours);

    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>Venerdì · Remoto</div>
            <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>8 Maggio · 8h registrate</div>
          </div>
          <button style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="home" size={14} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "70px 1fr", position: "relative" }}>
          <div style={{ borderRight: `1px solid ${T.borderSoft}` }}>
            {HOUR_LABELS.slice(0, 9).map(h => (
              <div key={h} style={{ height: 76, padding: "4px 12px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 11, color: T.muted }}>{h}</div>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: "rgba(180, 165, 130, 0.06)" }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted }}>Pausa pranzo</div>
            </div>
            {blocks.map((b, i) => {
              const startMin = toMin(b.start);
              const endMin = toMin(b.end);
              const top = startMin * slotH / 30;
              const height = (endMin - startMin) * slotH / 30 - 4;
              return (
                <div key={i} style={{ position: "absolute", left: 12, right: 12, top: top + 2, height, display: "flex", gap: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", overflow: "hidden" }}>
                  <div style={{ width: 3, background: b.entry.color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: "0.04em" }}>{b.start} → {b.end}</div>
                    <div style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.2, marginTop: 2 }}>{entryShortLabel(b.entry)}</div>
                    {b.entry.title && entryShortLabel(b.entry) !== b.entry.title && height > 50 && (
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
      <aside style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>To-do</div>
        <h3 style={{ margin: 0, fontFamily: T.serif, fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>Da fare ({D.TODOS.length})</h3>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {D.TODOS.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 4px", borderTop: `1px solid ${T.borderSoft}` }}>
              <div style={{ width: 16, height: 16, borderRadius: 999, border: `1.5px solid ${T.border}`, marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>{t.project}</span>
                  {t.tag && <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accent, background: T.accentSoft, padding: "1px 6px", borderRadius: 4 }}>{t.tag}</span>}
                  {t.due && <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: t.due === "Oggi" ? T.rose : T.muted }}>· {t.due}</span>}
                </div>
              </div>
            </div>
          ))}
          <button style={{ marginTop: 6, padding: "10px", border: `1px dashed ${T.border}`, borderRadius: 10, background: "transparent", color: T.muted, fontFamily: T.sans, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="plus" size={14} /> Aggiungi attività
          </button>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Fatti ({D.TODOS_DONE.length})</div>
          {D.TODOS_DONE.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: `1px solid ${T.borderSoft}`, opacity: 0.65 }}>
              <div style={{ width: 16, height: 16, borderRadius: 999, background: T.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="check" size={11} strokeWidth={2.5} /></div>
              <div style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.muted, textDecoration: "line-through" }}>{t.title}</div>
              <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>{t.project}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ---------- Editor (modal-like fullscreen body) ----------
  function EditorView() {
    return (
      <div style={{ flex: 1, padding: "20px 32px 28px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Editor header */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted }}>Editor giornaliero</div>
              <input value="Pairing — search ranking" style={{ marginTop: 4, width: "100%", border: 0, outline: 0, background: "transparent", fontFamily: T.serif, fontSize: 24, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }} />
            </div>
            <button style={{ height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.rose, fontFamily: T.sans, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>Elimina</button>
            <button style={{ height: 36, padding: "0 16px", borderRadius: 10, border: 0, background: T.ink, color: T.bg, fontFamily: T.sans, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Salva</button>
          </div>

          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: 28, overflow: "auto" }}>
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <Field label="Tipo">
                <div style={{ display: "flex", gap: 6, padding: 4, background: T.surfaceMuted, borderRadius: 12, border: `1px solid ${T.borderSoft}` }}>
                  {[["Cliente", true], ["Internal", false], ["Ferie", false], ["Evento", false]].map(([l, a], i) => (
                    <button key={i} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: 0, background: a ? T.surface : "transparent", color: a ? T.ink : T.muted, fontFamily: T.sans, fontWeight: 600, fontSize: 12.5, cursor: "pointer", boxShadow: a ? `0 1px 2px rgba(0,0,0,0.05)` : "none" }}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="Cliente">
                <input value="Globex" style={inputStyle()} />
              </Field>
              <Field label="Sottotipo">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Sviluppo", "Design", "Pairing", "Ricerca", "Altro"].map((s, i) => (
                    <span key={s} style={{ padding: "5px 10px", border: `1px solid ${i === 2 ? T.accent : T.border}`, borderRadius: 999, fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: i === 2 ? T.accent : T.inkSoft, background: i === 2 ? T.accentBg : "transparent" }}>{s}</span>
                  ))}
                </div>
              </Field>
              <Field label="Orario">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={inputStyle()}><span style={{ fontFamily: T.mono, fontSize: 13, color: T.muted, marginRight: 8 }}>Da</span><span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink }}>14:00</span></div>
                  <div style={inputStyle()}><span style={{ fontFamily: T.mono, fontSize: 13, color: T.muted, marginRight: 8 }}>A</span><span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink }}>16:00</span></div>
                </div>
              </Field>
              <Field label="Sede">
                <div style={{ display: "flex", gap: 6 }}>
                  {[["Remoto", "home", false], ["Ufficio", "building", true], ["Cliente", "users", false]].map(([l, ic, a], i) => (
                    <button key={i} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${a ? T.accent : T.border}`, background: a ? T.accentBg : T.surface, color: a ? T.accent : T.inkSoft, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon name={ic} size={14} /> {l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <Field label="Collaboratori">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {D.PEOPLE.slice(0,2).map(p => (
                    <span key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", border: `1px solid ${T.border}`, borderRadius: 999, background: T.surface }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: T.accentBg, color: T.accent, fontFamily: T.mono, fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.initials}</span>
                      <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink }}>{p.name}</span>
                    </span>
                  ))}
                  <span style={{ padding: "4px 10px", border: `1px dashed ${T.border}`, borderRadius: 999, fontFamily: T.sans, fontSize: 12.5, color: T.muted, cursor: "pointer" }}>+ Aggiungi</span>
                </div>
              </Field>
              <Field label="Note">
                <div style={{ ...inputStyle(), minHeight: 100, alignItems: "flex-start", padding: "12px 14px", lineHeight: 1.55 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink }}>Sessione di pairing su ranking ricerca. Discussa la strategia BM25 con boost editoriale; Marco ha proposto un'implementazione incrementale partendo dai segnali di click.</span>
                </div>
              </Field>
              <Field label="Cosa è andato storto">
                <div style={{ ...inputStyle(), minHeight: 60, alignItems: "flex-start", padding: "12px 14px", lineHeight: 1.55 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, fontStyle: "italic" }}>Indexer ha avuto un crash su 3 documenti malformati — da gestire con try/catch.</span>
                </div>
              </Field>
              <Field label="Prossimi passi">
                <div style={{ ...inputStyle(), minHeight: 60, alignItems: "flex-start", padding: "12px 14px", lineHeight: 1.55 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink }}>Lunedì: implementare gestione documenti malformati + scrivere test.</span>
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>
    );
    function Field({ label, children }) {
      return (
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>{label}</div>
          {children}
        </div>
      );
    }
    function inputStyle() {
      return { display: "flex", alignItems: "center", height: 42, padding: "0 14px", border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface, fontFamily: T.sans, fontSize: 13.5, color: T.ink, outline: 0 };
    }
  }

  // ---------- Root ----------
  function VariantA({ view = "month" }) {
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

  window.VariantA = VariantA;
})();
