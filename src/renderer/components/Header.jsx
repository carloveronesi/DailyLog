import { Icon } from "./ui";

const IT_MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const IT_DAYS  = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];

function getWeekNumber(d) {
  const t = new Date(d); t.setHours(0,0,0,0);
  t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7);
  const j4 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t - j4) / 86400000 - 3 + (j4.getDay() + 6) % 7) / 7);
}

function getWeekBounds(date) {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7;
  const mon = new Date(d); mon.setDate(d.getDate() - dow);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { mon, sun, weekNum: getWeekNumber(mon) };
}

const KICKERS = { month: "Calendario", week: "Settimana", day: "Oggi", todo: "Da fare", projects: "Progetti" };

export function Header({ view = "month", year, month, activeDate, onPrev, onNext, onToday, onFillMonth, onNewTask, pendingTodoCount }) {
  const d = activeDate || new Date();
  let title = "", sub = "";

  if (view === "month") {
    title = `${IT_MONTHS[month]} ${year}`;
  } else if (view === "week") {
    const { mon, sun, weekNum } = getWeekBounds(d);
    title = `Settimana ${weekNum}`;
    const ms = IT_MONTHS[mon.getMonth()].slice(0,3);
    const ss = IT_MONTHS[sun.getMonth()].slice(0,3);
    sub = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} — ${sun.getDate()} ${ms} ${sun.getFullYear()}`
      : `${mon.getDate()} ${ms} — ${sun.getDate()} ${ss} ${sun.getFullYear()}`;
  } else if (view === "day") {
    title = `${IT_DAYS[d.getDay()]} ${d.getDate()} ${IT_MONTHS[d.getMonth()]}`;
    sub = d.getFullYear().toString();
  } else if (view === "todo") {
    title = "Da fare";
    sub = pendingTodoCount !== undefined ? `${pendingTodoCount} attivit${pendingTodoCount === 1 ? "à" : "à"} in sospeso` : "";
  } else if (view === "projects") {
    title = "Clienti & Progetti";
  }

  const showNav = view === "month";

  return (
    <header className="flex items-end justify-between px-7 pt-5 pb-[18px] shrink-0">
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-si-accent mb-1">
          {KICKERS[view] || view}
        </div>
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em] leading-[1.1] text-si-ink">
          {title}
        </h1>
        {sub && <div className="text-[13px] text-si-gray mt-1">{sub}</div>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showNav && (
          <div className="flex items-center gap-0.5 p-1 bg-si-surface rounded-full shadow-si">
            <button type="button" onClick={onPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center text-si-ink hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer">
              <Icon name="chev-left" className="w-[15px] h-[15px]" />
            </button>
            <button type="button" onClick={onToday}
              className="h-8 px-3.5 rounded-full text-si-ink text-[12.5px] font-medium hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer">
              Oggi
            </button>
            <button type="button" onClick={onNext}
              className="w-8 h-8 rounded-full flex items-center justify-center text-si-ink hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer">
              <Icon name="chev-right" className="w-[15px] h-[15px]" />
            </button>
          </div>
        )}
        {onFillMonth && (
          <button type="button" onClick={onFillMonth}
            className="h-10 px-4 rounded-full bg-si-surface shadow-si text-si-ink text-[13px] font-medium flex items-center gap-1.5 border-0 cursor-pointer hover:shadow-si-lg transition-shadow"
            title="Applica modelli ricorrenti ai giorni vuoti del mese">
            <Icon name="repeat" className="w-3.5 h-3.5" />
            Riempi
          </button>
        )}
        {onNewTask && (
          <button type="button" onClick={onNewTask}
            className="h-10 px-[18px] rounded-full text-white text-[13px] font-semibold flex items-center gap-1.5 border-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 6px 16px rgba(99,102,241,0.32)" }}>
            <Icon name="plus" className="w-3.5 h-3.5" />
            Nuova voce
          </button>
        )}
      </div>
    </header>
  );
}
