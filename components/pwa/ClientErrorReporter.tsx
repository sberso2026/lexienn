"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/pwa/reportClientError";

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError({
        message: event.message || "window.error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        route: window.location.pathname,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "unhandledrejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      void reportClientError({
        message,
        stack,
        route: window.location.pathname,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
