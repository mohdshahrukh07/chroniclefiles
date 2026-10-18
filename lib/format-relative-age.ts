const SECOND_IN_MS = 1_000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const MONTH_IN_MS = (365.2425 / 12) * DAY_IN_MS;
const YEAR_IN_MS = 365.2425 * DAY_IN_MS;

export function formatRelativeAge(value?: string): string | null {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < MINUTE_IN_MS) {
    return `${Math.floor(elapsed / SECOND_IN_MS)} sec ago`;
  }
  if (elapsed < HOUR_IN_MS) {
    return `${Math.floor(elapsed / MINUTE_IN_MS)} min ago`;
  }
  if (elapsed < DAY_IN_MS) {
    return `${Math.floor(elapsed / HOUR_IN_MS)} hr ago`;
  }
  if (elapsed < MONTH_IN_MS) {
    return `${Math.floor(elapsed / DAY_IN_MS)} days ago`;
  }
  if (elapsed < YEAR_IN_MS) {
    const months = Math.max(1, Math.floor(elapsed / MONTH_IN_MS));
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.max(1, Math.floor(elapsed / YEAR_IN_MS));
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
