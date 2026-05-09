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
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

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

  const exactMatch = options.find((opt) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase() === (inputValue || "").toLowerCase();
  });

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
            if (e.key === "Enter" && isOpen) {
              if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
              } else if (allowCustom && inputValue.trim()) {
                handleCustomAdd();
              }
              e.preventDefault();
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

                return (
                  <button
                    key={typeof opt === "string" ? opt : opt.id || idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center justify-between group border-0 cursor-pointer ${
                      isSelected
                        ? "bg-si-accentBg text-si-accent"
                        : "text-si-inkSoft hover:bg-si-muted bg-transparent"
                    }`}
                  >
                    {renderItem ? renderItem(opt) : label}
                    {isSelected && <Icon name="check" className="w-3.5 h-3.5 text-si-accent" />}
                  </button>
                );
              })
            )}

            {allowCustom && inputValue.trim() && !exactMatch && (
              <div className="border-t border-si-border mt-1 pt-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCustomAdd}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-si-accent hover:bg-si-accentBg rounded-xl transition-colors border-0 bg-transparent cursor-pointer"
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
