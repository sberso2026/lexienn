import { Suspense } from "react";
import { OfflineView } from "@/components/offline/OfflineView";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";

export default function OfflinePage() {
  return (
    <PageContainer hideHeader>
      <Suspense fallback={<LoadingState title="Loading" label="Loading…" />}>
        <OfflineView />
      </Suspense>
    </PageContainer>
  );
}
