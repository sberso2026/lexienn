import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  clearAllRequestCaches,
  getCachedResult,
  RequestAbortError,
  runCachedRequest,
  setCachedResult,
} from "@/lib/request/requestCache";

describe("requestCache", () => {
  beforeEach(() => {
    clearAllRequestCaches();
  });

  it("returns cached result without calling fetcher", async () => {
    const fetcher = vi.fn().mockResolvedValue({ text: "hello" });
    setCachedResult("key-a", { text: "cached" }, 60_000);

    const result = await runCachedRequest({
      key: "key-a",
      ttlMs: 60_000,
      fetcher,
    });

    expect(result.fromCache).toBe(true);
    expect(result.data).toEqual({ text: "cached" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("deduplicates in-flight requests with the same key", async () => {
    const fetcher = vi.fn(
      () =>
        new Promise<{ text: string }>((resolve) => {
          setTimeout(() => resolve({ text: "once" }), 20);
        }),
    );

    const [first, second] = await Promise.all([
      runCachedRequest({ key: "dup", ttlMs: 60_000, fetcher }),
      runCachedRequest({ key: "dup", ttlMs: 60_000, fetcher }),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual({ text: "once" });
    expect(second.data).toEqual({ text: "once" });
  });

  it("throws RequestAbortError when signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runCachedRequest({
        key: "abort",
        ttlMs: 60_000,
        signal: controller.signal,
        fetcher: async () => ({ ok: true }),
      }),
    ).rejects.toBeInstanceOf(RequestAbortError);
  });

  it("does not cache when shouldCache returns false", async () => {
    await runCachedRequest({
      key: "no-cache",
      ttlMs: 60_000,
      shouldCache: () => false,
      fetcher: async () => ({ ok: true }),
    });

    expect(getCachedResult("no-cache")).toBeNull();
  });
});
