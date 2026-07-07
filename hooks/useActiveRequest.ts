"use client";

import { useCallback, useEffect, useRef } from "react";
import { RequestAbortError } from "@/lib/request/requestCache";
import { logPerf } from "@/lib/request/perfLog";

export function useActiveRequest() {
  const controllerRef = useRef<AbortController | null>(null);
  const requestKeyRef = useRef<string | null>(null);

  const abortActiveRequest = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestKeyRef.current = null;
    logPerf("request_aborted");
  }, []);

  const beginRequest = useCallback((key: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestKeyRef.current = key;
    return controller.signal;
  }, []);

  const isActiveRequest = useCallback((key: string) => requestKeyRef.current === key, []);

  const finishRequest = useCallback((key: string) => {
    if (requestKeyRef.current !== key) return;
    const controller = controllerRef.current;
    if (controller) {
      controllerRef.current = null;
    }
    requestKeyRef.current = null;
  }, []);

  const isAbortError = useCallback(
    (error: unknown) =>
      error instanceof RequestAbortError ||
      (error instanceof DOMException && error.name === "AbortError"),
    [],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    abortActiveRequest,
    beginRequest,
    finishRequest,
    isActiveRequest,
    isAbortError,
  };
}
