"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { fieldInputClassName } from "@/components/ui/FormField";
import {
  getLanguageSelectGroups,
  type LanguageSelectGroup,
} from "@/lib/languages/languageOptions";

export interface SearchableLanguageSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  leadingOptions?: Array<{ value: string; label: string }>;
}

type FlatOption = LanguageSelectGroup["options"][number] & { groupLabel: string };

function flattenGroups(groups: LanguageSelectGroup[]): FlatOption[] {
  return groups.flatMap((group) =>
    group.options.map((option) => ({ ...option, groupLabel: group.label })),
  );
}

function findSelectedLabel(value: string, groups: LanguageSelectGroup[]): string | undefined {
  for (const group of groups) {
    const match = group.options.find((option) => option.value === value);
    if (match) return match.label;
  }
  return undefined;
}

export function SearchableLanguageSelect({
  id,
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = "Select language",
  leadingOptions = [],
}: SearchableLanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allGroups = useMemo(() => getLanguageSelectGroups(), []);
  const filteredGroups = useMemo(
    () => getLanguageSelectGroups(searchQuery),
    [searchQuery],
  );
  const flatOptions = useMemo(() => {
    const leading = leadingOptions.map((option) => ({
      ...option,
      native_name: option.label,
      search_text: option.label.toLowerCase(),
      groupLabel: "Source",
    }));
    return [...leading, ...flattenGroups(filteredGroups)];
  }, [filteredGroups, leadingOptions]);

  const selectedLabel = useMemo(() => {
    const leading = leadingOptions.find((option) => option.value === value);
    if (leading) return leading.label;
    return findSelectedLabel(value, allGroups) ?? placeholder;
  }, [allGroups, leadingOptions, placeholder, value]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setSearchQuery("");
    setActiveIndex(0);
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      closeMenu();
    },
    [closeMenu, onChange],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus();
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeElement = listRef.current.querySelector('[data-active="true"]');
    activeElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (flatOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, flatOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = flatOptions[activeIndex];
      if (option) selectOption(option.value);
    }
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

          const triggerClassName = `${fieldInputClassName(hasError)} flex min-h-12 items-center justify-between gap-2 text-left touch-manipulation`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        name={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClassName}
      >
        <span className={selectedLabel === placeholder ? "text-[var(--muted)]" : "truncate"}>
          {selectedLabel}
        </span>
        <span aria-hidden className="shrink-0 text-xs text-[var(--muted)]">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg">
          <div className="border-b border-[var(--card-border)] p-2">
            <input
              ref={searchInputRef}
              id={`${id}_search`}
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleMenuKeyDown}
              placeholder="Search languages…"
              className={fieldInputClassName()}
              aria-label="Search languages"
              autoComplete="off"
            />
          </div>

          <div
            id={`${id}-listbox`}
            ref={listRef}
            role="listbox"
            aria-labelledby={id}
            aria-activedescendant={
              flatOptions[activeIndex] ? `${id}-option-${flatOptions[activeIndex].value}` : undefined
            }
            className="max-h-64 overflow-y-auto overscroll-contain"
            onKeyDown={handleMenuKeyDown}
          >
            {filteredGroups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <div
                  className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                  id={`${id}-group-${group.label.replace(/\W+/g, "-").toLowerCase()}`}
                >
                  {group.label}
                </div>
                {group.options.map((option) => {
                  const optionIndex = flatOptions.findIndex(
                    (flatOption) => flatOption.value === option.value,
                  );
                  const isActive = optionIndex === activeIndex;
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      id={`${id}-option-${option.value}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive ? "true" : "false"}
                      className={`flex min-h-12 w-full touch-manipulation items-center px-3 py-2.5 text-left text-base transition-colors hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-indigo)] ${
                        isSelected ? "bg-[var(--background)] font-medium" : ""
                      } ${isActive ? "bg-[var(--background)]" : ""}`}
                      onMouseEnter={() => setActiveIndex(optionIndex)}
                      onClick={() => selectOption(option.value)}
                    >
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {flatOptions.length === 0 && (
              <p className="px-3 py-4 text-sm text-[var(--muted)]">
                No languages match your search.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
