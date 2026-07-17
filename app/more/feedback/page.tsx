import { PageContainer } from "@/components/layout/PageContainer";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import type { FeedbackCategory } from "@/lib/feedback/feedbackStorage";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const category = (params.category as FeedbackCategory | undefined) ?? "send_feedback";

  return (
    <PageContainer hideHeader>
      <div className="space-y-5">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Help improve Lexienn
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Feedback</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Share issues and suggestions. Feedback is stored on this device for controlled
            review.
          </p>
        </section>
        <FeedbackForm initialCategory={category} />
      </div>
    </PageContainer>
  );
}
