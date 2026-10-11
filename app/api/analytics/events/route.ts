import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_COOKIE_MAX_AGE, ANALYTICS_COOKIE_NAME, classifyDevice, createVisitorToken, hashVisitorToken, readCountry, recordEngagement, recordPageView, resolveAnalyticsPath } from "@/lib/analytics-events";
import { allowAnalyticsEvent } from "@/lib/analytics-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLICK_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/i;
const ALLOWED_CLICK_NAMES = new Set([
  "blog-navigation",
  "post-card",
  "category-link",
  "article-category",
  "article-link",
]);
const VISITOR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,60}$/;
const MAX_BODY_BYTES = 12_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, message }, { status });
}

function validPublicPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 160 &&
    (value === "/" ||
      value === "/blog" ||
      /^\/category\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
      /^\/post\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
  );
}

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readBoundedBody(request: NextRequest): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function getVisitorToken(request: NextRequest): {
  token: string;
  shouldSetCookie: boolean;
} {
  const current = request.cookies.get(ANALYTICS_COOKIE_NAME)?.value;
  if (current && VISITOR_TOKEN_PATTERN.test(current)) {
    return { token: current, shouldSetCookie: false };
  }
  return { token: createVisitorToken(), shouldSetCookie: true };
}

function attachVisitorCookie(
  response: NextResponse,
  token: string,
  shouldSetCookie: boolean,
): NextResponse {
  if (shouldSetCookie) {
    response.cookies.set(ANALYTICS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ANALYTICS_COOKIE_MAX_AGE,
    });
  }
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1"
  ) {
    return new NextResponse(null, { status: 204 });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError("Analytics events must use JSON.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Analytics event is too large.", 413);
  }

  let payload: unknown;
  try {
    const body = await readBoundedBody(request);
    if (body === null) {
      return jsonError("Analytics event is too large.", 413);
    }
    payload = JSON.parse(body);
  } catch {
    return jsonError("Analytics event must be valid JSON.", 400);
  }

  if (
    !isRecord(payload) ||
    !EVENT_ID_PATTERN.test(String(payload.eventId ?? "")) ||
    !validPublicPath(payload.path)
  ) {
    return jsonError("Analytics event details are invalid.", 400);
  }

  const token = getVisitorToken(request);
  const visitorHash = hashVisitorToken(token.token);
  if (!allowAnalyticsEvent(visitorHash)) {
    return attachVisitorCookie(
      jsonError("Analytics event rate limit exceeded.", 429),
      token.token,
      token.shouldSetCookie,
    );
  }

  let analyticsPath;
  try {
    analyticsPath = await resolveAnalyticsPath(payload.path);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Analytics path resolution failed (${errorName}).`);
    return attachVisitorCookie(
      jsonError("Analytics is temporarily unavailable.", 503),
      token.token,
      token.shouldSetCookie,
    );
  }
  if (!analyticsPath) {
    return attachVisitorCookie(
      jsonError("This public page is not available for tracking.", 404),
      token.token,
      token.shouldSetCookie,
    );
  }

  const dayKey = utcDayKey();
  const userAgent = request.headers.get("user-agent") ?? "";
  const device = classifyDevice(userAgent);
  const country = readCountry(request.headers);

  try {
    if (payload.type === "pageview") {
      const result = await recordPageView({
        ...analyticsPath,
        eventId: payload.eventId as string,
        dayKey,
        device,
        country,
        visitorHash,
      });
      return attachVisitorCookie(
        NextResponse.json({ success: true, duplicate: result.duplicate }),
        token.token,
        token.shouldSetCookie,
      );
    }

    if (
      payload.type !== "engagement" ||
      typeof payload.pageViewId !== "string" ||
      !EVENT_ID_PATTERN.test(payload.pageViewId) ||
      !Number.isSafeInteger(payload.activeSeconds) ||
      (payload.activeSeconds as number) < 0 ||
      (payload.activeSeconds as number) > 60 ||
      !Number.isSafeInteger(payload.sessionSeconds) ||
      (payload.sessionSeconds as number) < 0 ||
      (payload.sessionSeconds as number) > 3600 ||
      (payload.activeSeconds as number) > (payload.sessionSeconds as number) ||
      !Array.isArray(payload.clickNames) ||
      payload.clickNames.length > 25 ||
      !payload.clickNames.every(
        (name) =>
          typeof name === "string" &&
          CLICK_NAME_PATTERN.test(name) &&
          ALLOWED_CLICK_NAMES.has(name),
      ) ||
      typeof payload.isFinal !== "boolean"
    ) {
      return attachVisitorCookie(
        jsonError("Engagement event details are invalid.", 400),
        token.token,
        token.shouldSetCookie,
      );
    }

    const result = await recordEngagement({
      ...analyticsPath,
      eventId: payload.eventId as string,
      pageViewId: payload.pageViewId,
      dayKey,
      activeSeconds: payload.activeSeconds as number,
      sessionSeconds: payload.sessionSeconds as number,
      clickNames: payload.clickNames,
      isFinal: payload.isFinal,
    });
    return attachVisitorCookie(
      NextResponse.json({ success: true, duplicate: result.duplicate }),
      token.token,
      token.shouldSetCookie,
    );
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Analytics event could not be recorded (${errorName}).`);
    return attachVisitorCookie(
      jsonError(
        error instanceof Error &&
          error.message === "The matching page view was not found."
          ? "The engagement session has expired."
          : "Analytics is temporarily unavailable.",
        error instanceof Error &&
          error.message === "The matching page view was not found."
          ? 409
          : 503,
      ),
      token.token,
      token.shouldSetCookie,
    );
  }
}
