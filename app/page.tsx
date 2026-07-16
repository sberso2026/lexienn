import { HomeDashboard } from "@/components/home/HomeDashboard";
import { PageContainer } from "@/components/layout/PageContainer";

export default function HomePage() {
  return (
    <PageContainer hideHeader>
      <HomeDashboard />
    </PageContainer>
  );
}
