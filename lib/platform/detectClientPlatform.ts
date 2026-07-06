export type ClientPlatform = {
  isIos: boolean;
  isSafari: boolean;
  isChromeIos: boolean;
  isEdgeIos: boolean;
  isStandalonePwa: boolean;
  isSecureContext: boolean;
  userAgent: string;
};

function emptyPlatform(): ClientPlatform {
  return {
    isIos: false,
    isSafari: false,
    isChromeIos: false,
    isEdgeIos: false,
    isStandalonePwa: false,
    isSecureContext: true,
    userAgent: "",
  };
}

/** Client-only platform hints for microphone / voice UI — not used for tracking. */
export function detectClientPlatform(): ClientPlatform {
  if (typeof window === "undefined") return emptyPlatform();

  const userAgent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isCriOS = /CriOS/i.test(userAgent);
  const isEdgiOS = /EdgiOS/i.test(userAgent);
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|EdgiOS|FxiOS|OPiOS/i.test(userAgent);

  const nav = navigator as Navigator & { standalone?: boolean };
  const isStandalonePwa =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    nav.standalone === true;

  return {
    isIos,
    isSafari: isIos ? isSafari && !isCriOS && !isEdgiOS : isSafari,
    isChromeIos: isIos && isCriOS,
    isEdgeIos: isIos && isEdgiOS,
    isStandalonePwa,
    isSecureContext: window.isSecureContext,
    userAgent,
  };
}
