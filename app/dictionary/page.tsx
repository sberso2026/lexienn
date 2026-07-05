import { DictionaryPageContent } from "@/components/dictionary/DictionaryPageContent";
import { PageContainer } from "@/components/layout/PageContainer";

export default function DictionaryPage() {
  return (
    <PageContainer hideHeader>
      <DictionaryPageContent />
    </PageContainer>
  );
}
