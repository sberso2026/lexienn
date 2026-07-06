import { getDisplayMode } from "@/lib/pwa/isStandaloneApp";

export type ClientErrorPayload = {
  message: string;
  stack?: string;
  route?: string;
};

let lastSentAt = 0;

export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastSentAt < 2000) return;
  lastSentAt = now;

  const body = {
    message: payload.message.slice(0, 500),
    stack: payload.stack?.slice(0, 2000),
    route: payload.route?.slice(0, 200),
    userAgent: navigator.userAgent.slice(0, 300),
    displayMode: getDisplayMode(),
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
  };

  try {
    await fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // never throw from error reporting
  }
}
