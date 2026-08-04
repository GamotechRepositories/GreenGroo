import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-border-light bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-primary";

const MENU_MAX_HEIGHT = 224;
const MENU_Z_INDEX = 150;

function LocationAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  fetchSuggestions,
  disabled = false,
  required = false,
  name,
}) {
  const listId = useId();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const loadSuggestions = useCallback(
    async (query) => {
      if (disabled) return;
      setLoading(true);
      try {
        const items = await fetchSuggestions(query);
        setSuggestions(items);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [disabled, fetchSuggestions]
  );

  const updateMenuPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceAbove > spaceBelow || spaceBelow < 160;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: MENU_Z_INDEX,
      ...(openUpward
        ? {
            bottom: window.innerHeight - rect.top + 4,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove - 8),
          }
        : {
            top: rect.bottom + 4,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow - 8),
          }),
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const timer = setTimeout(() => {
      loadSuggestions(value);
    }, 200);

    return () => clearTimeout(timer);
  }, [open, value, loadSuggestions]);

  useLayoutEffect(() => {
    if (!open || disabled) {
      setMenuStyle(null);
      return undefined;
    }

    updateMenuPosition();

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, disabled, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (wrapperRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange(item);
    setOpen(false);
  };

  const menuContent =
    open && !disabled ? (
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        style={menuStyle || undefined}
        className="overflow-y-auto rounded-lg border border-border-light bg-white py-1 shadow-xl"
      >
        {loading ? (
          <li className="px-3 py-2 text-xs text-text-secondary">Loading...</li>
        ) : suggestions.length ? (
          suggestions.map((item) => (
            <li key={item}>
              <button
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="block w-full px-3 py-2 text-left text-sm text-text-primary transition hover:bg-mobile-surface"
              >
                {item}
              </button>
            </li>
          ))
        ) : (
          <li className="px-3 py-2 text-xs text-text-secondary">No suggestions found</li>
        )}
      </ul>
    ) : null;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70`}
      />

      {menuContent && menuStyle && typeof document !== "undefined"
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}

export default LocationAutocomplete;
