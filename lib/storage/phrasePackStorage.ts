import { getActiveOfflinePack as getActiveStoredPack } from "@/lib/offline/offlinePackService";
import {
  listOfflinePacks,
  removeOfflinePack,
  saveOfflinePack,
} from "@/lib/offline/localOfflineStore";
import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import type { OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import { ACTIVE_OFFLINE_PACK_STORAGE_KEY, DOWNLOADED_PACKS_STORAGE_KEY } from "./constants";
import { getPhrasePackById, mockPhrasePacks } from "@/lib/mock/phrase-packs";
import type { OfflinePhrasePack } from "@/lib/schemas";

function parseDownloadedPackIds(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function loadDownloadedPackIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseDownloadedPackIds(
    localStorage.getItem(DOWNLOADED_PACKS_STORAGE_KEY),
  );
}

function persistDownloadedPackIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOWNLOADED_PACKS_STORAGE_KEY, JSON.stringify(ids));
}

export function isPackDownloaded(packId: string): boolean {
  return loadDownloadedPackIds().includes(packId);
}

/** Legacy bundled-pack download marker (Phrase Packs page). */
export function markPackDownloaded(packId: string): boolean {
  if (!getPhrasePackById(packId)) return false;

  const ids = loadDownloadedPackIds();
  if (ids.includes(packId)) return true;

  persistDownloadedPackIds([packId, ...ids]);
  return true;
}

export function removeDownloadedPack(packId: string): boolean {
  const ids = loadDownloadedPackIds();
  const next = ids.filter((id) => id !== packId);

  if (next.length === ids.length) return false;

  persistDownloadedPackIds(next);
  return true;
}

export async function getDownloadedLanguagePairPacks(): Promise<OfflineStoredPack[]> {
  return listOfflinePacks();
}

/** Legacy helper for bundled mock packs still shown on Phrase Packs page. */
export function getDownloadedPhrasePacks(): OfflinePhrasePack[] {
  const ids = loadDownloadedPackIds();
  return ids
    .map((id) => getPhrasePackById(id))
    .filter((pack): pack is OfflinePhrasePack => Boolean(pack));
}

export function getAvailablePhrasePacks(): OfflinePhrasePack[] {
  return mockPhrasePacks;
}

export function getActiveOfflinePackId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_OFFLINE_PACK_STORAGE_KEY);
}

export function setActiveOfflinePackId(packId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_OFFLINE_PACK_STORAGE_KEY, packId);
}

export function getActiveOfflinePack(): OfflinePhrasePack | null {
  const downloaded = getDownloadedPhrasePacks();
  if (downloaded.length === 0) return null;

  const storedId = getActiveOfflinePackId();
  const active = storedId
    ? downloaded.find((pack) => pack.id === storedId)
    : undefined;

  return active ?? downloaded[0] ?? null;
}

export async function getActiveLanguagePairPack(): Promise<OfflineStoredPack | null> {
  return getActiveStoredPack();
}

export function buildLegacyPairKey(fromLanguage: string, toLanguage: string): string {
  return buildOfflinePackKey(fromLanguage, toLanguage);
}

export async function persistLanguagePairPack(pack: OfflineStoredPack): Promise<void> {
  await saveOfflinePack(pack);
}

export async function deleteLanguagePairPack(packKey: string): Promise<void> {
  await removeOfflinePack(packKey);
}
