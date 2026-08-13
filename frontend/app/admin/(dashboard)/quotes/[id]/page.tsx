import { notFound } from "next/navigation";

import { QuoteForm } from "@/components/admin/quote-form";
import { fetchAdminQuote } from "@/lib/admin/queries";
import { ApiRequestError } from "@/lib/api/errors";

async function loadEditQuoteData(id: string) {
  try {
    return await fetchAdminQuote(id);
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const quote = await loadEditQuoteData(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#202B26]">Edit quote</h1>
        <p className="text-sm text-[#5A6560]">
          Update text, attribution, source URL, or publication status.
        </p>
      </div>
      <QuoteForm mode="edit" quoteId={id} initialQuote={quote} />
    </div>
  );
}
