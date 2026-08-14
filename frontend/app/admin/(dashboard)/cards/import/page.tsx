import { CardDraftImportForm } from "@/components/admin/card-draft-import-form";
import { requireAdminSession } from "@/lib/admin/api";

export default async function ImportCardDraftPage() {
  await requireAdminSession();

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
      <CardDraftImportForm />
      <p className="text-xs text-muted">
        Draft JSON schema: docs/10-ai-research-pipelines.md section 1.1
      </p>
    </div>
  );
}
