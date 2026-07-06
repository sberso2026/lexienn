"use client";

import { useEffect } from "react";
import { installTapDiagnostics } from "@/lib/app/tapDiagnostics";

export function TapDiagnostics() {
  useEffect(() => {
    installTapDiagnostics();
  }, []);

  return null;
}
