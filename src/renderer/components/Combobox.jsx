import { useState, useRef, useEffect } from "react";
import { Icon } from "./ui";

/**
 * A reusable searchable dropdown (Combobox).
 *
 * Props:
 * - value: Current value (string or id).
 * - onChange: (newVal) => void.
 * - options: Array of strings or { id, label } objects.
 * - placeholder: Input placeholder.
 * - allowCustom: Whether to show a "Create new" option when no match is found.
 * - className: Additional CSS classes for the container.
 * - renderItem: Custom renderer for each option.
 * - onFocus: Optional focus handler.
 */
export function Combobox({
  value,
  onChange,
  options = [],
  placeholder = "Seleziona...",
  allowCustom = false,
  className = "",
  renderItem,
  onFocus,
  onBlur,
  onKeyDown,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  // Sync internal input value with external value if needed
  useEffect(() => {
    const matchedOption = options.find((opt) => {
      const optId = typeof opt === "string" ? opt : opt.id;
      return optId === value;
    });
    const label = matchedOption
      ? typeof matchedOption === "string"
        ? matchedOption
        : matchedOption.label
      : value || "";
    setInputValue(label);
  }, [value, options]);

  // Outside click to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = !isSearching || (inputValue || "").trim() === ""
    ? options
    : options.filter((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        return label.toLowerCase().includes(inputValue.toLowerCase());
      });

  const showCustomAdd = allowCustom && (inputValue || "").trim() && !options.find((opt) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase() === inputValue.toLowerCase();
  });
  const navMaxIndex = filteredOptions.length - 1 + (showCustomAdd ? 1 : 0);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const node = optionRefs.current[highlightedIndex];
    node?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  const handleSelect = (opt) => {
    const optId = typeof opt === "string" ? opt : opt.id;
    onChange(optId);
    setIsOpen(false);
    setIsSearching(false);
  };

  const handleCustomAdd = () => {
    onChange(inputValue);
    setIsOpen(false);
    setIsSearching(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative group/input">
        <input
          ref={inputRef}
          className="w-full rounded-xl border border-si-border bg-si-surface pl-3 pr-10 py-2.5 text-sm text-si-ink focus:ring-2 focus:ring-si-accent/20 focus:border-si-accent outline-none transition"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setIsSearching(true);
            // If the user clears the input, we notify the parent (especially for custom creation)
            if (e.target.value === "") onChange("");
          }}
          onFocus={(e) => {
            setIsOpen(true);
            setIsSearching(false);
            onFocus?.(e);
          }}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex((i) => Math.min(i + 1, navMaxIndex));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && isOpen) {
              e.preventDefault();
              if (highlightedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[highlightedIndex]);
              } else if (showCustomAdd) {
                handleCustomAdd();
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
            onKeyDown?.(e);
          }}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-si-grayLight pointer-events-none group-focus-within/input:text-si-accent transition-colors">
          <Icon name="chev-down" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-hidden overflow-y-auto rounded-2xl border border-si-border bg-si-surface shadow-si-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1">
            {filteredOptions.length === 0 && !allowCustom ? (
              <div className="px-3 py-2 text-xs font-medium text-si-gray italic">Nessuna opzione trovata.</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optId = typeof opt === "string" ? opt : opt.id;
                const label = typeof opt === "string" ? opt : opt.label;
                const isSelected = optId === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={typeof opt === "string" ? opt : opt.id || idx}
                    ref={(el) => (optionRefs.current[idx] = el)}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center justify-between group border-0 cursor-pointer ${
                      isSelected
                        ? "bg-si-accentBg text-si-accent"
                        : isHighlighted
                          ? "bg-si-muted text-si-ink"
                          : "text-si-inkSoft hover:bg-si-muted bg-transparent"
                    }`}
                  >
                    {renderItem ? renderItem(opt) : label}
                    {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-si-accent" />}
                  </button>
                );
              })
            )}

            {showCustomAdd && (
              <div className="border-t border-si-border mt-1 pt-1">
                <button
                  ref={(el) => (optionRefs.current[filteredOptions.length] = el)}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                  onClick={handleCustomAdd}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors border-0 cursor-pointer ${
                    highlightedIndex === filteredOptions.length
                      ? "bg-si-accentBg text-si-accent"
                      : "text-si-accent hover:bg-si-accentBg bg-transparent"
                  }`}
                >
                  Crea nuovo: <span className="underline">{inputValue}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
