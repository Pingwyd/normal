import { AffirmationForm } from "@/components/admin/affirmation-form";
import { fetchAdminTags } from "@/lib/admin/queries";

export default async function NewAffirmationPage() {
  const tags = await fetchAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#202B26]">
          New affirmation
        </h1>
        <p className="text-sm text-[#5A6560]">
          Write the affirmation text and choose tags before publishing.
        </p>
      </div>
      <AffirmationForm mode="create" tags={tags} />
    </div>
  );
}
