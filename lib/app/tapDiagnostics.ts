/**
 * Development-only tap diagnostics for investigating interaction blockers.
 * Never loaded or exposed in production builds.
 */

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
};

function summarizeElement(element: Element | null): ElementSummary | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  const style = window.getComputedStyle(element);
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    className: element.className,
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

function listHighZIndexElements(): ElementSummary[] {
  const results: ElementSummary[] = [];
  for (const element of document.querySelectorAll("body *")) {
    if (!(element instanceof HTMLElement)) continue;
    const style = window.getComputedStyle(element);
    const zIndex = Number.parseInt(style.zIndex, 10);
    if (!Number.isFinite(zIndex) || zIndex < 40) continue;
    if (style.pointerEvents === "none") continue;
  if (style.display === "none" || style.visibility === "hidden") continue;
    const position = style.position;
    if (position !== "fixed" && position !== "absolute" && position !== "sticky") continue;
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

export type LexiennTapDebugResult = {
  topElement: ElementSummary | null;
  activeElement: ElementSummary | null;
  overlays: ElementSummary[];
  disabledButtons: ElementSummary[];
  pointerBlockingElements: ElementSummary[];
};

export function debugTapAt(x: number, y: number): LexiennTapDebugResult {
  const topElement = document.elementFromPoint(x, y);
  return {
    topElement: summarizeElement(topElement),
    activeElement: summarizeElement(document.activeElement),
    overlays: listHighZIndexElements(),
    disabledButtons: listDisabledButtons(),
    pointerBlockingElements: listPointerBlockingElements(),
  };
}

export function installTapDiagnostics(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined") return;

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

    const nearest = findNearestInteractive(target);
    console.debug("[lexienn-tap]", {
      route: window.location.pathname,
      target: summarizeElement(target),
      nearestInteractive: nearest,
      elementFromPoint: summarizeElement(document.elementFromPoint(point.clientX, point.clientY)),
    });
  };

  document.addEventListener("click", logTap, true);
  document.addEventListener("touchend", logTap, true);
}
