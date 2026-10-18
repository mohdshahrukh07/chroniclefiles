import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "chroniclefiles_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const COOKIE_PATH = "/";
const LEGACY_COOKIE_PATH = "/admin-dashboard";

export interface AdminSession {
  userId: string;
  username: string;
  role: "admin";
}

interface SessionPayload extends AdminSession {
  expiresAt: number;
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to a random value of at least 32 bytes.",
    );
  }

  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!isRecord(value)) {
    return false;
  }

  const payload = value;
  return (
    typeof payload.userId === "string" &&
    /^[a-f\d]{24}$/i.test(payload.userId) &&
    typeof payload.username === "string" &&
    payload.role === "admin" &&
    typeof payload.expiresAt === "number" &&
    Number.isInteger(payload.expiresAt) &&
    payload.expiresAt > Math.floor(Date.now() / 1000)
  );
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: COOKIE_PATH,
    maxAge,
  };
}

export async function createAdminSession(
  userId: string,
  username: string,
): Promise<void> {
  const secret = getSessionSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(
    JSON.stringify({ userId, username, role: "admin", expiresAt }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload, secret)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, cookieOptions(SESSION_DURATION_SECONDS));
  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(0),
    path: LEGACY_COOKIE_PATH,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const [payload, signature, extraPart] = token.split(".");
  if (
    !payload ||
    !signature ||
    extraPart !== undefined ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]+$/.test(signature)
  ) {
    return null;
  }

  const expectedSignature = Buffer.from(sign(payload, getSessionSecret()));
  const providedSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return null;
  }

  let decodedPayload: unknown;
  try {
    decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (!isSessionPayload(decodedPayload)) {
    return null;
  }

  return {
    userId: decodedPayload.userId,
    username: decodedPayload.username,
    role: decodedPayload.role,
  };
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", cookieOptions(0));
  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(0),
    path: LEGACY_COOKIE_PATH,
  });
}
