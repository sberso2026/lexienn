import { LibraryView } from "@/components/library/LibraryView";
import { PageContainer } from "@/components/layout/PageContainer";

export default function LibraryPage() {
  return (
    <PageContainer hideHeader>
      <LibraryView />
    </PageContainer>
  );
}
