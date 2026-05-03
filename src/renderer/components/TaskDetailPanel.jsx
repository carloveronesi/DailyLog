import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { mdComponents } from "./MarkdownEditor";
import { Icon } from "./ui";
import { TASK_TYPES, badgePresentation, getSubtypeLabel, getInternalSubtaskLabel, hourLabel } from "../domain/tasks";
import { useSettings } from "../contexts/SettingsContext";

const DOW_IT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MONTH_IT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function formatTimeRange(start, end, slot) {
  if (typeof start === "number" && typeof end === "number") {
    return `${hourLabel(start)} – ${hourLabel(end)}`;
  }
  if (slot === "AM") return "Mattina";
  if (slot === "PM") return "Pomeriggio";
  return "Giornata intera";
}

function Section({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

export function TaskDetailPanel({ date, entry, start, end, slot, onClose, onEdit }) {
  const { settings } = useSettings();
  const clientColors = settings?.clientColors || {};
  const internalColors = settings?.internalColors || {};
  const taskSubtypes = settings?.taskSubtypes || {};

  if (!entry) return null;

  const badge = badgePresentation(entry, clientColors, internalColors);
  const typeObj = TASK_TYPES.find(t => t.id === entry.type);
  const typeLabel = typeObj?.label || entry.type;
  const timeRange = formatTimeRange(start, end, slot);

  const subtypeLabel =
    entry.subtypeId && entry.type !== "vacation" && entry.type !== "event"
      ? getSubtypeLabel(entry.type, entry.subtypeId, taskSubtypes, entry.client)
      : null;

  const internalSubtaskLabel =
    entry.type === "internal" && entry.internalSubtask
      ? getInternalSubtaskLabel(entry.subtypeId, entry.internalSubtask)
      : null;

  const dateStr = date
    ? `${DOW_IT[date.getDay()]} ${date.getDate()} ${MONTH_IT[date.getMonth()]} ${date.getFullYear()}`
    : null;

  const hasBody =
    (entry.type === "client" && entry.client) ||
    entry.milestone ||
    entry.collaborators?.length > 0 ||
    entry.clientContacts?.length > 0 ||
    entry.notes?.trim() ||
    entry.wentWrong?.trim() ||
    entry.nextSteps?.trim() ||
    entry.links?.length > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/10 dark:bg-black/20"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm z-[60] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide " + badge.className}
                style={badge.style}
              >
                {typeLabel}
              </span>
              {subtypeLabel && subtypeLabel !== "Generico" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {subtypeLabel}
                </span>
              )}
              {internalSubtaskLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {internalSubtaskLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight break-words">
            {entry.title?.trim() || <span className="italic text-slate-400 font-normal text-lg">(senza titolo)</span>}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {dateStr && <span>{dateStr}</span>}
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Icon name="clock" className="w-3 h-3" />
              {timeRange}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {!hasBody && (
            <div className="text-sm text-slate-400 dark:text-slate-500 italic text-center pt-4">
              Nessun dettaglio aggiuntivo
            </div>
          )}

          {entry.type === "client" && entry.client && (
            <Section label="Cliente">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{entry.client}</div>
            </Section>
          )}

          {entry.milestone && (
            <Section label="Milestone">
              <div className="flex items-center gap-1.5">
                <Icon name="target" className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{entry.milestone}</span>
              </div>
            </Section>
          )}

          {entry.collaborators?.length > 0 && (
            <Section label="Collaboratori">
              <div className="flex flex-wrap gap-1.5">
                {entry.collaborators.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {entry.clientContacts?.length > 0 && (
            <Section label="Referenti cliente">
              <div className="flex flex-wrap gap-1.5">
                {entry.clientContacts.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-100 dark:border-violet-800/50"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {entry.notes?.trim() && (
            <Section label="Note">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {entry.notes}
                </ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.wentWrong?.trim() && (
            <Section label="Cosa non ha funzionato">
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {entry.wentWrong}
                </ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.nextSteps?.trim() && (
            <Section label="Prossimi passi">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {entry.nextSteps}
                </ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.links?.length > 0 && (
            <Section label="Link">
              <div className="space-y-1.5">
                {entry.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <Icon name="link" className="w-3.5 h-3.5 shrink-0" />
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
          >
            <Icon name="pencil" className="w-4 h-4" />
            Modifica
          </button>
        </div>
      </aside>
    </>
  );
}
