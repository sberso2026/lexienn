"use client";

import { useEffect } from "react";

const MAIN_CONTENT_ID = "main-content";
const RESULT_ACTIONS_CLASS = "mobile-app-content--with-result-actions";

export function useResultPageChrome(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const main = document.getElementById(MAIN_CONTENT_ID);
    main?.classList.add(RESULT_ACTIONS_CLASS);

    return () => {
      main?.classList.remove(RESULT_ACTIONS_CLASS);
    };
  }, [enabled]);
}
