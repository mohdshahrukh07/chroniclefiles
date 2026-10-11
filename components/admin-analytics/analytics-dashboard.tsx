"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChartNoAxesCombined,
  Clock3,
  MousePointerClick,
  Timer,
  UsersRound,
  Eye,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";
import { MobileAdminNavigation } from "@/components/admin-dashboard/mobile-admin-navigation";
import {
  DashboardSection,
  KpiCard,
} from "@/components/admin-dashboard/dashboard-components";
import type {
  AnalyticsDashboardData,
  AnalyticsDashboardFilters,
  AnalyticsPostPerformance,
} from "@/lib/analytics-dashboard";

interface AnalyticsDashboardProps {
  username: string;
  filters: AnalyticsDashboardFilters;
  data: AnalyticsDashboardData;
  loadError?: string;
}

type PostSort = "views" | "clicks" | "averageReadSeconds" | "engagementRate" | "trend";

function formatCount(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0 sec";
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function metricCards(data: AnalyticsDashboardData) {
  return [
    {
      title: "Page views",
      value: formatCount(data.totalViews),
      caption: "Tracked public-page visits",
      icon: Eye,
    },
    {
      title: "Unique visitors",
      value: formatCount(data.uniqueVisitors),
      caption: "Anonymous visitors in this date range",
      icon: UsersRound,
    },
    {
      title: "Engagement time",
      value: formatDuration(data.totalEngagementSeconds),
      caption: "Visible and recently active time",
      icon: Clock3,
    },
    {
      title: "Tracked clicks",
      value: formatCount(data.totalClicks),
      caption: "Clicks on marked public actions",
      icon: MousePointerClick,
    },
    {
      title: "Average read time",
      value: formatDuration(data.averageReadSeconds),
      caption: "Completed active reading sessions",
      icon: Timer,
    },
  ];
}

function TrafficChart({
  points,
}: {
  points: AnalyticsDashboardData["trend"];
}) {
  const maxViews = Math.max(1, ...points.map((point) => point.views));
  const coordinates = points
    .map((point, index) => {
      const x = points.length < 2 ? 400 : (index / (points.length - 1)) * 760 + 20;
      const y = 180 - (point.views / maxViews) * 150;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="px-4 pb-4 sm:px-6">
      {points.length === 0 || points.every((point) => point.views === 0) ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No page-view data for this period yet.
        </p>
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <svg
              viewBox="0 0 800 220"
              role="img"
              aria-label="Page views over the selected date range"
              className="h-52 w-full"
              preserveAspectRatio="none"
            >
              {[30, 80, 130, 180].map((y) => (
                <line
                  key={y}
                  x1="20"
                  x2="780"
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 5"
                />
              ))}
              <polyline
                fill="none"
                stroke="#02a95c"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={coordinates}
              />
              {points.length === 1 && (
                <circle
                  cx="400"
                  cy={180 - (points[0].views / maxViews) * 150}
                  r="6"
                  fill="#02a95c"
                />
              )}
            </svg>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>{points[0]?.label}</span>
            {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.label}</span>}
            <span>{points.at(-1)?.label}</span>
          </div>
        </>
      )}
    </div>
  );
}

function Breakdown({
  items,
  total,
  valueLabel,
  emptyMessage,
}: {
  items: { name: string; views?: number; visitors?: number }[];
  total: number;
  valueLabel: "views" | "visitors";
  emptyMessage: string;
}) {
  const maximum = Math.max(
    1,
    ...items.map((item) => item[valueLabel] ?? 0),
  );
  if (items.length === 0 || total === 0) {
    return <p className="px-5 py-8 text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-4 p-5">
      {items.map((item) => {
        const value = item[valueLabel] ?? 0;
        return (
          <li key={item.name}>
            <div className="mb-1.5 flex justify-between gap-3 text-sm">
              <span className="truncate text-slate-700">{item.name}</span>
              <span className="shrink-0 font-medium text-slate-600">
                {formatCount(value)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-[#02a95c]"
                style={{ width: `${Math.max(value ? 2 : 0, (value / maximum) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return <span className="text-xs text-slate-400">Not enough data</span>;
  }
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 88 + 1;
      const y = 25 - (value / max) * 21;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 90 28"
      role="img"
      aria-label="Post page views over the recent 14 days"
      className="h-8 w-24"
    >
      <polyline
        fill="none"
        stroke="#02a95c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function postSortValue(post: AnalyticsPostPerformance, sort: PostSort): number {
  if (sort === "trend") {
    const recent = post.trend.slice(-7).reduce((total, value) => total + value, 0);
    const previous = post.trend.slice(-14, -7).reduce((total, value) => total + value, 0);
    return recent - previous;
  }
  return post[sort];
}

export function AnalyticsDashboard({
  username,
  filters,
  data,
  loadError,
}: AnalyticsDashboardProps) {
  const [fromDate, setFromDate] = useState(filters.from);
  const [toDate, setToDate] = useState(filters.to);
  const [interval, setInterval] = useState(filters.interval);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PostSort>("views");

  const posts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...data.posts]
      .filter((post) =>
        normalizedSearch
          ? `${post.title} ${post.slug}`.toLowerCase().includes(normalizedSearch)
          : true,
      )
      .sort((left, right) => {
        const difference = postSortValue(right, sort) - postSortValue(left, sort);
        return difference || left.title.localeCompare(right.title);
      });
  }, [data.posts, search, sort]);

  const cards = metricCards(data);

  return (
    <div className="min-h-screen bg-slate-50 text-[#444444]">
      <AdminSidebar username={username} activeHref="/admin-dashboard/analytics" />
      <main className="min-w-0 overflow-x-clip lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileAdminNavigation
                username={username}
                activeHref="/admin-dashboard/analytics"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Analytics</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Real tracked traffic and reading engagement.
                </p>
              </div>
              <Link
                href="/admin-dashboard/posts"
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
              >
                Manage posts
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          <section
            aria-label="Analytics date filters"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <form
              action="/admin-dashboard/analytics"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto_auto]"
            >
              <label className="text-xs font-semibold text-slate-600">
                From
                <input
                  type="date"
                  name="from"
                  required
                  value={fromDate}
                  max={toDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                To
                <input
                  type="date"
                  name="to"
                  required
                  value={toDate}
                  min={fromDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Trend grouping
                <select
                  name="interval"
                  value={interval}
                  onChange={(event) =>
                    setInterval(
                      event.target.value as AnalyticsDashboardFilters["interval"],
                    )
                  }
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </label>
              <button
                type="submit"
                className="min-h-11 self-end rounded-lg bg-[#02a95c] px-4 text-sm font-semibold text-white hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2"
              >
                Apply range
              </button>
              <Link
                href="/admin-dashboard/analytics"
                className="inline-flex min-h-11 items-center justify-center self-end rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
              >
                Last 30 days
              </Link>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Date ranges are UTC and limited to 366 days. Visitor totals are
              deduplicated anonymous first-party IDs for this selected range.
            </p>
          </section>

          {loadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
            </p>
          )}

          {!loadError && !data.hasData && (
            <p
              role="status"
              className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"
            >
              No analytics have been recorded for this period. Data begins when
              public-page tracking is enabled; no historical values are estimated.
            </p>
          )}

          <section
            aria-label="Analytics overview"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {cards.map((card) => <KpiCard key={card.title} {...card} />)}
          </section>

          <DashboardSection
            title="Traffic over time"
            description="Public page views grouped by the selected interval."
            action={
              <ChartNoAxesCombined
                aria-hidden="true"
                className="size-5 text-[#02a95c]"
              />
            }
            contentClassName="pt-3"
          >
            <TrafficChart points={data.trend} />
          </DashboardSection>

          <div className="grid gap-5 xl:grid-cols-2">
            <DashboardSection
              title="Category performance"
              description="Page views attributed to article/category routes."
            >
              <Breakdown
                items={data.categories}
                total={data.totalViews}
                valueLabel="views"
                emptyMessage="Category performance is unavailable until a tracked page view has category data."
              />
            </DashboardSection>
            <DashboardSection
              title="Device analytics"
              description="Tracked page views grouped by request device class."
            >
              <Breakdown
                items={data.devices}
                total={data.totalViews}
                valueLabel="views"
                emptyMessage="Device analytics are not available yet."
              />
            </DashboardSection>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <DashboardSection
              title="Country visitors"
              description="Anonymous visitors grouped by trusted proxy country data."
            >
              <Breakdown
                items={data.countries}
                total={data.uniqueVisitors}
                valueLabel="visitors"
                emptyMessage="Country information is unavailable or no visitors were tracked."
              />
            </DashboardSection>
            <DashboardSection
              title="Meaningful click events"
              description="Clicks are counted only on public UI elements explicitly marked for analytics."
            >
              <Breakdown
                items={data.clickEvents.map((event) => ({
                  name: event.name.replaceAll("-", " "),
                  visitors: event.count,
                }))}
                total={data.totalClicks}
                valueLabel="visitors"
                emptyMessage="No marked click events have been recorded."
              />
            </DashboardSection>
          </div>

          <DashboardSection
            title="Post performance"
            description="Sorted post metrics and recent daily view trends."
            contentClassName="p-4 sm:p-5"
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_14rem]">
              <label>
                <span className="sr-only">Search posts</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by post title or slug"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="sr-only">Sort posts</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as PostSort)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                >
                  <option value="views">Most views</option>
                  <option value="clicks">Most clicks</option>
                  <option value="averageReadSeconds">Average read time</option>
                  <option value="engagementRate">Engagement rate</option>
                  <option value="trend">Recent trend</option>
                </select>
              </label>
            </div>

            {posts.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {data.posts.length
                  ? "No posts match that search."
                  : "No post performance data is available for this date range."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <caption className="sr-only">Post analytics performance</caption>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Post</th>
                      <th scope="col" className="px-4 py-3">Views</th>
                      <th scope="col" className="px-4 py-3">Clicks</th>
                      <th scope="col" className="px-4 py-3">Avg read</th>
                      <th scope="col" className="px-4 py-3">Engagement</th>
                      <th scope="col" className="px-4 py-3">Trend · 14 days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <th scope="row" className="max-w-[22rem] px-4 py-4 text-left">
                          {post.slug ? (
                            <Link
                              href={`/post/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-slate-800 hover:text-[#02a95c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
                            >
                              <span className="block truncate">{post.title}</span>
                              <span className="mt-1 block truncate text-xs font-normal text-slate-500">
                                /post/{post.slug}
                              </span>
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-700">{post.title}</span>
                          )}
                        </th>
                        <td className="whitespace-nowrap px-4 py-4">{formatCount(post.views)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{formatCount(post.clicks)}</td>
                        <td className="whitespace-nowrap px-4 py-4">{formatDuration(post.averageReadSeconds)}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {(post.engagementRate * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-4"><Sparkline values={post.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSection>

          <p className="text-xs leading-5 text-slate-500">
            Engagement time counts visible intervals with recent user activity
            and may undercount passive reading. Engagement rate is the share of
            page views followed by at least 10 active seconds or a marked click.
            Counts start only after tracking was deployed. Location is omitted
            when the hosting proxy does not supply a valid country code.
          </p>
        </div>
      </main>
    </div>
  );
}
