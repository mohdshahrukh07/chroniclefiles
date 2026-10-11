import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/admin-analytics/analytics-dashboard";
import {
  getAnalyticsDashboardData,
  type AnalyticsDashboardFilters,
  type AnalyticsInterval,
} from "@/lib/analytics-dashboard";
import { getAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Analytics | ChronicleFiles",
  robots: { index: false, follow: false },
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    interval?: string;
  }>;
}

function isDateKey(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value,
  );
}

function getDefaultRange(): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function parseFilters(
  params: Awaited<AnalyticsPageProps["searchParams"]>,
): AnalyticsDashboardFilters {
  const defaults = getDefaultRange();
  const today = new Date().toISOString().slice(0, 10);
  let from = isDateKey(params.from) ? params.from : defaults.from;
  let to = isDateKey(params.to) ? params.to : defaults.to;
  const duration = Date.parse(`${to}T00:00:00.000Z`) -
    Date.parse(`${from}T00:00:00.000Z`);
  if (to > today || from > to || duration > 365 * 86_400_000) {
    from = defaults.from;
    to = defaults.to;
  }

  const interval: AnalyticsInterval =
    params.interval === "week" || params.interval === "month"
      ? params.interval
      : "day";
  return { from, to, interval };
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin-dashboard");

  const filters = parseFilters(await searchParams);
  let data;
  let loadError: string | undefined;
  try {
    data = await getAnalyticsDashboardData(filters);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Analytics dashboard could not be loaded (${errorName}).`);
    loadError =
      "Analytics could not be loaded. Check the database connection and try again.";
    data = {
      totalViews: 0,
      uniqueVisitors: 0,
      totalEngagementSeconds: 0,
      totalClicks: 0,
      averageReadSeconds: 0,
      engagementRate: 0,
      trend: [],
      categories: [],
      devices: [],
      countries: [],
      posts: [],
      clickEvents: [],
      hasData: false,
    };
  }

  return (
    <AnalyticsDashboard
      key={`${filters.from}:${filters.to}:${filters.interval}`}
      username={session.username}
      filters={filters}
      data={data}
      loadError={loadError}
    />
  );
}
