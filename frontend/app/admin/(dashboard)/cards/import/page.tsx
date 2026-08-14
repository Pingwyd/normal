import { CardDraftImportForm } from "@/components/admin/card-draft-import-form";
import { requireAdminSession } from "@/lib/admin/api";
import { fetchAdminTags } from "@/lib/admin/queries";

export default async function ImportCardDraftPage() {
  await requireAdminSession();
  const tags = await fetchAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Import card draft
        </h1>
        <p className="text-sm text-muted">
          Load a Cursor-generated research draft into the card editor for review.
        </p>
      </div>
      <CardDraftImportForm existingTagNames={tags.map((tag) => tag.name)} />
      <p className="text-xs text-muted">
        Draft JSON schema: docs/10-ai-research-pipelines.md section 1.1
      </p>
    </div>
  );
}
