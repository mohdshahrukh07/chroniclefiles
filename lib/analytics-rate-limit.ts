const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 120;
const MAX_VISITORS = 10_000;

interface RateLimitWindow {
  startedAt: number;
  count: number;
}

const windows = new Map<string, RateLimitWindow>();

export function allowAnalyticsEvent(visitorHash: string): boolean {
  const now = Date.now();
  if (windows.size >= MAX_VISITORS) {
    for (const [key, window] of windows) {
      if (now - window.startedAt >= WINDOW_MS) windows.delete(key);
      if (windows.size < MAX_VISITORS) break;
    }
  }

  const current = windows.get(visitorHash);
  if (!current && windows.size >= MAX_VISITORS) return false;
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(visitorHash, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_EVENTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}
