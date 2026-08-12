import Link from "next/link";
import { notFound } from "next/navigation";

import { CardForm } from "@/components/admin/card-form";
import { requireAdminSession } from "@/lib/admin/api";
import {
  fetchAdminCard,
  fetchAdminCategories,
  fetchAdminTags,
} from "@/lib/admin/queries";
import { ApiRequestError } from "@/lib/api/errors";

async function loadEditCardData(id: string) {
  try {
    const [card, categories, tags] = await Promise.all([
      fetchAdminCard(id),
      fetchAdminCategories(),
      fetchAdminTags(),
    ]);
    return { card, categories, tags };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  const { id } = await params;
  const { card, categories, tags } = await loadEditCardData(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[#202B26]">Edit card</h1>
          <p className="text-sm text-[#5A6560]">{card.slug}</p>
        </div>
        {card.status === "published" ? (
          <Link
            href={`/cards/${card.slug}`}
            className="text-sm text-[#33473D] underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View public page
          </Link>
        ) : null}
      </div>
      <CardForm
        mode="edit"
        cardId={card.id}
        initialCard={card}
        categories={categories}
        tags={tags}
        role={session.role}
      />
    </div>
  );
}
