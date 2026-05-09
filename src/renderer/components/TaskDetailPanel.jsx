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
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-si-gray mb-1.5">
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
        className="fixed inset-0 z-[55] bg-si-ink/10"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-sm z-[60] flex flex-col bg-si-surface border-l border-si-border shadow-si-lg overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-si-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={"inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide " + badge.className}
                style={badge.style}
              >
                {typeLabel}
              </span>
              {subtypeLabel && subtypeLabel !== "Generico" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-si-muted text-si-gray border border-si-border">
                  {subtypeLabel}
                </span>
              )}
              {internalSubtaskLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-si-muted text-si-gray border border-si-border">
                  {internalSubtaskLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-si-gray hover:text-si-ink hover:bg-si-muted transition-colors border-0 bg-transparent cursor-pointer"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-si-ink leading-tight break-words">
            {entry.title?.trim() || <span className="italic text-si-grayLight font-normal text-lg">(senza titolo)</span>}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-si-gray">
            {dateStr && <span>{dateStr}</span>}
            <span className="text-si-grayLight">·</span>
            <span className="flex items-center gap-1">
              <Icon name="clock" className="w-3 h-3" />
              {timeRange}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {!hasBody && (
            <div className="text-sm text-si-grayLight italic text-center pt-4">
              Nessun dettaglio aggiuntivo
            </div>
          )}

          {entry.type === "client" && entry.client && (
            <Section label="Cliente">
              <div className="text-sm font-semibold text-si-ink">{entry.client}</div>
            </Section>
          )}

          {entry.milestone && (
            <Section label="Milestone">
              <div className="flex items-center gap-1.5">
                <Icon name="target" className="w-3.5 h-3.5 text-si-accent shrink-0" />
                <span className="text-sm text-si-inkSoft">{entry.milestone}</span>
              </div>
            </Section>
          )}

          {entry.collaborators?.length > 0 && (
            <Section label="Collaboratori">
              <div className="flex flex-wrap gap-1.5">
                {entry.collaborators.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-si-accentSoft text-si-accent"
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
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-si-violetSoft text-si-violet"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {entry.notes?.trim() && (
            <Section label="Note">
              <div className="text-sm text-si-inkSoft">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {entry.notes}
                </ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.wentWrong?.trim() && (
            <Section label="Cosa non ha funzionato">
              <div className="rounded-xl bg-si-rose/8 border border-si-rose/20 px-3 py-2.5 text-sm text-si-rose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {entry.wentWrong}
                </ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.nextSteps?.trim() && (
            <Section label="Prossimi passi">
              <div className="rounded-xl bg-si-success/8 border border-si-success/20 px-3 py-2.5 text-sm text-si-success">
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
                    className="flex items-center gap-2 text-sm text-si-accent hover:underline"
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
        <div className="shrink-0 px-5 py-4 border-t border-si-border">
          <button
            type="button"
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors border-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 4px 12px rgba(99,102,241,0.28)" }}
          >
            <Icon name="pencil" className="w-4 h-4" />
            Modifica
          </button>
        </div>
      </aside>
    </>
  );
}
