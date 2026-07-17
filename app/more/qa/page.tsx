import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductionDiagnosticsPanel } from "@/components/settings/ProductionDiagnosticsPanel";
import { QaChecklistView } from "@/components/qa/QaChecklistView";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

export default function QaPage() {
  if (!isDeveloperModeFeatureEnabled()) {
    redirect("/more");
  }

  return (
    <PageContainer hideHeader>
      <div className="space-y-6">
        <QaChecklistView />
        <ProductionDiagnosticsPanel />
      </div>
    </PageContainer>
  );
}
