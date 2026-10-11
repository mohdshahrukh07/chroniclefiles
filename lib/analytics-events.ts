import "server-only";

import { createHash, randomBytes } from "node:crypto";
import mongoose, { Types, type ClientSession } from "mongoose";
import AnalyticsDaily from "@/models/analytics-daily";
import AnalyticsVisitor from "@/models/analytics-visitor";
import EngagementEvent from "@/models/engagement-event";
import PageView, { type AnalyticsDevice } from "@/models/page-view";
import Category from "@/models/category";
import Post from "@/models/post";

export const ANALYTICS_COOKIE_NAME = "chroniclefiles_analytics_visitor";
export const ANALYTICS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface AnalyticsPath {
  path: string;
  postId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
}

export interface PageViewInput extends AnalyticsPath {
  eventId: string;
  device: AnalyticsDevice;
  country?: string;
  visitorHash: string;
  dayKey: string;
}

export interface EngagementInput extends AnalyticsPath {
  eventId: string;
  pageViewId: string;
  dayKey: string;
  activeSeconds: number;
  sessionSeconds: number;
  clickNames: string[];
  isFinal: boolean;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function resolveAnalyticsPath(
  path: string,
): Promise<AnalyticsPath | null> {
  if (path === "/" || path === "/blog") return { path };

  const categoryMatch = /^\/category\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  if (categoryMatch) {
    const category = await Category.findOne({ slug: categoryMatch[1] })
      .select({ _id: 1 })
      .lean()
      .exec();
    return category
      ? { path, categoryId: category._id as Types.ObjectId }
      : null;
  }

  const postMatch = /^\/post\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  if (postMatch) {
    const post = await Post.findOne({
      slug: postMatch[1],
      status: "published",
      $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
    })
      .select({ _id: 1, category: 1 })
      .lean()
      .exec();
    return post
      ? {
          path,
          postId: post._id as Types.ObjectId,
          ...(post.category
            ? { categoryId: post.category as Types.ObjectId }
            : {}),
        }
      : null;
  }

  return null;
}

function dailyFilter(
  dayKey: string,
  scope: "site" | "page",
  path: string,
) {
  return { dayKey, scope, path };
}

async function incrementDaily(
  dayKey: string,
  scope: "site" | "page",
  path: string,
  analyticsPath: AnalyticsPath,
  increments: Record<string, number>,
  session: ClientSession,
): Promise<void> {
  const setOnInsert: Record<string, unknown> = {
    dayKey,
    scope,
    path,
  };
  if (scope === "page") {
    if (analyticsPath.postId) setOnInsert.postId = analyticsPath.postId;
    if (analyticsPath.categoryId) {
      setOnInsert.categoryId = analyticsPath.categoryId;
    }
  }
  await AnalyticsDaily.updateOne(
    dailyFilter(dayKey, scope, path),
    { $setOnInsert: setOnInsert, $inc: increments },
    { upsert: true, session, setDefaultsOnInsert: false },
  ).exec();
}

export async function recordPageView(
  input: PageViewInput,
): Promise<{ duplicate: boolean }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await PageView.create(
          [
            {
              eventId: input.eventId,
              dayKey: input.dayKey,
              path: input.path,
              postId: input.postId,
              categoryId: input.categoryId,
              engaged: false,
            },
          ],
          { session },
        );

        let isUniqueVisitor = false;
        const priorVisitor = await AnalyticsVisitor.exists({
          dayKey: input.dayKey,
          visitorHash: input.visitorHash,
        }).session(session);
        if (!priorVisitor) {
          await AnalyticsVisitor.create(
            [
              {
                dayKey: input.dayKey,
                visitorHash: input.visitorHash,
                country: input.country,
              },
            ],
            { session },
          );
          isUniqueVisitor = true;
        } else if (input.country) {
          await AnalyticsVisitor.updateOne(
            {
              dayKey: input.dayKey,
              visitorHash: input.visitorHash,
              country: { $exists: false },
            },
            { $set: { country: input.country } },
            { session },
          ).exec();
        }

        const deviceIncrements = { [`devices.${input.device}`]: 1 };

        await incrementDaily(
          input.dayKey,
          "site",
          "*",
          input,
          {
            pageViews: 1,
            ...(isUniqueVisitor ? { uniqueVisitors: 1 } : {}),
            ...deviceIncrements,
          },
          session,
        );
        await incrementDaily(
          input.dayKey,
          "page",
          input.path,
          input,
          {
            pageViews: 1,
            ...deviceIncrements,
          },
          session,
        );
      });
      return { duplicate: false };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const duplicateEvent = await PageView.exists({
          eventId: input.eventId,
        }).exec();
        if (duplicateEvent) return { duplicate: true };
        if (attempt === 0) continue;
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
  return { duplicate: false };
}

export async function recordEngagement(
  input: EngagementInput,
): Promise<{ duplicate: boolean }> {
  if (
    input.activeSeconds === 0 &&
    input.clickNames.length === 0 &&
    !input.isFinal
  ) {
    return { duplicate: false };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const pageView = await PageView.findOne({
          eventId: input.pageViewId,
          path: input.path,
          postId: input.postId,
        })
          .session(session)
          .exec();
        if (!pageView) {
          throw new Error("The matching page view was not found.");
        }

        await EngagementEvent.create(
          [
            {
              eventId: input.eventId,
              pageViewId: input.pageViewId,
              dayKey: input.dayKey,
              path: input.path,
              postId: input.postId,
              categoryId: input.categoryId,
              activeSeconds: input.activeSeconds,
              sessionSeconds: input.sessionSeconds,
              clickNames: input.clickNames,
              isFinal: input.isFinal,
            },
          ],
          { session },
        );

        const clicks = input.clickNames.length;
        const increments: Record<string, number> = {
          clicks,
          engagedSeconds: input.activeSeconds,
        };
        for (const clickName of input.clickNames) {
          const field = `clickEvents.${clickName}`;
          increments[field] = (increments[field] ?? 0) + 1;
        }

        if (input.isFinal && input.sessionSeconds >= 1) {
          increments.completedReadSessions = 1;
          increments.completedReadTimeSeconds = input.sessionSeconds;
        }
        if (input.sessionSeconds >= 10 || clicks > 0) {
          const updatedPageView = await PageView.findOneAndUpdate(
            { eventId: input.pageViewId, engaged: false },
            { $set: { engaged: true } },
            { session, new: false },
          ).exec();
          if (updatedPageView) increments.engagedSessions = 1;
        }

        await incrementDaily(
          input.dayKey,
          "site",
          "*",
          input,
          increments,
          session,
        );
        await incrementDaily(
          input.dayKey,
          "page",
          input.path,
          input,
          increments,
          session,
        );
      });
      return { duplicate: false };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const duplicateEvent = await EngagementEvent.exists({
          eventId: input.eventId,
        }).exec();
        if (duplicateEvent) return { duplicate: true };
        if (attempt === 0) continue;
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
  return { duplicate: false };
}

export function createVisitorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function classifyDevice(userAgent: string): AnalyticsDevice {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) {
    return "mobile";
  }
  if (/windows|macintosh|linux|x11|cros/i.test(userAgent)) return "desktop";
  return "unknown";
}

export function readCountry(headers: Headers): string | undefined {
  const country =
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return undefined;
  const normalized = country.toUpperCase();
  return normalized === "XX" || normalized === "ZZ" ? undefined : normalized;
}
