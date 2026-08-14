import { ReflectionForm } from "@/components/admin/reflection-form";
import { requireFounderSession } from "@/lib/admin/api";
import { fetchAdminTags } from "@/lib/admin/queries";

export default async function NewReflectionPage() {
  await requireFounderSession();
  const tags = await fetchAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          New reflection
        </h1>
        <p className="text-sm text-muted">
          Write a short or long personal reflection. Long-form pieces can
          include charts and tables with required context notes.
        </p>
      </div>
      <ReflectionForm mode="create" tags={tags} />
    </div>
  );
}
