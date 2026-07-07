"use client";

import { useEffect } from "react";
import { installTapDiagnostics, isTapDiagnosticsEnabled } from "@/lib/app/tapDiagnostics";

export function TapDiagnostics() {
  useEffect(() => {
    if (!isTapDiagnosticsEnabled()) return;
    installTapDiagnostics();
  }, []);

  return null;
}
