import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_LAUNCH_PREFERENCES,
  loadLaunchPreferences,
  saveLaunchPreferences,
  hasSeenLaunchThisSession,
  markLaunchSeenThisSession,
  clearLaunchSessionSeen,
  prefersReducedMotion,
} from "@/lib/launch/launchPreferences";
import {
  hasSeenLaunchEver,
  markLaunchShownEver,
  shouldShowLaunchScreen,
} from "@/lib/launch/shouldShowLaunchScreen";
import { isStandaloneApp } from "@/lib/pwa/isStandaloneApp";
import { playLaunchSound } from "@/lib/audio/launchSounds";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function installBrowserGlobals(overrides: {
  standalone?: boolean;
  matchMedia?: (query: string) => MediaQueryList;
} = {}) {
  const local = createStorage();
  const session = createStorage();
  vi.stubGlobal("localStorage", local);
  vi.stubGlobal("sessionStorage", session);
  const matchMedia =
    overrides.matchMedia ??
    ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  vi.stubGlobal("window", {
    localStorage: local,
    sessionStorage: session,
    navigator: { standalone: overrides.standalone ?? false },
    matchMedia,
  });
}

describe("launch screen preferences", () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists launch animation and sound preferences", () => {
    saveLaunchPreferences({ animationEnabled: false, soundEnabled: false });
    expect(loadLaunchPreferences()).toEqual({
      animationEnabled: false,
      soundEnabled: false,
    });
  });

  it("defaults launch preferences when storage is empty", () => {
    expect(loadLaunchPreferences()).toEqual(DEFAULT_LAUNCH_PREFERENCES);
  });

  it("tracks session launch seen state", () => {
    expect(hasSeenLaunchThisSession()).toBe(false);
    markLaunchSeenThisSession();
    expect(hasSeenLaunchThisSession()).toBe(true);
    clearLaunchSessionSeen();
    expect(hasSeenLaunchThisSession()).toBe(false);
  });

  it("respects reduced motion media query", () => {
    vi.stubGlobal("window", {
      localStorage,
      sessionStorage,
      matchMedia: (query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("shouldShowLaunchScreen", () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not show when animation disabled", () => {
    saveLaunchPreferences({ animationEnabled: false });
    expect(shouldShowLaunchScreen()).toBe(false);
  });

  it("does not show when already seen this session", () => {
    markLaunchSeenThisSession();
    expect(shouldShowLaunchScreen()).toBe(false);
  });
});

describe("isStandaloneApp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects iOS standalone", () => {
    installBrowserGlobals({ standalone: true });
    expect(isStandaloneApp()).toBe(true);
  });

  it("detects display-mode standalone", () => {
    installBrowserGlobals({
      standalone: false,
      matchMedia: (query: string) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    expect(isStandaloneApp()).toBe(true);
  });
});

describe("launchSounds", () => {
  it("does not throw when audio playback fails", async () => {
    const play = vi.fn().mockRejectedValue(new Error("blocked"));
    vi.stubGlobal(
      "Audio",
      class {
        volume = 1;
        currentTime = 0;
        preload = "";
        load() {}
        play = play;
      },
    );

    await expect(playLaunchSound("blueSwoosh")).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});

describe("launch ever flag", () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks first launch as seen", () => {
    expect(hasSeenLaunchEver()).toBe(false);
    markLaunchShownEver();
    expect(hasSeenLaunchEver()).toBe(true);
  });
});
