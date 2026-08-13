import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SaveButton } from "@/components/favorites/save-button";
import { LikeButton } from "@/components/likes/like-button";
import { BlockRenderer } from "@/components/content-blocks/block-renderer";
import { ReportIssueModal } from "@/components/submissions/report-issue-modal";
import type { CardDetail } from "@/lib/api/types";

import { RelatedCards } from "./related-cards";
import { SourcesList } from "./sources-list";

type CardDetailViewProps = {
  card: CardDetail;
};

export function CardDetailView({ card }: CardDetailViewProps) {
  const reviewedLabel =
    card.last_reviewed_at !== null ? "Reviewed" : "Not yet reviewed";

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-sage-dark hover:text-sage"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to browse
        </Link>
      </div>

      <header className="space-y-4 border-b border-border pb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-sage">
          {card.category.name}
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
          {card.question}
        </h1>
        <p className="text-lg leading-relaxed text-ink-secondary">{card.brief}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-secondary">
          <span className="font-mono text-[10.5px] uppercase tracking-wide">
            {card.source_count} source{card.source_count === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-wide text-sage">
            {reviewedLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <SaveButton
              contentType="card"
              contentId={card.id}
              label={card.question}
              cardSlug={card.slug}
              cardQuestion={card.question}
            />
            <span>{card.save_count} total saves</span>
          </span>
          <LikeButton
            cardId={card.id}
            initialLikeCount={card.like_count}
            label={card.question}
          />
        </div>
      </header>

      <BlockRenderer blocks={card.content_blocks} />
      <SourcesList sources={card.sources} />
      <RelatedCards relatedCards={card.related_cards} />

      <section className="border-t border-border-subtle pt-6">
        <ReportIssueModal cardId={card.id} cardQuestion={card.question} />
      </section>
    </article>
  );
}
