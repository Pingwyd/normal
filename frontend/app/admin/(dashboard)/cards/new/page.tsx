import { CardForm } from "@/components/admin/card-form";
import { requireAdminSession } from "@/lib/admin/api";
import { fetchAdminCategories, fetchAdminTags } from "@/lib/admin/queries";

export default async function NewCardPage() {
  const session = await requireAdminSession();
  const [categories, tags] = await Promise.all([
    fetchAdminCategories(),
    fetchAdminTags(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">New card</h1>
        <p className="text-sm text-muted">
          Build the card body, sources, and metadata before publishing.
        </p>
      </div>
      <CardForm
        mode="create"
        categories={categories}
        tags={tags}
        role={session.role}
      />
    </div>
  );
}
