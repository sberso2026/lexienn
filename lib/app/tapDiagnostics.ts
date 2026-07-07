/**
 * Opt-in tap diagnostics for investigating interaction blockers.
 * Enable with localStorage.lexienn_debug_taps = "1" or ?debugTap=1
 * Never logs user text.
 */

type ElementRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ElementSummary = {
  tag: string;
  id: string | null;
  className: string;
  role: string | null;
  disabled: boolean;
  ariaDisabled: string | null;
  pointerEvents: string;
  zIndex: string;
  position: string;
  rect: ElementRect;
};

export type LexiennTapDebugResult = {
  route: string;
  topElement: ElementSummary | null;
  nearestInteractive: ElementSummary | null;
  activeElement: ElementSummary | null;
  overlaysAtPoint: ElementSummary[];
  pointerBlockingElements: ElementSummary[];
  disabledButtons: ElementSummary[];
};

export function isTapDiagnosticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;

  try {
    if (window.localStorage.getItem("lexienn_debug_taps") === "1") {
      return true;
    }
  } catch {
    // ignore storage access errors
  }

  return new URLSearchParams(window.location.search).get("debugTap") === "1";
}

function summarizeElement(element: Element | null): ElementSummary | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    className: typeof element.className === "string" ? element.className : "",
    role: element.getAttribute("role"),
    disabled:
      (element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      element.disabled,
    ariaDisabled: element.getAttribute("aria-disabled"),
    pointerEvents: style.pointerEvents,
    zIndex: style.zIndex,
    position: style.position,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

function findNearestInteractive(target: Element | null): ElementSummary | null {
  let node: Element | null = target;
  while (node) {
    if (
      node instanceof HTMLButtonElement ||
      node instanceof HTMLAnchorElement ||
      node instanceof HTMLInputElement ||
      node instanceof HTMLSelectElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLLabelElement ||
      node.tagName === "FORM"
    ) {
      return summarizeElement(node);
    }
    node = node.parentElement;
  }
  return null;
}

function listElementsAtPoint(x: number, y: number): ElementSummary[] {
  const results: ElementSummary[] = [];
  const seen = new Set<Element>();

  for (const element of document.elementsFromPoint(x, y)) {
    if (!(element instanceof HTMLElement) || seen.has(element)) continue;
    seen.add(element);
    const style = window.getComputedStyle(element);
    if (style.pointerEvents === "none") continue;
    const position = style.position;
    if (
      position !== "fixed" &&
      position !== "absolute" &&
      position !== "sticky" &&
      position !== "relative"
    ) {
      continue;
    }
    const summary = summarizeElement(element);
    if (summary) results.push(summary);
  }

  return results;
}

function listDisabledButtons(): ElementSummary[] {
  const results: ElementSummary[] = [];
  for (const element of document.querySelectorAll("button, input, select, textarea")) {
    if (!(element instanceof HTMLElement)) continue;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (
      (element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      element.disabled
    ) {
      const summary = summarizeElement(element);
      if (summary) results.push(summary);
    }
  }
  return results;
}

function listPointerBlockingElements(): ElementSummary[] {
  const results: ElementSummary[] = [];
  const viewportArea = window.innerWidth * window.innerHeight;

  for (const element of document.querySelectorAll("body *")) {
    if (!(element instanceof HTMLElement)) continue;
    const style = window.getComputedStyle(element);
    if (style.pointerEvents === "none") continue;
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (Number.parseFloat(style.opacity) === 0) continue;
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area < viewportArea * 0.85) continue;
    const summary = summarizeElement(element);
    if (summary) results.push(summary);
  }

  return results;
}

export function debugTapAt(x: number, y: number): LexiennTapDebugResult {
  const topElement = document.elementFromPoint(x, y);
  return {
    route: window.location.pathname,
    topElement: summarizeElement(topElement),
    nearestInteractive: findNearestInteractive(topElement),
    activeElement: summarizeElement(document.activeElement),
    overlaysAtPoint: listElementsAtPoint(x, y),
    pointerBlockingElements: listPointerBlockingElements(),
    disabledButtons: listDisabledButtons(),
  };
}

export function installTapDiagnostics(): void {
  if (typeof window === "undefined") return;
  if (!isTapDiagnosticsEnabled()) return;

  const win = window as Window & {
    __lexiennDebugTap?: (x: number, y: number) => LexiennTapDebugResult;
  };

  win.__lexiennDebugTap = debugTapAt;

  const logTap = (event: MouseEvent | TouchEvent) => {
    const point =
      event instanceof TouchEvent
        ? event.changedTouches[0] ?? event.touches[0]
        : event;
    if (!point) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    console.debug("[lexienn-tap]", debugTapAt(point.clientX, point.clientY));
  };

  document.addEventListener("click", logTap, true);
  document.addEventListener("touchend", logTap, true);
}
