import { SettingsView } from "@/components/settings/SettingsView";
import { PageContainer } from "@/components/layout/PageContainer";

export default function SettingsPage() {
  return (
    <PageContainer hideHeader>
      <SettingsView />
    </PageContainer>
  );
}
