import { notFound } from "next/navigation";

import { AffirmationForm } from "@/components/admin/affirmation-form";
import { fetchAdminAffirmation, fetchAdminTags } from "@/lib/admin/queries";
import { ApiRequestError } from "@/lib/api/errors";

async function loadEditAffirmationData(id: string) {
  try {
    const [affirmation, tags] = await Promise.all([
      fetchAdminAffirmation(id),
      fetchAdminTags(),
    ]);
    return { affirmation, tags };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

type EditAffirmationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAffirmationPage({
  params,
}: EditAffirmationPageProps) {
  const { id } = await params;
  const { affirmation, tags } = await loadEditAffirmationData(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Edit affirmation
        </h1>
        <p className="text-sm text-muted">
          Update text, tags, or publication status.
        </p>
      </div>
      <AffirmationForm
        mode="edit"
        affirmationId={id}
        initialAffirmation={affirmation}
        tags={tags}
      />
    </div>
  );
}
