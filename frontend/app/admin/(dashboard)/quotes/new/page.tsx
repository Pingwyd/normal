import { QuoteForm } from "@/components/admin/quote-form";

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">New quote</h1>
        <p className="text-sm text-muted">
          Add quote text, attribution, and a source URL before publishing.
        </p>
      </div>
      <QuoteForm mode="create" />
    </div>
  );
}
