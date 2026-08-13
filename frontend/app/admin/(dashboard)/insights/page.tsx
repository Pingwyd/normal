import { AdminInsightsDashboard } from "@/components/admin/admin-insights-dashboard";
import { fetchAdminAnalytics } from "@/lib/admin/queries";

const ALLOWED_DAYS = [7, 14, 30, 90] as const;

function parseDaysParam(value: string | undefined): number {
  const parsed = Number(value);
  if (ALLOWED_DAYS.includes(parsed as (typeof ALLOWED_DAYS)[number])) {
    return parsed;
  }
  return 30;
}

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = parseDaysParam(params.days);
  const analytics = await fetchAdminAnalytics({ days });

  return <AdminInsightsDashboard analytics={analytics} selectedDays={days} />;
}
