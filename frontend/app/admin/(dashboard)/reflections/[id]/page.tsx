import { notFound } from "next/navigation";

import { ReflectionForm } from "@/components/admin/reflection-form";
import { requireFounderSession } from "@/lib/admin/api";
import { fetchAdminReflection, fetchAdminTags } from "@/lib/admin/queries";
import { ApiRequestError } from "@/lib/api/errors";

async function loadEditReflectionData(id: string) {
  try {
    const [reflection, tags] = await Promise.all([
      fetchAdminReflection(id),
      fetchAdminTags(),
    ]);
    return { reflection, tags };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

type EditReflectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditReflectionPage({
  params,
}: EditReflectionPageProps) {
  await requireFounderSession();
  const { id } = await params;
  const { reflection, tags } = await loadEditReflectionData(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Edit reflection
        </h1>
        <p className="text-sm text-muted">
          Update title, format, tags, blocks, or publication status.
        </p>
      </div>
      <ReflectionForm
        mode="edit"
        reflectionId={id}
        initialReflection={reflection}
        tags={tags}
      />
    </div>
  );
}
