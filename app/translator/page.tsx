import { Suspense } from "react";
import { TranslatorView } from "@/components/translator/TranslatorView";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";

export default function TranslatorPage() {
  return (
    <PageContainer hideHeader>
      <Suspense fallback={<LoadingState title="Translate" label="Loading…" />}>
        <TranslatorView />
      </Suspense>
    </PageContainer>
  );
}
