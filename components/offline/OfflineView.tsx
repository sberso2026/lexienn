"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OfflineMissingRequestsCard } from "@/components/offline/OfflineMissingRequestsCard";
import { LocalResponseButtons } from "@/components/offline/LocalResponseButtons";
import { OfflineCategoryTabs } from "@/components/offline/OfflineCategoryTabs";
import { OfflineLanguagePairSelector } from "@/components/offline/OfflineLanguagePairSelector";
import { OfflinePhraseCard } from "@/components/offline/OfflinePhraseCard";
import {
  OfflineStatusBanner,
  type OfflineBannerState,
} from "@/components/offline/OfflineStatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextInputField } from "@/components/ui/TextInputField";
import { ActionButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";
import type { OfflineUiCategory } from "@/lib/offline/basePhraseTemplates";
import { packEntryToLegacyPhrase } from "@/lib/offline/localOfflineStore";
import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import {
  getOfflineDefaultLanguages,
  USER_PREFERENCES_UPDATED_EVENT,
} from "@/lib/settings/userPreferences";
import { OfflinePackDownloadPanel } from "@/components/offline/OfflinePackDownloadPanel";
import { useOfflinePackDownload } from "@/hooks/useOfflinePackDownload";
import { mapPackDownloadErrorMessage } from "@/lib/offline/offlinePackDownloadTypes";
import {
  getRecentPairs,
  getRecentPhrases,
  getStorageEstimate,
  inspectOfflinePackAvailability,
  isBrowserOnline,
  isLanguagePairSelected,
  listOfflineFavoriteEntryIds,
  listOfflineMissingRequests,
  recordOfflineMissingPhraseRequest,
  removeOfflineLanguagePairPack,
  setActiveOfflinePairKey,
  toggleOfflineFavorite,
  trackOfflinePhraseUsage,
  updateOfflineLanguagePairPack,
  type OfflinePackAvailability,
} from "@/lib/offline/offlinePackService";
import type { OfflineMissingRequest } from "@/lib/offline/offlinePackSchemas";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import {
  getOfflineEntriesByCategory,
  searchOfflinePackEntries,
} from "@/lib/offline/offlinePhraseSearch";

export function OfflineView() {
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);
  const [fromLanguage, setFromLanguage] = useState("");
  const [toLanguage, setToLanguage] = useState("");
  const [availability, setAvailability] = useState<OfflinePackAvailability | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OfflineUiCategory>("emergency");
  const [isOnline, setIsOnline] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | undefined>();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [missingCaptureInput, setMissingCaptureInput] = useState("");
  const [favoriteEntryIds, setFavoriteEntryIds] = useState<string[]>([]);
  const [missingRequests, setMissingRequests] = useState<OfflineMissingRequest[]>([]);
  const [recentPhrases, setRecentPhrases] = useState<
    Awaited<ReturnType<typeof getRecentPhrases>>
  >([]);
  const [recentPairs, setRecentPairs] = useState<
    Awaited<ReturnType<typeof getRecentPairs>>
  >([]);

  const {
    snapshot: downloadSnapshot,
    isRunning: isDownloadRunning,
    showProgress,
    startDownload,
    resumeDownload,
    retryAudio,
    cancelDownload,
    loadProgressForPair,
  } = useOfflinePackDownload();

  const pairSelected = isLanguagePairSelected(fromLanguage, toLanguage);
  const isBusy = isDownloadRunning;

  const applyInitialLanguages = useCallback(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (fromParam && toParam) {
      setFromLanguage(fromParam);
      setToLanguage(toParam);
      return;
    }
    const defaults = getOfflineDefaultLanguages();
    if (defaults) {
      setFromLanguage(defaults.from);
      setToLanguage(defaults.to);
    } else {
      setFromLanguage("");
      setToLanguage("");
    }
  }, [searchParams]);

  useEffect(() => {
    applyInitialLanguages();
  }, [applyInitialLanguages]);

  useEffect(() => {
    const handlePreferencesUpdated = () => applyInitialLanguages();
    window.addEventListener(USER_PREFERENCES_UPDATED_EVENT, handlePreferencesUpdated);
    return () =>
      window.removeEventListener(USER_PREFERENCES_UPDATED_EVENT, handlePreferencesUpdated);
  }, [applyInitialLanguages]);

  const refresh = useCallback(async () => {
    const [inspected, storage, recentPhraseList, recentPairList] = await Promise.all([
      pairSelected
        ? inspectOfflinePackAvailability(fromLanguage, toLanguage)
        : Promise.resolve(null),
      getStorageEstimate(),
      getRecentPhrases(),
      getRecentPairs(),
    ]);

    setAvailability(inspected);
    setStorageWarning(storage.warning);
    setRecentPhrases(recentPhraseList);
    setRecentPairs(recentPairList);
    if (inspected?.outdatedWarning) {
      setActionMessage(inspected.outdatedWarning);
    }

    if (inspected?.pack) {
      const [favorites, missing] = await Promise.all([
        listOfflineFavoriteEntryIds(inspected.pack.pack_key),
        listOfflineMissingRequests(inspected.pack.pack_key),
      ]);
      setFavoriteEntryIds(favorites);
      setMissingRequests(missing);
    } else if (pairSelected) {
      const packKey = buildOfflinePackKey(fromLanguage, toLanguage);
      const missing = await listOfflineMissingRequests(packKey);
      setFavoriteEntryIds([]);
      setMissingRequests(missing);
    } else {
      setFavoriteEntryIds([]);
      setMissingRequests([]);
    }

    setLoaded(true);
  }, [fromLanguage, pairSelected, toLanguage]);

  useEffect(() => {
    setIsOnline(isBrowserOnline());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const displayedPack = useMemo(() => {
    if (!pairSelected) return null;
    return availability?.pack ?? null;
  }, [availability, pairSelected]);

  const targetLanguageCode = toLanguage
    ? resolveLanguageSelection(toLanguage).base_language
    : "en";
  const targetDialect = toLanguage
    ? resolveLanguageSelection(toLanguage).dialect_variant
    : undefined;

  const availableCategories = useMemo(() => {
    if (!displayedPack) return [] as OfflineUiCategory[];
    const categories = [
      ...new Set(displayedPack.entries.map((entry) => entry.category)),
    ] as OfflineUiCategory[];
    if (favoriteEntryIds.length > 0) {
      categories.push("favorites");
    }
    return categories;
  }, [displayedPack, favoriteEntryIds.length]);

  const filteredEntries = useMemo(() => {
    if (!displayedPack) return [];
    const hasSearchQuery = searchQuery.trim().length > 0;
    const categoryEntries = hasSearchQuery
      ? displayedPack.entries
      : getOfflineEntriesByCategory(
          displayedPack,
          selectedCategory,
          favoriteEntryIds,
        );
    return searchOfflinePackEntries(
      { ...displayedPack, entries: categoryEntries },
      searchQuery,
    );
  }, [displayedPack, favoriteEntryIds, searchQuery, selectedCategory]);

  const bannerState: OfflineBannerState = !pairSelected
    ? "no_pair_selected"
    : !displayedPack
      ? "pack_missing"
      : availability?.status === "update_available"
        ? "update_available"
        : availability?.status === "audio_downloading"
          ? "audio_downloading"
          : availability?.status === "text_ready"
            ? "text_ready"
            : "pack_downloaded";

  const lastMissingSearchRef = useRef("");

  const captureMissingPhrase = useCallback(
    async (text: string, options?: { allowDuplicate?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || !pairSelected) return false;

      const packKey = buildOfflinePackKey(fromLanguage, toLanguage);
      const dedupeKey = `${packKey}:${trimmed.toLowerCase()}`;
      if (!options?.allowDuplicate && lastMissingSearchRef.current === dedupeKey) {
        return false;
      }
      lastMissingSearchRef.current = dedupeKey;

      await recordOfflineMissingPhraseRequest({
        from_language_id: fromLanguage,
        to_language_id: toLanguage,
        pack_key: packKey,
        requested_text: trimmed,
        user_context: "traveller",
      });
      setToastMessage(`Saved ✓ “${trimmed}”`);
      await refresh();
      return true;
    },
    [fromLanguage, pairSelected, refresh, toLanguage],
  );

  useEffect(() => {
    if (!displayedPack || !searchQuery.trim()) return;

    const timer = window.setTimeout(() => {
      const matches = searchOfflinePackEntries(displayedPack, searchQuery);
      if (matches.length > 0) return;
      if (searchQuery.trim().length < 4) return;

      void captureMissingPhrase(searchQuery);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [captureMissingPhrase, displayedPack, searchQuery]);

  async function handleSaveMissingCapture() {
    const trimmed = missingCaptureInput.trim();
    if (!trimmed || !pairSelected) return;

    const alreadySaved = missingRequests.some(
      (request) => request.requested_text.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadySaved) {
      setToastMessage(`Saved ✓ “${trimmed}” is already in your list.`);
      setMissingCaptureInput("");
      return;
    }

    await captureMissingPhrase(trimmed, { allowDuplicate: true });
    setMissingCaptureInput("");
  }

  useEffect(() => {
    void loadProgressForPair(fromLanguage, toLanguage);
  }, [fromLanguage, loadProgressForPair, toLanguage]);

  function buildDownloadRequest() {
    const toResolved = resolveLanguageSelection(toLanguage);
    const fromResolved = resolveLanguageSelection(fromLanguage);
    return {
      from_language: fromLanguage,
      to_language: toLanguage,
      to_dialect: toResolved.dialect_variant,
      target_language_selection: toLanguage,
      target_locale_tag: toResolved.locale_tag,
      target_dialect_label: toResolved.dialect_label,
      target_display_name: toResolved.display_label,
      from_display_name: fromResolved.display_label,
      user_context: "traveller" as const,
      pack_tier: "lite" as const,
      include_audio_manifest: true,
    };
  }

  async function handleDownload(options?: { resume?: boolean }) {
    if (!pairSelected) return;
    setActionMessage(null);
    try {
      const pack = await (options?.resume ? resumeDownload : startDownload)(
        buildDownloadRequest(),
      );
      setActiveOfflinePairKey(pack.pack_key);
      setActionMessage(
        pack.audio_coverage_percent > 0
          ? `Downloaded ${pack.from_display_name} → ${pack.to_display_name}. ${pack.audio_coverage_percent}% audio cached.`
          : `Text downloaded for ${pack.from_display_name} → ${pack.to_display_name}. Audio can be retried.`,
      );
      await refresh();
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      setActionMessage(
        code
          ? mapPackDownloadErrorMessage(code as never)
          : error instanceof Error
            ? error.message
            : "Could not download offline pack.",
      );
      await refresh();
    }
  }

  const handleDownloadRef = useRef(handleDownload);
  handleDownloadRef.current = handleDownload;

  async function handleRetryAudio() {
    if (!pairSelected) return;
    setActionMessage(null);
    try {
      const pack = await retryAudio(buildDownloadRequest());
      setActionMessage(
        pack.audio_coverage_percent > 0
          ? `Audio retry complete. ${pack.audio_coverage_percent}% audio cached.`
          : "Audio retry finished. Some files may still be unavailable.",
      );
      await refresh();
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Could not retry audio download.",
      );
    }
  }

  async function handleUpdate() {
    if (!pairSelected) return;
    setActionMessage(null);
    try {
      const toResolved = resolveLanguageSelection(toLanguage);
      const fromResolved = resolveLanguageSelection(fromLanguage);
      await updateOfflineLanguagePairPack({
        from_language: fromLanguage,
        to_language: toLanguage,
        to_dialect: toResolved.dialect_variant,
        target_language_selection: toLanguage,
        target_locale_tag: toResolved.locale_tag,
        target_dialect_label: toResolved.dialect_label,
        target_display_name: toResolved.display_label,
        from_display_name: fromResolved.display_label,
        user_context: "traveller",
        pack_tier: "lite",
        include_audio_manifest: true,
      });
      setActionMessage("Offline pack updated on this device.");
      await refresh();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Update failed. Your existing local pack remains usable.",
      );
    }
  }

  async function handleRemove() {
    if (!availability?.packKey) return;
    await removeOfflineLanguagePairPack(availability.packKey);
    setActionMessage("Offline pack removed from this device.");
    await refresh();
  }

  function handleRecentPairSelect(from: string, to: string) {
    setFromLanguage(from);
    setToLanguage(to);
  }

  const autoDownloadRequested = searchParams.get("download") === "1";
  const autoDownloadStartedRef = useRef(false);

  useEffect(() => {
    if (!loaded || !pairSelected || !autoDownloadRequested || autoDownloadStartedRef.current) {
      return;
    }
    if (availability?.status === "missing" || downloadSnapshot.phase === "paused") {
      autoDownloadStartedRef.current = true;
      void handleDownloadRef.current({ resume: downloadSnapshot.phase === "paused" });
    }
  }, [
    autoDownloadRequested,
    availability?.status,
    downloadSnapshot.phase,
    loaded,
    pairSelected,
  ]);

  const canRetryAudio =
    Boolean(availability?.pack) &&
    (availability?.status === "text_ready" ||
      (availability?.pack?.audio_coverage_percent ?? 0) < 100);

  async function handleToggleFavorite(entryId: string) {
    if (!displayedPack) return;
    await toggleOfflineFavorite(entryId, displayedPack.pack_key);
    await refresh();
  }

  if (!loaded) {
    return <LoadingState title="Loading offline mode" label="Loading offline mode…" />;
  }

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Library · Offline
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Offline Packs</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Download language pairs, audio, and essential phrases for dependable offline use.
        </p>
      </section>
      <OfflineStatusBanner
        isOnline={isOnline}
        packState={bannerState}
        pairLabel={availability?.pairLabel}
        textCoverageLabel={availability?.textCoverageLabel}
        audioCoverageLabel={availability?.audioCoverageLabel}
        packTierLabel={availability?.packTierLabel}
        lastUpdatedLabel={
          availability?.pack?.updated_at
            ? new Date(availability.pack.updated_at).toLocaleString()
            : undefined
        }
        availabilityMessage={availability?.availabilityMessage}
        storageWarning={storageWarning}
        actionMessage={actionMessage}
      />

      <OfflineLanguagePairSelector
        fromLanguage={fromLanguage}
        toLanguage={toLanguage}
        onFromChange={setFromLanguage}
        onToChange={setToLanguage}
        availability={availability}
        isOnline={isOnline}
        isBusy={isBusy}
        pairSelected={pairSelected}
        downloadSnapshot={downloadSnapshot}
        onDownload={() => void handleDownload()}
        onResume={() => void handleDownload({ resume: true })}
        onUpdate={() => void handleUpdate()}
        onRemove={() => void handleRemove()}
      />

      {(showProgress || downloadSnapshot.phase !== "idle") && (
        <OfflinePackDownloadPanel
          snapshot={downloadSnapshot}
          isRunning={isDownloadRunning}
          isOnline={isOnline}
          canRetryAudio={canRetryAudio}
          onCancel={cancelDownload}
          onResume={() => void handleDownload({ resume: true })}
          onRetry={() => void handleDownload({ resume: true })}
          onRetryAudio={() => void handleRetryAudio()}
        />
      )}

      {(recentPairs.length > 0 || recentPhrases.length > 0) && (
        <SectionCard title="Recent offline" subtitle="Recently used phrases and language pairs.">
          {recentPairs.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {recentPairs.map((pair) => (
                <ActionButton
                  key={pair.pack_key}
                  variant="secondary"
                  onClick={() =>
                    handleRecentPairSelect(pair.from_language_id, pair.to_language_id)
                  }
                >
                  {pair.from_display_name} → {pair.to_display_name}
                </ActionButton>
              ))}
            </div>
          )}
          {recentPhrases.length > 0 && (
            <ul className="space-y-2">
              {recentPhrases.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{item.source_text}</span>
                  <span className="mx-2 text-[var(--muted)]">→</span>
                  <span>{item.translated_text}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {pairSelected && (
        <OfflineMissingRequestsCard
          requests={missingRequests}
          isOnline={isOnline}
          isBusy={isBusy}
          onUpdated={refresh}
          onPackUpdated={refresh}
          onPhraseAdded={(requestedText) => {
            setSearchQuery(requestedText);
            setSelectedCategory("all");
          }}
          onSuccess={(message) => setToastMessage(message)}
          onError={(message) => setActionMessage(message)}
        />
      )}

      {!pairSelected ? (
        <EmptyState
          title="No language pair selected"
          description="Choose a From language and To language to manage offline phrase packs."
        />
      ) : !displayedPack ? (
        <div className="space-y-4">
          <EmptyState
            title="No offline pack downloaded for this language pair."
            description={
              isOnline
                ? availability?.availabilityMessage ??
                  "Download or generate a pack for your selected languages."
                : "Connect to the internet to generate a pack, or switch to a pair you have already downloaded."
            }
          />

          <SectionCard
            title="Save a missing phrase"
            subtitle="Could not find a phrase while offline? Save it here for this language pair."
          >
            <div className="space-y-3">
              <TextInputField
                id="offline-missing-capture"
                label="Phrase you needed"
                value={missingCaptureInput}
                onChange={setMissingCaptureInput}
                placeholder="e.g. Where is the pharmacy?"
              />
              <ActionButton
                fullWidth
                disabled={!missingCaptureInput.trim() || isBusy}
                onClick={() => void handleSaveMissingCapture()}
              >
                Save missing phrase
              </ActionButton>
            </div>
          </SectionCard>
        </div>
      ) : (
        <>
          <TextInputField
            id="offline-phrase-search"
            label="Search downloaded phrases"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search: help, doctor, road…"
          />

          {searchQuery.trim() && selectedCategory !== "all" && (
            <p className="text-xs text-[var(--muted)]">
              Searching all downloaded phrases, including ones you added from missing requests.
            </p>
          )}

          <OfflineCategoryTabs
            selected={selectedCategory}
            onChange={setSelectedCategory}
            availableCategories={availableCategories}
          />

          {selectedCategory === "emergency" && (
            <div
              className="rounded-xl border-2 border-red-600 bg-red-700 px-4 py-4 text-center text-white shadow-sm"
              role="alert"
            >
              <p className="text-lg font-bold">Emergency communication mode</p>
              <p className="mt-1 text-sm text-red-100">
                Large buttons · Speak slowly · Use gestures when needed
              </p>
            </div>
          )}

          <section aria-label="Phrase cards">
            {filteredEntries.length === 0 ? (
              <EmptyState
                title={
                  selectedCategory === "favorites"
                    ? "No favorite phrases yet"
                    : "No phrases match your search"
                }
                description={
                  selectedCategory === "favorites"
                    ? "Tap Favorite on a phrase card to save it here."
                    : searchQuery.trim()
                      ? "No match in your downloaded pack. Check Missing phrase requests above, or try All."
                      : "Try another category or search term."
                }
              />
            ) : (
              <ul className="space-y-4">
                {filteredEntries.map((entry) => {
                  const phrase = packEntryToLegacyPhrase(entry, targetDialect);
                  return (
                    <li key={entry.id}>
                      <OfflinePhraseCard
                        phrase={phrase}
                        sourceLabel={entry.source_text}
                        languageCode={targetLanguageCode}
                        packKey={displayedPack.pack_key}
                        entryId={entry.id}
                        sourceBadge={entry.source}
                        isFavorite={favoriteEntryIds.includes(entry.id)}
                        isEmergencyMode={selectedCategory === "emergency"}
                        onPlay={() => {
                          void trackOfflinePhraseUsage(displayedPack, entry.id);
                        }}
                        onToggleFavorite={() => {
                          void handleToggleFavorite(entry.id);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <LocalResponseButtons
            languageCode={targetLanguageCode}
            packKey={displayedPack.pack_key}
            packEntries={displayedPack.entries}
            isEmergencyMode={selectedCategory === "emergency"}
          />
        </>
      )}
      </div>
    </>
  );
}
