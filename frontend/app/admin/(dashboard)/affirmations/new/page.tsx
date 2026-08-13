import { AffirmationForm } from "@/components/admin/affirmation-form";
import { fetchAdminTags } from "@/lib/admin/queries";

export default async function NewAffirmationPage() {
  const tags = await fetchAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          New affirmation
        </h1>
        <p className="text-sm text-muted">
          Write the affirmation text and choose tags before publishing.
        </p>
      </div>
      <AffirmationForm mode="create" tags={tags} />
    </div>
  );
}
