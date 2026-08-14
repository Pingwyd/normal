import { TagsPanel } from "@/components/admin/tags-panel";
import { requireFounderSession } from "@/lib/admin/api";
import { fetchAdminTags } from "@/lib/admin/queries";

export default async function AdminTagsPage() {
  await requireFounderSession();
  const tags = await fetchAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Tags</h1>
        <p className="text-sm text-muted">
          Tags group cards, affirmations, and reflections. Draft imports can
          suggest new tags; you confirm before they are created.
        </p>
      </div>
      <TagsPanel initialTags={tags} />
    </div>
  );
}
