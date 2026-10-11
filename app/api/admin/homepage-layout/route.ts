import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import HomepageLayout from "@/models/homepage-layout";
import Post from "@/models/post";
import { getAdminSession } from "@/lib/admin-session";
import { getHomepageManagementData } from "@/lib/homepage";
import {
  HOMEPAGE_SLOTS,
  type HomepageSlot,
} from "@/types/homepage";
import { connectToDatabase } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown failure";
  return message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]");
}

function publishedPostFilter() {
  return {
    status: "published" as const,
    $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return responseError("Your session has expired. Sign in again.", 401);
  }

  try {
    const data = await getHomepageManagementData(
      request.nextUrl.searchParams.get("q") ?? "",
    );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Homepage management data could not be loaded (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return responseError(
      "Homepage settings could not be loaded. Check the database connection and try again.",
      500,
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return responseError("Your session has expired. Sign in again.", 401);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return responseError("Homepage changes must use JSON.", 415);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return responseError("Homepage changes must contain valid JSON.", 400);
  }
  if (!isRecord(payload)) {
    return responseError("Homepage selections are invalid.", 400);
  }

  const changes: Partial<Record<HomepageSlot, string | null>> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      !HOMEPAGE_SLOTS.includes(key as HomepageSlot) ||
      (value !== null &&
        (typeof value !== "string" || !Types.ObjectId.isValid(value)))
    ) {
      return responseError("Homepage selections are invalid.", 400);
    }
    changes[key as HomepageSlot] = value as string | null;
  }
  if (!Object.keys(changes).length) {
    return responseError("Choose at least one homepage slot to update.", 400);
  }

  try {
    await connectToDatabase();
    const existing = await HomepageLayout.findOne({ key: "primary" })
      .select(Object.fromEntries(HOMEPAGE_SLOTS.map((slot) => [slot, 1])))
      .lean()
      .exec();
    const merged = Object.fromEntries(
      HOMEPAGE_SLOTS.map((slot) => [
        slot,
        Object.hasOwn(changes, slot)
          ? changes[slot]
          : existing?.[slot]?.toString() ?? null,
      ]),
    ) as Record<HomepageSlot, string | null>;
    const chosenIds = HOMEPAGE_SLOTS.map((slot) => merged[slot]).filter(
      (id): id is string => Boolean(id),
    );

    if (new Set(chosenIds).size !== chosenIds.length) {
      return responseError(
        "Each homepage slot must use a different published post.",
        400,
      );
    }

    if (chosenIds.length) {
      const eligiblePosts = await Post.find({
        ...publishedPostFilter(),
        _id: { $in: chosenIds.map((id) => new Types.ObjectId(id)) },
      })
        .select({ _id: 1 })
        .lean()
        .exec();
      if (eligiblePosts.length !== chosenIds.length) {
        return responseError(
          "One or more selected posts are no longer published or eligible. Refresh and choose again.",
          400,
        );
      }
    }

    const fieldsToSet = Object.fromEntries(
      Object.entries(changes).map(([slot, id]) => [
        slot,
        id ? new Types.ObjectId(id) : null,
      ]),
    );
    await HomepageLayout.findOneAndUpdate(
      { key: "primary" },
      {
        $set: fieldsToSet,
        $setOnInsert: { key: "primary" },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
    const savedLayout = await HomepageLayout.findOne({ key: "primary" })
      .select(Object.fromEntries(HOMEPAGE_SLOTS.map((slot) => [slot, 1])))
      .lean()
      .exec();
    const savedValues = Object.fromEntries(
      HOMEPAGE_SLOTS.map((slot) => [
        slot,
        savedLayout?.[slot]?.toString() ?? null,
      ]),
    );

    revalidatePath("/", "page");
    revalidatePath("/admin-dashboard/homepage", "page");
    return NextResponse.json(
      { success: true, layout: savedValues },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Homepage settings could not be saved (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return responseError(
      "Homepage settings could not be saved. Please try again.",
      500,
    );
  }
}
