import { PageContainer } from "@/components/layout/PageContainer";
import { MoreSettingsView } from "@/components/settings/MoreSettingsView";

export default function MorePage() {
  return (
    <PageContainer hideHeader>
      <MoreSettingsView />
    </PageContainer>
  );
}
