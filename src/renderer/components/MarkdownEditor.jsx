import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Componenti con stile Tailwind per il rendering markdown
export const mdComponents = {
  p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong:     ({ children }) => <strong className="font-bold text-si-ink">{children}</strong>,
  em:         ({ children }) => <em className="italic">{children}</em>,
  ul:         ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
  code:       ({ children }) => <code className="bg-si-muted border border-si-border px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-si-border pl-3 text-si-gray italic mb-2">{children}</blockquote>,
  h1:         ({ children }) => <h1 className="text-base font-bold mb-1 text-si-ink">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-sm font-bold mb-1 text-si-ink">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-sm font-semibold mb-1 text-si-inkSoft">{children}</h3>,
  hr:         () => <hr className="my-2 border-si-border" />,
  a:          ({ href, children }) => <a href={href} className="text-si-accent underline" target="_blank" rel="noreferrer">{children}</a>,
};

function insertAround(textarea, before, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = end + before.length;
  return { newValue, cursorStart, cursorEnd };
}

function insertAtLineStart(textarea, prefix) {
  const start = textarea.selectionStart;
  const value = textarea.value;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  return { newValue, cursorStart: start + prefix.length, cursorEnd: start + prefix.length };
}

function ToolbarBtn({ onMouseDown, title, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors border-0 cursor-pointer ${
        active
          ? "bg-si-border text-si-ink"
          : "text-si-grayLight hover:text-si-inkSoft hover:bg-si-muted bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

export function MarkdownEditor({ value, onChange, placeholder, isListening, micButton }) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  function applyFormat(type) {
    const ta = textareaRef.current;
    if (!ta) return;
    let result;
    if (type === "bold")   result = insertAround(ta, "**", "**");
    if (type === "italic") result = insertAround(ta, "*", "*");
    if (type === "ul")     result = insertAtLineStart(ta, "- ");
    if (type === "ol")     result = insertAtLineStart(ta, "1. ");
    if (!result) return;
    onChange(result.newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(result.cursorStart, result.cursorEnd);
    });
  }

  const borderClass = isListening
    ? "border-red-400"
    : "border-si-border";

  const focusRingClass = isListening
    ? "focus-within:ring-2 focus-within:ring-red-400/20 focus-within:border-red-400"
    : "focus-within:ring-2 focus-within:ring-si-accent/20 focus-within:border-si-accent";

  return (
    <div className={`rounded-xl border bg-si-surface transition ${borderClass} ${focusRingClass}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1 border-b border-si-border">
        {!preview && (
          <>
            <ToolbarBtn
              title="Grassetto"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("bold"); }}
            >
              <span className="font-bold text-[13px] leading-none">B</span>
            </ToolbarBtn>
            <ToolbarBtn
              title="Corsivo"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("italic"); }}
            >
              <span className="italic text-[13px] leading-none font-serif">I</span>
            </ToolbarBtn>
            <div className="w-px h-3.5 bg-si-border mx-1 shrink-0" />
            <ToolbarBtn
              title="Elenco puntato"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("ul"); }}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
                <circle cx="2" cy="5" r="1.5"/>
                <rect x="5" y="4" width="9" height="1.8" rx="0.9"/>
                <circle cx="2" cy="11" r="1.5"/>
                <rect x="5" y="10" width="9" height="1.8" rx="0.9"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              title="Elenco numerato"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("ol"); }}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
                <text x="0.5" y="6.5" fontSize="6" fontFamily="monospace" fontWeight="bold">1.</text>
                <rect x="5" y="4" width="9" height="1.8" rx="0.9"/>
                <text x="0.5" y="12.5" fontSize="6" fontFamily="monospace" fontWeight="bold">2.</text>
                <rect x="5" y="10" width="9" height="1.8" rx="0.9"/>
              </svg>
            </ToolbarBtn>
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPreview(v => !v)}
          className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md transition-colors border-0 cursor-pointer ${
            preview
              ? "bg-si-ink text-white"
              : "text-si-grayLight hover:text-si-inkSoft bg-transparent"
          }`}
        >
          {preview ? "Modifica" : "Anteprima"}
        </button>
      </div>

      {/* Area principale */}
      {preview ? (
        <div className="px-3 py-2.5 min-h-[100px] text-sm text-si-inkSoft">
          {value?.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {value}
            </ReactMarkdown>
          ) : (
            <span className="text-si-grayLight italic">Nessun contenuto</span>
          )}
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="min-h-[100px] w-full bg-transparent px-3 py-2.5 pb-8 text-sm text-si-ink resize-none outline-none placeholder:text-si-grayLight"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {micButton && (
            <div className="absolute bottom-2 right-2">{micButton}</div>
          )}
        </div>
      )}
    </div>
  );
}
