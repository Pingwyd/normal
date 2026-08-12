import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SuggestQuestionForm } from "@/components/submissions/suggest-question-form";

export const metadata = {
  title: "Suggest a question | Is it normal?",
  description:
    "Suggest a new everyday worry for our review queue. Submissions are private and never auto-published.",
};

export default function SuggestPage() {
  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          <section className="mx-auto max-w-2xl space-y-3 text-center">
            <h1 className="font-display text-3xl text-[#202B26] sm:text-4xl">
              Suggest a question
            </h1>
            <p className="text-sm leading-relaxed text-[#5A6560] sm:text-base">
              Share a worry you would like us to cover. Every suggestion goes
              into a private review queue. We read them all, but only approved
              questions become published cards.
            </p>
          </section>

          <SuggestQuestionForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
