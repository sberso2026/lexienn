import { redirect } from "next/navigation";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

/** Alias route for Developer Mode QA checklist. */
export default function QaAliasPage() {
  if (!isDeveloperModeFeatureEnabled()) {
    redirect("/more");
  }
  redirect("/more/qa");
}
