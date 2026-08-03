import { Suspense } from "react";
import { ConversationView } from "@/components/conversation/ConversationView";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ConversationPage() {
  return (
    <PageContainer hideHeader>
      <Suspense fallback={<LoadingState title="Conversation" label="Loading…" />}>
        <ConversationView />
      </Suspense>
    </PageContainer>
  );
}
