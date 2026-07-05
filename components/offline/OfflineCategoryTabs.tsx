"use client";

import { PHRASE_CATEGORY_LABELS } from "@/lib/mock/phrase-categories";
import {
  OFFLINE_UI_CATEGORIES,
  type OfflineUiCategory,
} from "@/lib/offline/basePhraseTemplates";

interface OfflineCategoryTabsProps {
  selected: OfflineUiCategory;
  onChange: (category: OfflineUiCategory) => void;
  availableCategories: OfflineUiCategory[];
}

const TAB_LABELS: Record<OfflineUiCategory, string> = {
  emergency: "Emergency",
  directions: "Directions",
  food_and_water: "Food",
  transport: "Transport",
  medical: "Medical",
  price_and_money: "Money",
  fieldwork_engineering: "Work",
  household_family: "Family",
  shopping_and_market: "Shopping",
  phone_and_communication: "Phone",
  local_response_board: "Saved",
  favorites: "Favorites",
  all: "All",
};

export function OfflineCategoryTabs({
  selected,
  onChange,
  availableCategories,
}: OfflineCategoryTabsProps) {
  const tabs = OFFLINE_UI_CATEGORIES.filter(
    (category) =>
      category === "all" ||
      category === "favorites" ||
      availableCategories.includes(category),
  );

  return (
    <section aria-label="Phrase categories">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((category) => {
          const isActive = selected === category;
          const isEmergency = category === "emergency";

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? isEmergency
                    ? "bg-red-700 text-white"
                    : "bg-[var(--accent)] text-white"
                  : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)]"
              }`}
            >
              {TAB_LABELS[category]}
            </button>
          );
        })}
      </div>
      {selected !== "all" && selected !== "favorites" && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {PHRASE_CATEGORY_LABELS[selected]}
        </p>
      )}
    </section>
  );
}
