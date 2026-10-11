"use client";

import { useEffect, useRef } from "react";

interface PublicAnalyticsTrackerProps {
  path: string;
}

interface EngagementPayload {
  type: "engagement";
  eventId: string;
  pageViewId: string;
  path: string;
  activeSeconds: number;
  sessionSeconds: number;
  clickNames: string[];
  isFinal: boolean;
}

function isPrivacyOptOutEnabled(): boolean {
  const navigatorWithPrivacy = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  return (
    navigator.doNotTrack === "1" ||
    navigatorWithPrivacy.globalPrivacyControl === true
  );
}

function createEventId(): string {
  return crypto.randomUUID();
}

async function sendPageView(
  path: string,
  eventId: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/analytics/events", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "pageview", eventId, path }),
      });
      if (response.ok) return true;
    } catch {
      if (attempt === 1) return false;
    }
    if (attempt === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
  }
  return false;
}

export function PublicAnalyticsTracker({
  path,
}: PublicAnalyticsTrackerProps) {
  const pageViewRef = useRef<{ path: string; eventId: string } | null>(null);
  useEffect(() => {
    if (isPrivacyOptOutEnabled()) return;

    if (!pageViewRef.current || pageViewRef.current.path !== path) {
      pageViewRef.current = { path, eventId: createEventId() };
    }
    const pageViewId = pageViewRef.current.eventId;
    if (!pageViewId) return;
    let isPageViewRecorded = false;
    let sessionEnded = false;
    let pendingPageViewFinal = false;
    let activeSecondsSinceFlush = 0;
    let activeSecondsThisSession = 0;
    const clicksSinceFlush: string[] = [];
    let lastActivityAt = Date.now();
    let previousTickAt = Date.now();
    let flushInProgress = false;
    let pendingFinalFlush = false;
    let retryPayload: EngagementPayload | null = null;
    let retryActiveSeconds = 0;
    let retryClickCount = 0;

    const markActivity = () => {
      lastActivityAt = Date.now();
    };

    const trackClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const analyticsTarget = target.closest<HTMLElement>(
        "[data-analytics-event]",
      );
      const eventName = analyticsTarget?.dataset.analyticsEvent;
      if (!eventName || clicksSinceFlush.length >= 25) return;
      if (!/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(eventName)) return;
      clicksSinceFlush.push(eventName);
      markActivity();
    };

    const flush = (isFinal: boolean, keepalive = false) => {
      if (!isPageViewRecorded) return;
      if (flushInProgress) {
        pendingFinalFlush ||= isFinal;
        return;
      }
      const activeSeconds = retryPayload
        ? retryActiveSeconds
        : Math.floor(activeSecondsSinceFlush);
      const sessionSeconds = Math.min(
        Math.floor(activeSecondsThisSession),
        3600,
      );
      const clickNames = retryPayload
        ? retryPayload.clickNames
        : clicksSinceFlush.slice(0, 25);
      if (!activeSeconds && !clickNames.length && !isFinal) return;
      if (!activeSeconds && !clickNames.length && !sessionSeconds) return;

      if (isFinal) sessionEnded = true;
      if (retryPayload && isFinal) {
        retryPayload.isFinal = true;
        retryPayload.sessionSeconds = sessionSeconds;
      }
      const payload =
        retryPayload ??
        ({
          type: "engagement",
          eventId: createEventId(),
          pageViewId,
          path,
          activeSeconds,
          sessionSeconds,
          clickNames,
          isFinal,
        } satisfies EngagementPayload);
      if (!retryPayload) {
        retryPayload = payload;
        retryActiveSeconds = activeSeconds;
        retryClickCount = clickNames.length;
      }
      flushInProgress = true;
      void fetch("/api/analytics/events", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        keepalive,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) return;
          activeSecondsSinceFlush = Math.max(
            0,
            activeSecondsSinceFlush - activeSeconds,
          );
          clicksSinceFlush.splice(0, retryClickCount);
          retryPayload = null;
          retryActiveSeconds = 0;
          retryClickCount = 0;
        })
        .catch(() => undefined)
        .finally(() => {
          flushInProgress = false;
          if (pendingFinalFlush) {
            pendingFinalFlush = false;
            flush(true, true);
          }
        });
    };

    const endSession = () => {
      if (sessionEnded) return;
      if (!isPageViewRecorded) {
        pendingPageViewFinal = true;
        return;
      }
      flush(true, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endSession();
        return;
      }
      if (sessionEnded) {
        sessionEnded = false;
        activeSecondsThisSession = 0;
        lastActivityAt = Date.now();
        previousTickAt = Date.now();
      }
    };

    void sendPageView(path, pageViewId).then((recorded) => {
      isPageViewRecorded = recorded;
      if (recorded && pendingPageViewFinal) {
        pendingPageViewFinal = false;
        endSession();
      }
    });

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }
    document.addEventListener("click", trackClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", endSession);

    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.min((now - previousTickAt) / 1000, 2);
      previousTickAt = now;
      if (
        document.visibilityState === "visible" &&
        now - lastActivityAt <= 30_000
      ) {
        activeSecondsSinceFlush += elapsedSeconds;
        activeSecondsThisSession += elapsedSeconds;
      }
      if (activeSecondsSinceFlush >= 30 || clicksSinceFlush.length >= 10) {
        flush(false);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }
      document.removeEventListener("click", trackClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", endSession);
      endSession();
    };
  }, [path]);

  return null;
}
