// Variant C — Soft Indigo
// Geist Sans. Soft elevation, refined indigo→violet system. Pill chips. Modern dashboard.

(function () {
  const D = window.DL_DATA;
  const U = window.DL_UI;
  const { Icon, withAlpha, entryShortLabel, buildBlocks, HOUR_LABELS, DOW_SHORT, isWeekend, isHoliday, sameDate } = U;

  // Theme C — Soft Indigo
  const T = {
    bg: "#F4F3FB",
    bgGradient: "linear-gradient(180deg, #F6F5FC 0%, #F1F0FA 100%)",
    surface: "#FFFFFF",
    surfaceMuted: "#FAFAFD",
    surfaceWeekend: "#EFEEF7",
    ink: "#1B1B2E",
    inkSoft: "#3F3F5A",
    muted: "#7676A0",
    mutedSoft: "#B0B0CC",
    border: "#E7E6F2",
    borderSoft: "#EFEEF7",
    accent: "#6366F1",
    accentDark: "#4F46E5",
    accentSoft: "#E8E7FB",
    accentBg: "#F0EFFD",
    violet: "#8B5CF6",
    violetSoft: "#F1ECFE",
    rose: "#F43F5E",
    amber: "#F59E0B",
    amberSoft: "#FEF3C7",
    success: "#10B981",
    shadow: "0 1px 2px rgba(40, 40, 80, 0.04), 0 4px 12px rgba(40, 40, 80, 0.04)",
    shadowLg: "0 4px 24px rgba(40, 40, 80, 0.08)",
    sans: '"Geist", "Inter", system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, "SF Mono", monospace',
  };

  // ---------- Sidebar ----------
  function Sidebar({ active = "month", settingsActive = false }) {
    const items = [
      { id: "search", icon: "search", label: "Cerca" },
      { id: "day", icon: "day", label: "Giorno" },
      { id: "week", icon: "week", label: "Settimana" },
      { id: "month", icon: "calendar", label: "Mese" },
      { id: "projects", icon: "briefcase", label: "Progetti" },
      { id: "todo", icon: "todo", label: "Da fare" },
    ];
    return (
      <nav style={{ width: 84, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontWeight: 700, fontSize: 19, marginBottom: 18, boxShadow: `0 6px 16px ${withAlpha(T.accent, 0.32)}` }}>D</div>
        {items.map((it, i) => (
          <button key={it.id} style={{
            width: 60, padding: "9px 0", borderRadius: 12, border: 0, cursor: "pointer",
            background: active === it.id ? T.surface : "transparent",
            boxShadow: active === it.id ? T.shadow : "none",
            color: active === it.id ? T.accent : T.muted,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <Icon name={it.icon} size={19} strokeWidth={1.7} />
            <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500 }}>{it.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{ width: 60, padding: "9px 0", borderRadius: 12, border: 0, cursor: "pointer", background: settingsActive ? T.surface : "transparent", boxShadow: settingsActive ? T.shadow : "none", color: settingsActive ? T.accent : T.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}><Icon name="settings" size={19} strokeWidth={1.7} /><span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 500 }}>Impostazioni</span></button>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: T.violet, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontWeight: 600, fontSize: 13, marginTop: 8 }}>S</div>
      </nav>
    );
  }

  // ---------- Header ----------
  function PageHeader({ view = "month" }) {
    const titleMap = {
      month: { kicker: "Calendario", title: "Maggio 2026", sub: "21 giorni lavorativi · 18 compilati" },
      week: { kicker: "Settimana", title: "Settimana 19", sub: "4 — 10 Maggio · 5 giorni" },
      day: { kicker: "Oggi", title: "Venerdì 8 Maggio", sub: "8h registrate · Remoto" },
      editor: { kicker: "Modifica", title: "Pairing — search ranking", sub: "Globex · 8 Maggio · 14:00 — 16:00" },
      projects: { kicker: "Progetti", title: "Clienti & Progetti", sub: "4 attivi · 1 in pausa · 2.0 gg media settimanale" },
      settings: { kicker: "Impostazioni", title: "Preferenze", sub: "Profilo, attività e integrazioni" },
    }[view];

    return (
      <header style={{ padding: "20px 28px 18px", display: "flex", alignItems: "flex-end", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.accent, marginBottom: 4 }}>{titleMap.kicker}</div>
          <h1 style={{ margin: 0, fontFamily: T.sans, fontSize: 28, fontWeight: 700, color: T.ink, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{titleMap.title}</h1>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, marginTop: 4 }}>{titleMap.sub}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, background: T.surface, borderRadius: 999, boxShadow: T.shadow }}>
            <button style={navBtn()}><Icon name="chev-l" size={15} /></button>
            <button style={{ ...navBtn(), padding: "0 14px", width: "auto", fontFamily: T.sans, fontSize: 12.5, fontWeight: 500 }}>Oggi</button>
            <button style={navBtn()}><Icon name="chev-r" size={15} /></button>
          </div>
          {view === "month" && <button style={ghostBtn()}><Icon name="repeat" size={13} style={{ marginRight: 6 }} /> Riempi</button>}
          <button style={primaryBtn()}><Icon name="plus" size={14} style={{ marginRight: 6 }} /> Nuova voce</button>
        </div>
      </header>
    );

    function navBtn()   { return { width: 32, height: 32, borderRadius: 999, border: 0, background: "transparent", color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }; }
    function ghostBtn() { return { height: 40, padding: "0 16px", borderRadius: 999, border: 0, background: T.surface, color: T.ink, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", boxShadow: T.shadow }; }
    function primaryBtn(){ return { height: 40, padding: "0 18px", borderRadius: 999, border: 0, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", boxShadow: `0 6px 16px ${withAlpha(T.accent, 0.32)}` }; }
  }

  // ---------- Day cell ----------
  function DayCell({ d }) {
    const inMonth = d.getMonth() === D.MONTH;
    const wknd = isWeekend(d);
    const hol = isHoliday(d);
    const today = sameDate(d, D.TODAY);
    const data = D.DAYS[D.ymd(d)];

    let bg = T.surface;
    let borderColor = "transparent";
    if (!inMonth) { bg = "transparent"; }
    else if (hol) { bg = T.amberSoft; }
    else if (wknd) { bg = T.surfaceWeekend; }
    if (today) { borderColor = T.accent; }

    return (
      <div style={{
        background: bg,
        borderRadius: 16,
        boxShadow: inMonth && !wknd && !hol ? T.shadow : "none",
        border: today ? `2px solid ${borderColor}` : `1px solid ${inMonth && !wknd && !hol ? "transparent" : "transparent"}`,
        padding: 10, display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden", minHeight: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            fontFamily: T.sans, fontWeight: 600, fontSize: 13,
            color: !inMonth ? T.mutedSoft : (wknd || hol) ? T.muted : T.ink,
            ...(today ? { width: 22, height: 22, borderRadius: 999, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5 } : {}),
          }}>{d.getDate()}</div>
          {inMonth && !wknd && !hol && data?.location && data.location !== "remote" && (
            <div style={{ width: 18, height: 18, borderRadius: 6, background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={data.location === "office" ? "building" : "users"} size={11} strokeWidth={1.8} />
            </div>
          )}
        </div>
        {hol && inMonth && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, marginTop: 4 }}>
            <Icon name="flag" size={13} style={{ color: T.amber }} />
            <div style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, color: "#92400E", lineHeight: 1.2 }}>Festività</div>
          </div>
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
            <div key={i} style={{
              padding: "4px 8px", borderRadius: 8, minWidth: 0,
              background: withAlpha(b.entry.color, 0.10),
              display: "flex", flexDirection: "column", gap: 0,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: "0.02em" }}>{b.start}</div>
              <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 500, color: b.entry.color, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", filter: "brightness(0.65) saturate(1.4)" }}>{entryShortLabel(b.entry)}</div>
            </div>
          ))}
          {blocks.length > 4 && <div style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, fontWeight: 500, paddingLeft: 8 }}>+ {blocks.length - 4} altri</div>}
        </div>
      );
    }
    if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
      return <Pill entry={data.AM} period="Giorno intero" full />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <Pill entry={data.AM} period="AM" />
        <Pill entry={data.PM} period="PM" />
      </div>
    );
  }

  function Pill({ entry, period, full }) {
    if (!entry) {
      return <div style={{ flex: 1, minHeight: 22, border: `1.5px dashed ${T.border}`, borderRadius: 8, display: "flex", alignItems: "center", paddingLeft: 8, fontFamily: T.sans, fontSize: 10.5, color: T.mutedSoft, fontWeight: 500 }}>+ {period}</div>;
    }
    return (
      <div style={{
        flex: 1, minHeight: full ? 64 : 26,
        padding: "5px 9px", borderRadius: 8,
        background: withAlpha(entry.color, 0.10),
        display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0,
      }}>
        <div style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 600, color: entry.color, letterSpacing: "0.04em", textTransform: "uppercase", filter: "brightness(0.7) saturate(1.5)" }}>{period}</div>
        <div style={{ fontFamily: T.sans, fontSize: full ? 14 : 11.5, fontWeight: 600, color: entry.color, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", filter: "brightness(0.6) saturate(1.5)" }}>{entryShortLabel(entry)}</div>
        {full && entry.title && entryShortLabel(entry) !== entry.title && (
          <div style={{ fontFamily: T.sans, fontSize: 11, color: T.inkSoft, marginTop: 2, opacity: 0.85 }}>{entry.title}</div>
        )}
      </div>
    );
  }

  // ---------- Month view ----------
  function MonthView() {
    return (
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, padding: "0 28px 24px", minHeight: 0 }}>
        <div style={{ background: T.surface, borderRadius: 20, padding: 16, boxShadow: T.shadow, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
            {DOW_SHORT.map((w, i) => (
              <div key={w} style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: i >= 5 ? T.muted : T.inkSoft, padding: "0 10px" }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 6, flex: 1, minHeight: 0 }}>
            {D.grid.map((d, i) => <DayCell key={i} d={d} />)}
          </div>
        </div>
        <SummaryPanel />
      </div>
    );
  }

  function SummaryPanel() {
    const completion = Math.round(D.SUMMARY.workedDays / D.SUMMARY.workingDays * 100);
    return (
      <aside style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
        {/* Hero stat card */}
        <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, borderRadius: 20, padding: 20, color: "#fff", boxShadow: `0 8px 24px ${withAlpha(T.accent, 0.28)}` }}>
          <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500, opacity: 0.85, marginBottom: 6 }}>Completamento mese</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: T.sans, fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em" }}>{completion}%</span>
            <span style={{ fontFamily: T.sans, fontSize: 13, opacity: 0.8 }}>· {D.SUMMARY.workedDays}/{D.SUMMARY.workingDays} gg</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completion}%`, background: "#fff", borderRadius: 999 }} />
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 11.5, opacity: 0.85, marginTop: 10 }}>{D.SUMMARY.workingDays - D.SUMMARY.workedDays} giorni da compilare</div>
        </div>

        {/* Clients card */}
        <div style={{ background: T.surface, borderRadius: 20, padding: 18, boxShadow: T.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>Clienti</span>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>aggiornato ora</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {D.SUMMARY.clients.map(c => (
              <div key={c.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: D.CLIENTS[c.name] }} />
                  <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink }}>{c.name}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink }}>{c.days.toFixed(1)}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>gg</span>
                </div>
                <div style={{ height: 5, background: T.surfaceWeekend, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c.days / D.SUMMARY.workedDays) * 100}%`, background: D.CLIENTS[c.name], borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other activities */}
        <div style={{ background: T.surface, borderRadius: 20, padding: 18, boxShadow: T.shadow }}>
          <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 12 }}>Altre attività</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {D.SUMMARY.other.map(o => {
              const dot = o.key === "internal" ? T.muted : o.key === "vacation" ? T.success : T.violet;
              return (
                <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceMuted }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: dot }} />
                  <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.ink }}>{o.label}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.ink }}>{o.days.toFixed(1)} gg</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  // ---------- Week view ----------
  function WeekView() {
    const weekStart = new Date(2026, 4, 4);
    const days = Array.from({length: 7}, (_, i) => { const x = new Date(weekStart); x.setDate(weekStart.getDate() + i); return x; });

    return (
      <div style={{ flex: 1, padding: "0 28px 24px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, borderRadius: 20, boxShadow: T.shadow, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div />
            {days.map((d, i) => {
              const today = sameDate(d, new Date(2026,4,8));
              return (
                <div key={i} style={{ padding: "16px 12px 14px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: i >= 5 ? T.muted : T.inkSoft }}>{DOW_SHORT[i]}</span>
                  <span style={{
                    fontFamily: T.sans, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em",
                    color: today ? "#fff" : (i >= 5 ? T.muted : T.ink),
                    ...(today ? { background: T.accent, padding: "2px 12px", borderRadius: 999, boxShadow: `0 4px 12px ${withAlpha(T.accent, 0.3)}` } : {}),
                  }}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", position: "relative", borderTop: `1px solid ${T.borderSoft}` }}>
            <div style={{ background: T.surfaceMuted }}>
              {HOUR_LABELS.slice(0, 9).map(h => (
                <div key={h} style={{ height: 64, padding: "4px 10px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 10.5, color: T.muted }}>{h}</div>
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
    const slotH = 32;

    const items = [];
    if (data?.hours) {
      const blocks = buildBlocks(data.hours);
      blocks.forEach((b, i) => {
        const top = toMin(b.start) * slotH / 30;
        const height = (toMin(b.end) - toMin(b.start)) * slotH / 30 - 3;
        items.push({ key: `b${i}`, top, height, entry: b.entry, label: `${b.start}–${b.end}` });
      });
    } else if (data?.AM || data?.PM) {
      if (data.AM && data.PM && data.AM.title === data.PM.title && data.AM.client === data.PM.client) {
        items.push({ key: "full", top: 0, height: 18 * slotH - 3, entry: data.AM, label: "Tutto il giorno" });
      } else {
        if (data.AM) items.push({ key: "am", top: 0, height: 8 * slotH - 3, entry: data.AM, label: "AM" });
        if (data.PM) items.push({ key: "pm", top: 10 * slotH, height: 8 * slotH - 3, entry: data.PM, label: "PM" });
      }
    }

    return (
      <div style={{ position: "relative", borderLeft: `1px solid ${T.borderSoft}`, background: wknd ? T.surfaceWeekend : T.surface, minHeight: 18 * slotH }}>
        {Array.from({length: 18}).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: withAlpha(T.accent, 0.04) }} />
        {hol && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: T.amberSoft, color: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="flag" size={16} />
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#92400E", marginTop: 8, textAlign: "center" }}>Festa<br/>del Lavoro</div>
          </div>
        )}
        {items.map(it => (
          <div key={it.key} style={{
            position: "absolute", left: 5, right: 5, top: it.top + 1.5, height: it.height,
            background: withAlpha(it.entry.color, 0.13),
            borderLeft: `3px solid ${it.entry.color}`,
            borderRadius: 8, padding: "5px 8px", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.muted }}>{it.label}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: it.entry.color, lineHeight: 1.2, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", filter: "brightness(0.65) saturate(1.4)" }}>{entryShortLabel(it.entry)}</div>
            {it.entry.title && entryShortLabel(it.entry) !== it.entry.title && it.height > 50 && (
              <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.inkSoft, marginTop: 2, lineHeight: 1.3, overflow: "hidden", opacity: 0.8 }}>{it.entry.title}</div>
            )}
          </div>
        ))}
      </div>
    );
  }
  function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return (h - 9) * 60 + m; }

  // ---------- Day + Todo ----------
  function DayView() {
    return (
      <div style={{ flex: 1, padding: "0 28px 24px", minHeight: 0, display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
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
      <div style={{ background: T.surface, borderRadius: 20, boxShadow: T.shadow, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>Giornata</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 2 }}>4 voci · 8h totali</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["home", "Remoto", false], ["building", "Ufficio", false], ["users", "Cliente", true]].map(([ic, l, a], i) => (
              <button key={i} style={{
                padding: "7px 12px", borderRadius: 999,
                border: 0, cursor: "pointer",
                background: a ? T.accentSoft : T.surfaceMuted,
                color: a ? T.accent : T.muted,
                fontFamily: T.sans, fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Icon name={ic} size={12} /> {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "70px 1fr", position: "relative", borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ background: T.surfaceMuted }}>
            {HOUR_LABELS.slice(0, 9).map(h => (
              <div key={h} style={{ height: 76, padding: "4px 12px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", fontFamily: T.mono, fontSize: 11, color: T.muted }}>{h}</div>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * slotH, height: 1, background: i % 2 === 0 ? T.borderSoft : "transparent" }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 8 * slotH, height: 2 * slotH, background: withAlpha(T.accent, 0.04) }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6, color: T.muted }}>
                <Icon name="clock" size={12} />
                <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500 }}>Pausa pranzo</span>
              </div>
            </div>
            {blocks.map((b, i) => {
              const top = toMin(b.start) * slotH / 30;
              const height = (toMin(b.end) - toMin(b.start)) * slotH / 30 - 5;
              return (
                <div key={i} style={{
                  position: "absolute", left: 12, right: 12, top: top + 2.5, height,
                  background: withAlpha(b.entry.color, 0.10),
                  borderLeft: `4px solid ${b.entry.color}`,
                  borderRadius: 12, padding: "10px 14px", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, fontWeight: 500 }}>{b.start} → {b.end}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, color: b.entry.color, padding: "2px 8px", background: withAlpha(b.entry.color, 0.15), borderRadius: 999, filter: "brightness(0.7) saturate(1.4)" }}>{b.entry.type === "client" ? "Cliente" : b.entry.type}</span>
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 600, color: b.entry.color, marginTop: 4, letterSpacing: "-0.01em", filter: "brightness(0.6) saturate(1.4)" }}>{entryShortLabel(b.entry)}</div>
                  {b.entry.title && entryShortLabel(b.entry) !== b.entry.title && height > 60 && (
                    <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.inkSoft, marginTop: 2, opacity: 0.85 }}>{b.entry.title}</div>
                  )}
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
      <aside style={{ background: T.surface, borderRadius: 20, boxShadow: T.shadow, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="todo" size={15} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>Da fare</div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted }}>{D.TODOS.length} attività · {D.TODOS_DONE.length} completate</div>
          </div>
          <button style={{ width: 32, height: 32, borderRadius: 10, border: 0, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${withAlpha(T.accent, 0.3)}` }}><Icon name="plus" size={14} strokeWidth={2} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
          {D.TODOS.map((t, i) => (
            <div key={i} style={{ padding: "10px 8px", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, border: `1.5px solid ${T.border}`, marginTop: 1, flexShrink: 0, background: T.surface }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, lineHeight: 1.35 }}>{t.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 500, color: T.muted, padding: "2px 8px", background: T.surfaceWeekend, borderRadius: 999 }}>{t.project}</span>
                  {t.tag && <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 600, color: T.accent, padding: "2px 8px", background: T.accentSoft, borderRadius: 999 }}>#{t.tag}</span>}
                  {t.due && <span style={{ fontFamily: T.sans, fontSize: 10.5, fontWeight: 500, color: t.due === "Oggi" ? T.rose : T.muted, display: "flex", alignItems: "center", gap: 3 }}><Icon name="clock" size={10} />{t.due}</span>}
                </div>
              </div>
            </div>
          ))}

          <div style={{ height: 1, background: T.borderSoft, margin: "10px 8px" }} />
          <div style={{ padding: "0 8px 6px", fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: T.muted }}>Completate</div>
          {D.TODOS_DONE.map((t, i) => (
            <div key={i} style={{ padding: "8px", display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, background: T.success, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="check" size={11} strokeWidth={3} /></div>
              <div style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.muted, textDecoration: "line-through" }}>{t.title}</div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ---------- Editor ----------
  function EditorView() {
    return (
      <div style={{ flex: 1, padding: "0 28px 24px", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: T.surface, borderRadius: 20, boxShadow: T.shadowLg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 40, borderRadius: 4, background: D.CLIENTS["Globex"] }} />
            <div style={{ flex: 1 }}>
              <input value="Pairing — search ranking" style={{ width: "100%", border: 0, outline: 0, background: "transparent", fontFamily: T.sans, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: "-0.025em", padding: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontFamily: T.sans, fontSize: 12.5, color: T.muted }}>
                <span>Globex</span><span>·</span><span>Venerdì 8 Maggio</span><span>·</span><span style={{ fontFamily: T.mono }}>14:00 — 16:00</span><span>·</span><span style={{ color: T.success, fontWeight: 500 }}>2.0h</span>
              </div>
            </div>
            <button style={{ width: 40, height: 40, borderRadius: 12, border: 0, background: T.surfaceWeekend, color: T.rose, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="trash" size={15} /></button>
            <button style={{ height: 40, padding: "0 20px", borderRadius: 999, border: 0, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 6px 16px ${withAlpha(T.accent, 0.32)}` }}>
              <Icon name="check" size={14} strokeWidth={2.5} /> Salva voce
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <Field label="Tipo di voce">
                <div style={{ display: "flex", gap: 6 }}>
                  {[["Cliente", true], ["Internal", false], ["Ferie", false], ["Evento", false]].map(([l, a], i) => (
                    <button key={i} style={{
                      flex: 1, padding: "10px 12px", borderRadius: 12, border: 0, cursor: "pointer",
                      background: a ? T.accentSoft : T.surfaceMuted,
                      color: a ? T.accent : T.muted,
                      fontFamily: T.sans, fontSize: 12.5, fontWeight: 600,
                    }}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="Cliente">
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: T.surfaceMuted }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: D.CLIENTS["Globex"] }} />
                  <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.ink, flex: 1 }}>Globex</span>
                  <Icon name="chev-d" size={14} style={{ color: T.muted }} />
                </div>
              </Field>
              <Field label="Sottotipo">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Sviluppo", "Design", "Pairing", "Ricerca", "Riunione"].map((s, i) => (
                    <span key={s} style={{
                      padding: "6px 12px", borderRadius: 999,
                      background: i === 2 ? T.accent : T.surfaceMuted,
                      color: i === 2 ? "#fff" : T.inkSoft,
                      fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                      boxShadow: i === 2 ? `0 4px 10px ${withAlpha(T.accent, 0.3)}` : "none",
                    }}>{s}</span>
                  ))}
                </div>
              </Field>
              <Field label="Sede">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[["home", "Remoto", false], ["building", "Ufficio", true], ["users", "Cliente", false]].map(([ic, l, a], i) => (
                    <button key={i} style={{
                      padding: "12px 8px", borderRadius: 12, border: 0, cursor: "pointer",
                      background: a ? T.accentSoft : T.surfaceMuted,
                      color: a ? T.accent : T.inkSoft,
                      fontFamily: T.sans, fontSize: 12.5, fontWeight: 500,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}>
                      <Icon name={ic} size={16} />
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Collaboratori">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {D.PEOPLE.slice(0,2).map(p => (
                    <span key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 5px", background: T.surfaceMuted, borderRadius: 999 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", fontFamily: T.sans, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.initials}</span>
                      <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.ink }}>{p.name}</span>
                    </span>
                  ))}
                  <span style={{ padding: "6px 14px", borderRadius: 999, background: T.surfaceMuted, color: T.muted, fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="plus" size={11} /> Aggiungi
                  </span>
                </div>
              </Field>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <Field label="Note">
                <div style={{ minHeight: 110, padding: "12px 14px", borderRadius: 12, background: T.surfaceMuted, fontFamily: T.sans, fontSize: 13.5, color: T.ink, lineHeight: 1.6 }}>
                  Sessione di pairing su ranking ricerca. Discussa la strategia BM25 con boost editoriale; Marco ha proposto un'implementazione incrementale partendo dai segnali di click.
                </div>
              </Field>
              <Field label="Cosa è andato storto" optional>
                <div style={{ minHeight: 64, padding: "12px 14px", borderRadius: 12, background: "#FEF2F2", borderLeft: `3px solid ${T.rose}`, fontFamily: T.sans, fontSize: 13, color: T.inkSoft, lineHeight: 1.55, fontStyle: "italic" }}>
                  Indexer ha avuto un crash su 3 documenti malformati — da gestire con try/catch.
                </div>
              </Field>
              <Field label="Prossimi passi" optional>
                <div style={{ minHeight: 64, padding: "12px 14px", borderRadius: 12, background: "#ECFDF5", borderLeft: `3px solid ${T.success}`, fontFamily: T.sans, fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>
                  Lunedì: implementare gestione documenti malformati + scrivere test.
                </div>
              </Field>
              <Field label="Trascrizione vocale">
                <button style={{ width: "100%", padding: "12px", borderRadius: 12, border: 0, background: T.violetSoft, color: T.violet, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="mic" size={14} /> Registra nota vocale
                </button>
              </Field>
            </div>
          </div>
        </div>
      </div>
    );

    function Field({ label, optional, children }) {
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: T.inkSoft }}>{label}</span>
            {optional && <span style={{ fontFamily: T.sans, fontSize: 10.5, color: T.muted, fontStyle: "italic" }}>opzionale</span>}
          </div>
          {children}
        </div>
      );
    }
  }

  // ---------- Projects view ----------
  function ProjectsView() {
    // Build project list from clients + a couple of deeper projects per client
    const data = [
      { client: "Globex",  status: "active",   project: "Search ranking",     period: "Mar — Set 2026", days: 7.0,  last: "oggi",       team: ["MR","SB"], pct: 62 },
      { client: "Acme",    status: "active",   project: "Checkout refactor",  period: "Apr — Giu 2026", days: 4.0,  last: "2 gg fa",     team: ["LP"],      pct: 48 },
      { client: "Initech", status: "active",   project: "Auth platform",      period: "Feb — Ago 2026", days: 3.5,  last: "4 gg fa",     team: ["MR","GT"], pct: 71 },
      { client: "Hooli",   status: "discovery",project: "Onboarding rebuild", period: "Mag — Lug 2026", days: 1.5,  last: "ieri",       team: ["SB"],      pct: 12 },
      { client: "Globex",  status: "active",   project: "Indexing pipeline",  period: "Gen — Dic 2026", days: 2.0,  last: "3 gg fa",     team: ["MR"],      pct: 35 },
      { client: "Acme",    status: "paused",   project: "Mobile app v2",      period: "In pausa",       days: 0,    last: "3 set fa",    team: ["GT","LP"], pct: 22 },
    ];
    const statusStyle = {
      active:    { bg: "#DCFCE7", fg: "#166534", label: "In corso" },
      discovery: { bg: T.violetSoft, fg: T.violet, label: "Discovery" },
      paused:    { bg: T.surfaceWeekend, fg: T.muted, label: "In pausa" },
    };

    return (
      <div style={{ flex: 1, padding: "0 28px 24px", minHeight: 0, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <KpiCard label="Clienti attivi" value="4" delta="+1 da Apr" tone="accent" />
          <KpiCard label="Progetti in corso" value="5" delta="6 totali" tone="violet" />
          <KpiCard label="Ore tracciate (mese)" value="144h" delta="+12h vs Apr" tone="success" />
          <KpiCard label="Ricavabile" value="€ 14.4k" delta="al netto interne" tone="plain" />
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, padding: 4, background: T.surface, borderRadius: 999, boxShadow: T.shadow }}>
            {[["Tutti", true], ["In corso", false], ["Discovery", false], ["In pausa", false]].map(([l, a], i) => (
              <button key={i} style={{ padding: "7px 14px", borderRadius: 999, border: 0, cursor: "pointer", background: a ? T.accent : "transparent", color: a ? "#fff" : T.muted, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600 }}>{l}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, background: T.surface, boxShadow: T.shadow, color: T.muted, fontFamily: T.sans, fontSize: 12.5 }}>
            <Icon name="search" size={13} /> <span>Cerca progetto…</span>
          </div>
          <button style={{ height: 36, padding: "0 16px", borderRadius: 999, border: 0, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 12px ${withAlpha(T.accent, 0.32)}` }}>
            <Icon name="plus" size={13} /> Nuovo progetto
          </button>
        </div>

        {/* Project grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {data.map((p, i) => {
            const cc = D.CLIENTS[p.client];
            const st = statusStyle[p.status];
            return (
              <div key={i} style={{ background: T.surface, borderRadius: 18, padding: 18, boxShadow: T.shadow, display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cc }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: withAlpha(cc, 0.15), color: cc, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontWeight: 700, fontSize: 14, filter: "brightness(0.8) saturate(1.3)" }}>{p.client[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: T.muted }}>{p.client}</div>
                    <div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.project}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, background: st.bg, color: st.fg, fontFamily: T.sans, fontSize: 10.5, fontWeight: 600 }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: T.sans, fontSize: 11.5, color: T.muted }}>
                  <span>{p.period}</span>
                  <span>Ultima: {p.last}</span>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted }}>Avanzamento</span>
                    <span style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, color: T.ink }}>{p.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: T.surfaceWeekend, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: cc, borderRadius: 999 }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {p.team.map((t, ti) => (
                      <span key={ti} style={{ width: 24, height: 24, borderRadius: 999, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", fontFamily: T.sans, fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.surface}`, marginLeft: ti > 0 ? -8 : 0 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: T.sans, fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>{p.days.toFixed(1)}</span>
                    <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>gg / mese</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    function KpiCard({ label, value, delta, tone }) {
      const toneMap = {
        accent:  { bg: T.accentSoft,  fg: T.accent },
        violet:  { bg: T.violetSoft,  fg: T.violet },
        success: { bg: "#D1FAE5",     fg: "#065F46" },
        plain:   { bg: T.surface,     fg: T.ink },
      };
      const c = toneMap[tone];
      return (
        <div style={{ background: T.surface, borderRadius: 18, padding: "16px 18px", boxShadow: T.shadow, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, color: T.muted }}>{label}</span>
          <span style={{ fontFamily: T.sans, fontSize: 26, fontWeight: 700, color: T.ink, letterSpacing: "-0.025em", lineHeight: 1.05 }}>{value}</span>
          <span style={{ display: "inline-flex", alignSelf: "flex-start", padding: "2px 10px", borderRadius: 999, background: c.bg, color: c.fg, fontFamily: T.sans, fontSize: 11, fontWeight: 600, marginTop: 2 }}>{delta}</span>
        </div>
      );
    }
  }

  // ---------- Settings view ----------
  function SettingsView() {
    const navItems = [
      { id: "profile",   icon: "users",     label: "Profilo" },
      { id: "prefs",     icon: "settings",  label: "Preferenze", active: true },
      { id: "clients",   icon: "briefcase", label: "Clienti & progetti" },
      { id: "categories",icon: "tag",       label: "Categorie attività" },
      { id: "notif",     icon: "clock",     label: "Notifiche" },
      { id: "export",    icon: "upload",    label: "Esportazioni" },
      { id: "team",      icon: "users",     label: "Team" },
    ];

    return (
      <div style={{ flex: 1, padding: "0 28px 24px", minHeight: 0, display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, overflow: "hidden" }}>
        {/* Settings nav */}
        <aside style={{ background: T.surface, borderRadius: 20, padding: 12, boxShadow: T.shadow, display: "flex", flexDirection: "column", gap: 2, alignSelf: "flex-start" }}>
          {navItems.map(n => (
            <button key={n.id} style={{
              padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer",
              background: n.active ? T.accentSoft : "transparent",
              color: n.active ? T.accent : T.inkSoft,
              fontFamily: T.sans, fontSize: 13.5, fontWeight: n.active ? 600 : 500,
              display: "flex", alignItems: "center", gap: 10, textAlign: "left",
            }}>
              <Icon name={n.icon} size={16} strokeWidth={1.7} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.active && <Icon name="chev-r" size={14} />}
            </button>
          ))}
        </aside>

        {/* Settings content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto", paddingRight: 4 }}>
          {/* Profile card */}
          <div style={{ background: T.surface, borderRadius: 20, padding: 20, boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: 22, fontWeight: 700, boxShadow: `0 6px 16px ${withAlpha(T.accent, 0.32)}` }}>SR</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.sans, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>Stefano Rossi</div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, marginTop: 2 }}>stefano@studio.it · Senior Engineer</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span style={{ padding: "3px 10px", borderRadius: 999, background: T.accentSoft, color: T.accent, fontFamily: T.sans, fontSize: 10.5, fontWeight: 600 }}>Admin</span>
                <span style={{ padding: "3px 10px", borderRadius: 999, background: T.surfaceWeekend, color: T.muted, fontFamily: T.sans, fontSize: 10.5, fontWeight: 500 }}>Studio Roma</span>
              </div>
            </div>
            <button style={{ height: 36, padding: "0 16px", borderRadius: 999, border: 0, background: T.surfaceMuted, color: T.ink, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Modifica</button>
          </div>

          {/* Preferenze diario */}
          <Card title="Diario" subtitle="Come si comporta DailyLog quando registri il tuo tempo">
            <Toggle label="Granularità oraria" desc="Registra mezz'ore invece di AM/PM" on={true} />
            <Toggle label="Promemoria di fine giornata" desc="Notifica alle 18:00 se la giornata non è compilata" on={true} />
            <Toggle label="Auto-compila ricorrenti" desc="Riempi automaticamente i blocchi ricorrenti la domenica notte" on={false} />
            <Selector label="Inizio settimana" value="Lunedì" options={["Lunedì", "Domenica"]} />
            <Selector label="Sede di default" value="Remoto" options={["Remoto", "Ufficio", "Cliente"]} />
          </Card>

          {/* Categorie */}
          <Card title="Tipi di attività" subtitle="Personalizza le categorie e i colori">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {[["Sviluppo", "#0EA5E9"], ["Design", "#EC4899"], ["Pairing", "#6366F1"], ["Ricerca", "#A78BFA"], ["Riunione", "#94A3B8"], ["Internal", "#737373"]].map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: T.surfaceMuted }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
                  <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.ink, fontWeight: 500 }}>{l}</span>
                  <Icon name="edit" size={13} style={{ color: T.muted }} />
                </div>
              ))}
              <button style={{ padding: "10px 12px", borderRadius: 12, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.muted, fontFamily: T.sans, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <Icon name="plus" size={13} /> Aggiungi categoria
              </button>
            </div>
          </Card>

          {/* Integrazioni */}
          <Card title="Integrazioni" subtitle="Connetti DailyLog ai tuoi strumenti">
            <Integration name="Google Calendar" desc="Importa eventi come blocchi pre-compilati" connected />
            <Integration name="Linear" desc="Collega le voci ai task" connected />
            <Integration name="Slack" desc="Riepilogo giornaliero in canale" />
            <Integration name="Notion" desc="Esporta i log mensili" />
          </Card>

          {/* Danger zone */}
          <div style={{ background: T.surface, borderRadius: 20, padding: 20, boxShadow: T.shadow, borderLeft: `4px solid ${T.rose}` }}>
            <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.rose, marginBottom: 4 }}>Zona pericolo</div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, marginBottom: 12 }}>Le azioni qui sotto sono irreversibili.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ height: 34, padding: "0 14px", borderRadius: 10, border: 0, background: "#FEF2F2", color: T.rose, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancella tutti i dati</button>
              <button style={{ height: 34, padding: "0 14px", borderRadius: 10, border: 0, background: "#FEF2F2", color: T.rose, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Elimina account</button>
            </div>
          </div>
        </div>
      </div>
    );

    function Card({ title, subtitle, children }) {
      return (
        <div style={{ background: T.surface, borderRadius: 20, padding: 20, boxShadow: T.shadow }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: "-0.015em" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
        </div>
      );
    }
    function Toggle({ label, desc, on }) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 500, color: T.ink }}>{label}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 1 }}>{desc}</div>
          </div>
          <div style={{ width: 40, height: 22, borderRadius: 999, background: on ? T.accent : T.borderSoft, position: "relative", transition: "background .15s", cursor: "pointer", boxShadow: on ? `0 2px 8px ${withAlpha(T.accent, 0.32)}` : "none" }}>
            <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left .15s" }} />
          </div>
        </div>
      );
    }
    function Selector({ label, value, options }) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
          <div style={{ flex: 1, fontFamily: T.sans, fontSize: 13.5, fontWeight: 500, color: T.ink }}>{label}</div>
          <div style={{ display: "inline-flex", padding: 3, background: T.surfaceMuted, borderRadius: 10 }}>
            {options.map(o => (
              <span key={o} style={{ padding: "5px 12px", borderRadius: 7, background: o === value ? T.surface : "transparent", color: o === value ? T.ink : T.muted, fontFamily: T.sans, fontSize: 12, fontWeight: 500, boxShadow: o === value ? T.shadow : "none", cursor: "pointer" }}>{o}</span>
            ))}
          </div>
        </div>
      );
    }
    function Integration({ name, desc, connected }) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceMuted, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
            <Icon name="briefcase" size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{name}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 1 }}>{desc}</div>
          </div>
          {connected
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, background: "#D1FAE5", color: "#065F46", fontFamily: T.sans, fontSize: 11, fontWeight: 600 }}><Icon name="check" size={11} strokeWidth={3} /> Connesso</span>
            : <button style={{ height: 30, padding: "0 14px", borderRadius: 999, border: 0, background: T.accent, color: "#fff", fontFamily: T.sans, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Connetti</button>
          }
        </div>
      );
    }
  }

  // ---------- Root ----------
  function VariantC({ view = "month" }) {
    const sidebarActive = view === "editor" ? "day" : view === "settings" ? "" : view;
    return (
      <div style={{ width: "100%", height: "100%", background: T.bgGradient, color: T.ink, fontFamily: T.sans, display: "flex", overflow: "hidden" }}>
        <Sidebar active={sidebarActive} settingsActive={view === "settings"} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <PageHeader view={view} />
          {view === "month" && <MonthView />}
          {view === "week" && <WeekView />}
          {view === "day" && <DayView />}
          {view === "editor" && <EditorView />}
          {view === "projects" && <ProjectsView />}
          {view === "settings" && <SettingsView />}
        </div>
      </div>
    );
  }

  window.VariantC = VariantC;
})();
