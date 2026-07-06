import { logPerf } from "@/lib/request/perfLog";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export class RequestAbortError extends Error {
  constructor(message = "Request cancelled") {
    super(message);
    this.name = "RequestAbortError";
  }
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export function getCachedResult<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedResult<T>(key: string, data: T, ttlMs: number): void {
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCachedResult(key: string): void {
  memoryCache.delete(key);
}

export function clearAllRequestCaches(): void {
  memoryCache.clear();
}

export async function runCachedRequest<T>({
  key,
  ttlMs,
  signal,
  fetcher,
  shouldCache,
}: {
  key: string;
  ttlMs: number;
  signal?: AbortSignal;
  fetcher: (signal?: AbortSignal) => Promise<T>;
  shouldCache?: (result: T) => boolean;
}): Promise<{ data: T; fromCache: boolean }> {
  if (signal?.aborted) {
    throw new RequestAbortError();
  }

  const cached = getCachedResult<T>(key);
  if (cached) {
    logPerf("cache_hit", { key: key.slice(0, 80) });
    return { data: cached, fromCache: true };
  }

  const pending = inFlight.get(key);
  if (pending) {
    logPerf("in_flight_reuse", { key: key.slice(0, 80) });
    const data = (await pending) as T;
    if (signal?.aborted) {
      throw new RequestAbortError();
    }
    return { data, fromCache: false };
  }

  const startedAt = Date.now();
  const promise = (async () => {
    const data = await fetcher(signal);
    if (!shouldCache || shouldCache(data)) {
      setCachedResult(key, data, ttlMs);
    }
    return data;
  })();

  inFlight.set(key, promise);

  try {
    const data = (await promise) as T;
    logPerf("request_complete", {
      key: key.slice(0, 80),
      durationMs: Date.now() - startedAt,
    });
    if (signal?.aborted) {
      throw new RequestAbortError();
    }
    return { data, fromCache: false };
  } catch (error) {
    if (signal?.aborted) {
      throw new RequestAbortError();
    }
    throw error;
  } finally {
    inFlight.delete(key);
  }
}

export function abortInflightRequest(key: string): void {
  inFlight.delete(key);
}
