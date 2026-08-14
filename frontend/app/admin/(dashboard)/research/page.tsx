import { CardResearchPanel } from "@/components/admin/card-research-panel";
import { requireFounderSession } from "@/lib/admin/api";
import { fetchAdminTags } from "@/lib/admin/queries";
import { fetchResearchProvidersAction } from "@/lib/admin/research-actions";

export default async function AdminResearchPage() {
  await requireFounderSession();
  const [providers, tags] = await Promise.all([
    fetchResearchProvidersAction(),
    fetchAdminTags(),
  ]);

  if (!Array.isArray(providers)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl text-foreground">AI research</h1>
        <p className="text-sm text-warning-text" role="alert">
          {providers.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">AI research</h1>
        <p className="text-sm text-muted">
          Run provider-backed research from the admin dashboard. Results always
          land as draft cards for source-by-source review.
        </p>
      </div>
      <CardResearchPanel
        initialProviders={providers}
        existingTagNames={tags.map((tag) => tag.name)}
      />
    </div>
  );
}
