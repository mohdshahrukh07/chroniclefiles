import "server-only";

import { Types } from "mongoose";
import AnalyticsDaily from "@/models/analytics-daily";
import AnalyticsVisitor from "@/models/analytics-visitor";
import Category from "@/models/category";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";

export type AnalyticsInterval = "day" | "week" | "month";

export interface AnalyticsDashboardFilters {
  from: string;
  to: string;
  interval: AnalyticsInterval;
}

export interface AnalyticsTrendPoint {
  label: string;
  views: number;
}

export interface AnalyticsPostPerformance {
  id: string;
  title: string;
  slug: string;
  views: number;
  clicks: number;
  averageReadSeconds: number;
  engagementRate: number;
  trend: number[];
}

export interface AnalyticsDashboardData {
  totalViews: number;
  uniqueVisitors: number;
  totalEngagementSeconds: number;
  totalClicks: number;
  averageReadSeconds: number;
  engagementRate: number;
  trend: AnalyticsTrendPoint[];
  categories: { name: string; views: number }[];
  devices: { name: string; views: number }[];
  countries: { name: string; visitors: number }[];
  posts: AnalyticsPostPerformance[];
  clickEvents: { name: string; count: number }[];
  hasData: boolean;
}

interface OverviewAggregate {
  pageViews: number;
  clicks: number;
  engagedSeconds: number;
  completedReadTimeSeconds: number;
  completedReadSessions: number;
  engagedSessions: number;
  devices: Record<string, number>[];
  clickEvents: Record<string, number>[];
}

interface TrendAggregate {
  _id: string;
  views: number;
}

interface CategoryAggregate {
  _id: Types.ObjectId;
  views: number;
}

interface PostAggregate {
  _id: Types.ObjectId;
  views: number;
  clicks: number;
  completedReadTimeSeconds: number;
  completedReadSessions: number;
  engagedSessions: number;
  trend: number[];
}

interface PostDailyAggregate {
  _id: { postId: Types.ObjectId; dayKey: string };
  views: number;
}

interface VisitorAggregate {
  _id: string;
  visitors: number;
}

interface VisitorSummaryAggregate {
  total: { count: number }[];
  countries: VisitorAggregate[];
}

interface RawDashboardFacets {
  overview: OverviewAggregate[];
  trend: TrendAggregate[];
  categories: CategoryAggregate[];
  posts: PostAggregate[];
  postTrend: PostDailyAggregate[];
}

const EMPTY_OVERVIEW: OverviewAggregate = {
  pageViews: 0,
  clicks: 0,
  engagedSeconds: 0,
  completedReadTimeSeconds: 0,
  completedReadSessions: 0,
  engagedSessions: 0,
  devices: [],
  clickEvents: [],
};

function sumRecords(records: Record<string, number>[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        totals[key] = (totals[key] ?? 0) + value;
      }
    }
  }
  return totals;
}

function makeTrendLabel(dayKey: string, interval: AnalyticsInterval): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  if (interval === "month") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (interval === "week") {
    const monday = new Date(date);
    const daysFromMonday = (date.getUTCDay() + 6) % 7;
    monday.setUTCDate(date.getUTCDate() - daysFromMonday);
    return monday.toISOString().slice(0, 10);
  }
  return dayKey;
}

function makeTrendPoints(
  rows: TrendAggregate[],
  from: string,
  to: string,
  interval: AnalyticsInterval,
): AnalyticsTrendPoint[] {
  const viewsByLabel = new Map<string, number>();
  for (const row of rows) {
    const label = makeTrendLabel(row._id, interval);
    viewsByLabel.set(label, (viewsByLabel.get(label) ?? 0) + row.views);
  }

  const result: AnalyticsTrendPoint[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    const dayKey = cursor.toISOString().slice(0, 10);
    const label = makeTrendLabel(dayKey, interval);
    if (!result.some((point) => point.label === label)) {
      result.push({ label, views: viewsByLabel.get(label) ?? 0 });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function getTrendWindow(to: string, from: string): { from: string; days: number } {
  const end = new Date(`${to}T00:00:00.000Z`);
  const earliest = new Date(end);
  earliest.setUTCDate(earliest.getUTCDate() - 13);
  const requestedStart = new Date(`${from}T00:00:00.000Z`);
  const start = requestedStart > earliest ? requestedStart : earliest;
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { from: start.toISOString().slice(0, 10), days };
}

export async function getAnalyticsDashboardData(
  filters: AnalyticsDashboardFilters,
): Promise<AnalyticsDashboardData> {
  await connectToDatabase();
  const dateMatch = {
    dayKey: { $gte: filters.from, $lte: filters.to },
  };
  const trendWindow = getTrendWindow(filters.to, filters.from);

  const [facets, visitorSummary] = await Promise.all([
    AnalyticsDaily.aggregate<RawDashboardFacets>([
      { $match: dateMatch },
      {
        $facet: {
          overview: [
            { $match: { scope: "site", path: "*" } },
            {
              $group: {
                _id: null,
                pageViews: { $sum: "$pageViews" },
                clicks: { $sum: "$clicks" },
                engagedSeconds: { $sum: "$engagedSeconds" },
                completedReadTimeSeconds: {
                  $sum: "$completedReadTimeSeconds",
                },
                completedReadSessions: { $sum: "$completedReadSessions" },
                engagedSessions: { $sum: "$engagedSessions" },
                devices: { $push: "$devices" },
                clickEvents: { $push: "$clickEvents" },
              },
            },
          ],
          trend: [
            { $match: { scope: "site", path: "*" } },
            { $group: { _id: "$dayKey", views: { $sum: "$pageViews" } } },
            { $sort: { _id: 1 } },
          ],
          categories: [
            {
              $match: {
                scope: "page",
                categoryId: { $type: "objectId" },
              },
            },
            {
              $group: {
                _id: "$categoryId",
                views: { $sum: "$pageViews" },
              },
            },
            { $sort: { views: -1, _id: 1 } },
          ],
          posts: [
            { $match: { scope: "page", postId: { $type: "objectId" } } },
            {
              $group: {
                _id: "$postId",
                views: { $sum: "$pageViews" },
                clicks: { $sum: "$clicks" },
                completedReadTimeSeconds: {
                  $sum: "$completedReadTimeSeconds",
                },
                completedReadSessions: { $sum: "$completedReadSessions" },
                engagedSessions: { $sum: "$engagedSessions" },
              },
            },
            { $sort: { views: -1, _id: 1 } },
          ],
          postTrend: [
            {
              $match: {
                scope: "page",
                postId: { $type: "objectId" },
                dayKey: { $gte: trendWindow.from, $lte: filters.to },
              },
            },
            {
              $group: {
                _id: { postId: "$postId", dayKey: "$dayKey" },
                views: { $sum: "$pageViews" },
              },
            },
            { $sort: { "_id.dayKey": 1 } },
          ],
        },
      },
    ]).exec(),
    AnalyticsVisitor.aggregate<VisitorSummaryAggregate>([
      { $match: { dayKey: { $gte: filters.from, $lte: filters.to } } },
      {
        $set: {
          countryPriority: {
            $cond: [{ $ifNull: ["$country", false] }, 0, 1],
          },
        },
      },
      { $sort: { visitorHash: 1, countryPriority: 1, createdAt: 1 } },
      {
        $group: {
          _id: "$visitorHash",
          country: { $first: { $ifNull: ["$country", "unknown"] } },
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          countries: [
            { $group: { _id: "$country", visitors: { $sum: 1 } } },
            { $sort: { visitors: -1, _id: 1 } },
            { $limit: 12 },
          ],
        },
      },
    ]).exec(),
  ]);

  const raw = facets[0] ?? {
    overview: [],
    trend: [],
    categories: [],
    posts: [],
    postTrend: [],
  };
  const overview = raw.overview[0] ?? EMPTY_OVERVIEW;
  const uniqueVisitors = visitorSummary[0]?.total[0]?.count ?? 0;

  const categoryIds = raw.categories.map((row) => row._id);
  const categoryDocuments = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } })
        .select({ name: 1 })
        .lean()
        .exec()
    : [];
  const categoryNameById = new Map(
    categoryDocuments.map((category) => [
      category._id.toString(),
      category.name,
    ]),
  );

  const postIds = raw.posts.map((row) => row._id);
  const postDocuments = postIds.length
    ? await Post.find({ _id: { $in: postIds } })
        .select({ title: 1, slug: 1 })
        .lean()
        .exec()
    : [];
  const postById = new Map(
    postDocuments.map((post) => [
      post._id.toString(),
      { title: post.title, slug: post.slug },
    ]),
  );
  const postTrendById = new Map<string, Map<string, number>>();
  for (const row of raw.postTrend) {
    const id = row._id.postId.toString();
    const trend = postTrendById.get(id) ?? new Map<string, number>();
    trend.set(row._id.dayKey, row.views);
    postTrendById.set(id, trend);
  }
  const postTrendDays: string[] = [];
  const trendDay = new Date(`${trendWindow.from}T00:00:00.000Z`);
  for (let index = 0; index < trendWindow.days; index += 1) {
    postTrendDays.push(trendDay.toISOString().slice(0, 10));
    trendDay.setUTCDate(trendDay.getUTCDate() + 1);
  }

  const devices = sumRecords(overview.devices);
  const clickEvents = sumRecords(overview.clickEvents);
  const countries = (visitorSummary[0]?.countries ?? []).map((row) => ({
    name: row._id === "unknown" ? "Unavailable" : row._id,
    visitors: row.visitors,
  }));
  const deviceRows = [
    { name: "Desktop", views: devices.desktop ?? 0 },
    { name: "Mobile", views: devices.mobile ?? 0 },
    { name: "Tablet", views: devices.tablet ?? 0 },
    { name: "Unavailable", views: devices.unknown ?? 0 },
  ];
  const averageReadSeconds =
    overview.completedReadSessions > 0
      ? overview.completedReadTimeSeconds / overview.completedReadSessions
      : 0;
  const engagementRate =
    overview.pageViews > 0
      ? overview.engagedSessions / overview.pageViews
      : 0;

  return {
    totalViews: overview.pageViews,
    uniqueVisitors,
    totalEngagementSeconds: overview.engagedSeconds,
    totalClicks: overview.clicks,
    averageReadSeconds,
    engagementRate,
    trend: makeTrendPoints(raw.trend, filters.from, filters.to, filters.interval),
    categories: raw.categories.map((row) => ({
      name: categoryNameById.get(row._id.toString()) ?? "Uncategorized",
      views: row.views,
    })),
    devices: deviceRows,
    countries,
    posts: raw.posts.map((row) => {
      const id = row._id.toString();
      const post = postById.get(id);
      const title = post?.title ?? "Deleted post";
      const slug = post?.slug ?? "";
      return {
        id,
        title,
        slug,
        views: row.views,
        clicks: row.clicks,
        averageReadSeconds:
          row.completedReadSessions > 0
            ? row.completedReadTimeSeconds / row.completedReadSessions
            : 0,
        engagementRate: row.views > 0 ? row.engagedSessions / row.views : 0,
        trend: postTrendDays.map(
          (dayKey) => postTrendById.get(id)?.get(dayKey) ?? 0,
        ),
      };
    }),
    clickEvents: Object.entries(clickEvents)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    hasData: overview.pageViews > 0,
  };
}
