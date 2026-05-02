import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";

export function Header({
    year,
    month,
    prevMonth,
    nextMonth,
    goToday,
    onFillMonth,
    onNewTask,
}) {
    return (
        <header className="rounded-3xl border border-slate-200/90 bg-white/70 backdrop-blur px-4 py-4 dark:border-slate-700/50 dark:bg-slate-800/80">
            <div className="flex flex-col gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">DailyLog</div>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {monthNameIT(month)} {year}
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={prevMonth} type="button">
                        <Icon name="chev-left" />
                    </Button>
                    <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={nextMonth} type="button">
                        <Icon name="chev-right" />
                    </Button>
                    <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={goToday} type="button">
                        Oggi
                    </Button>
                    {onNewTask && (
                        <Button
                            className="bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 font-semibold"
                            onClick={onNewTask}
                            type="button"
                        >
                            + Nuovo
                        </Button>
                    )}
                    {onFillMonth && (
                        <Button
                            className="bg-white/95 border border-slate-200 text-slate-700 hover:bg-white hover:text-sky-600 hover:border-sky-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400 transition-colors"
                            onClick={onFillMonth}
                            type="button"
                            title="Applica modelli ricorrenti ai giorni vuoti del mese"
                        >
                            <Icon name="repeat" className="mr-1.5 w-4 h-4" />
                            Riempi
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
