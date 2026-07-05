import { Suspense } from "react";
import { DictionaryResultView } from "@/components/dictionary/DictionaryResultView";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";

export default function DictionaryResultPage() {
  return (
    <PageContainer hideHeader>
      <Suspense
        fallback={
          <LoadingState title="Loading result" label="Loading dictionary result…" />
        }
      >
        <DictionaryResultView />
      </Suspense>
    </PageContainer>
  );
}
