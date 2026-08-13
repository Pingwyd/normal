import Link from "next/link";
import { Bookmark, Heart, Inbox, Mail, Smartphone } from "lucide-react";

import type { AdminAnalytics } from "@/lib/admin/queries";

type AdminInsightsDashboardProps = {
  analytics: AdminAnalytics;
  selectedDays: number;
};

const WINDOW_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Bookmark;
}) {
  return (
    <div className="rounded-xl border border-[#D8D5CC] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#5A6560]">{label}</p>
          <p className="mt-1 font-display text-3xl text-[#202B26]">{value}</p>
          <p className="mt-1 text-xs text-[#5A6560]">{detail}</p>
        </div>
        <span className="rounded-full bg-[#EEF2EC] p-2 text-[#4B6B5E]">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function RankedCardList({
  title,
  emptyMessage,
  items,
  countKey,
  countLabel,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    card_id: string;
    question: string;
    slug: string;
    save_count?: number;
    like_count?: number;
  }>;
  countKey: "save_count" | "like_count";
  countLabel: string;
}) {
  return (
    <section className="rounded-xl border border-[#D8D5CC] bg-white p-5">
      <h2 className="font-display text-xl text-[#202B26]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#CFCBC2] px-4 py-8 text-center text-sm text-[#5A6560]">
          {emptyMessage}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => {
            const count = item[countKey] ?? 0;
            return (
              <li key={item.card_id}>
                <Link
                  href={`/admin/cards/${item.card_id}`}
                  className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-[#F7F6F2]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5A6560]">
                      #{index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#202B26]">
                      {item.question}
                    </p>
                    <p className="mt-1 text-xs text-[#5A6560]">{item.slug}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[#4B6B5E]">
                    {count} {countLabel}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function AdminInsightsDashboard({
  analytics,
  selectedDays,
}: AdminInsightsDashboardProps) {
  const { submission_volume, newsletter_subscribers, push_subscribers } =
    analytics;
  const maxBucketCount = submission_volume.buckets.reduce(
    (max, bucket) => Math.max(max, bucket.count),
    0,
  );
  const topSavedTotal = analytics.top_saved_cards.reduce(
    (sum, card) => sum + card.save_count,
    0,
  );
  const topLikedTotal = analytics.top_liked_cards.reduce(
    (sum, card) => sum + card.like_count,
    0,
  );
  const hasEngagementData =
    analytics.top_saved_cards.length > 0 ||
    analytics.top_liked_cards.length > 0 ||
    submission_volume.total_in_window > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[#202B26]">Insights</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5A6560]">
          Engagement signals from saves, likes, and submissions. These metrics
          reflect content resonance, not raw traffic.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Analytics time window"
      >
        {WINDOW_OPTIONS.map((option) => {
          const href =
            option.value === 30
              ? "/admin/insights"
              : `/admin/insights?days=${option.value}`;
          const isActive = selectedDays === option.value;
          return (
            <Link
              key={option.value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                isActive
                  ? "bg-[#33473D] text-white"
                  : "border border-[#CFCBC2] bg-white text-[#33473D]"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {!hasEngagementData &&
      newsletter_subscribers.total === 0 &&
      push_subscribers.total === 0 ? (
        <p className="rounded-xl border border-dashed border-[#CFCBC2] bg-white px-6 py-10 text-center text-sm text-[#5A6560]">
          No engagement data yet. Saves, likes, and submissions will appear here
          once users start interacting with cards.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Submissions"
          value={submission_volume.total_in_window}
          detail={`Last ${submission_volume.window_days} days`}
          icon={Inbox}
        />
        <SummaryCard
          label="Top-card saves"
          value={topSavedTotal}
          detail="Sum of listed top saved cards"
          icon={Bookmark}
        />
        <SummaryCard
          label="Top-card likes"
          value={topLikedTotal}
          detail="Sum of listed top liked cards"
          icon={Heart}
        />
        <SummaryCard
          label="Active subscribers"
          value={newsletter_subscribers.active + push_subscribers.active}
          detail={`${newsletter_subscribers.active} email, ${push_subscribers.active} push`}
          icon={Mail}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankedCardList
          title="Top saved cards"
          emptyMessage="No saved cards yet."
          items={analytics.top_saved_cards}
          countKey="save_count"
          countLabel="saves"
        />
        <RankedCardList
          title="Top liked cards"
          emptyMessage="No liked cards yet."
          items={analytics.top_liked_cards}
          countKey="like_count"
          countLabel="likes"
        />
      </div>

      <section className="rounded-xl border border-[#D8D5CC] bg-white p-5">
        <h2 className="font-display text-xl text-[#202B26]">
          Submission volume
        </h2>
        <p className="mt-1 text-sm text-[#5A6560]">
          Daily submissions over the last {submission_volume.window_days} days.
        </p>
        {submission_volume.buckets.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-[#CFCBC2] px-4 py-8 text-center text-sm text-[#5A6560]">
            No submissions in this window.
          </p>
        ) : (
          <ul className="mt-5 space-y-3" aria-label="Daily submission counts">
            {submission_volume.buckets.map((bucket) => {
              const widthPercent =
                maxBucketCount > 0
                  ? Math.max(4, (bucket.count / maxBucketCount) * 100)
                  : 0;
              return (
                <li
                  key={bucket.date}
                  className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3"
                >
                  <span className="text-xs text-[#5A6560]">
                    {formatShortDate(bucket.date)}
                  </span>
                  <div className="h-2 rounded-full bg-[#ECEAE4]">
                    <div
                      className="h-2 rounded-full bg-[#4B6B5E]"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-medium text-[#202B26]">
                    {bucket.count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#D8D5CC] bg-white p-5">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#4B6B5E]" aria-hidden="true" />
            <h2 className="font-display text-lg text-[#202B26]">
              Newsletter subscribers
            </h2>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5A6560]">
                Active
              </dt>
              <dd className="mt-1 text-2xl font-medium text-[#202B26]">
                {newsletter_subscribers.active}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5A6560]">
                Total
              </dt>
              <dd className="mt-1 text-2xl font-medium text-[#202B26]">
                {newsletter_subscribers.total}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-[#D8D5CC] bg-white p-5">
          <div className="flex items-center gap-2">
            <Smartphone
              size={18}
              className="text-[#4B6B5E]"
              aria-hidden="true"
            />
            <h2 className="font-display text-lg text-[#202B26]">
              Push subscribers
            </h2>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5A6560]">
                Active
              </dt>
              <dd className="mt-1 text-2xl font-medium text-[#202B26]">
                {push_subscribers.active}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#5A6560]">
                Total
              </dt>
              <dd className="mt-1 text-2xl font-medium text-[#202B26]">
                {push_subscribers.total}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
