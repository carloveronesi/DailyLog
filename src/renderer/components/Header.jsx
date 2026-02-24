import { monthNameIT } from "../utils/date";
import { Button, Icon } from "./ui";

export function Header({
    year,
    month,
    settings,
    setSettings,
    hasDesktopBridge,
    backupFileHandle,
    supportsAutoBackup,
    enableAutoBackup,
    disableAutoBackup,
    prevMonth,
    nextMonth,
    goToday,
    openSettings,
}) {
    function toggleTheme() {
        setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
    }

    return (
        <header className="rounded-3xl border border-slate-200/90 bg-white/70 backdrop-blur px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between dark:border-slate-700/50 dark:bg-slate-800/80">
            <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">DailyLog</div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                    {monthNameIT(month)} {year}
                </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={prevMonth} type="button">
                    <Icon name="chev-left" />
                </Button>
                <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={nextMonth} type="button">
                    <Icon name="chev-right" />
                </Button>
                <Button className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" onClick={goToday} type="button">
                    Oggi
                </Button>

                <Button
                    className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={openSettings}
                    type="button"
                    title="Impostazioni"
                >
                    <Icon name="settings" className="mr-2" />
                    Settings
                </Button>

                <Button
                    className="bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={toggleTheme}
                    type="button"
                    title="Cambia Tema"
                >
                    <Icon name={settings.theme === "dark" ? "sun" : "moon"} />
                </Button>

                {!hasDesktopBridge ? (
                    <Button
                        className={
                            backupFileHandle
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-white/95 border border-slate-200 text-slate-800 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                        }
                        onClick={backupFileHandle ? disableAutoBackup : enableAutoBackup}
                        type="button"
                        title={backupFileHandle ? "Disattiva backup automatico su file" : "Collega file per backup automatico"}
                        disabled={!supportsAutoBackup && !backupFileHandle}
                    >
                        {backupFileHandle ? "Backup attivo" : "Backup auto"}
                    </Button>
                ) : null}
            </div>
        </header>
    );
}
