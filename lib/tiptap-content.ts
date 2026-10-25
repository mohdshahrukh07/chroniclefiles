const textAlignments = ["left", "center", "right", "justify"] as const;
const imageAlignments = ["left", "center", "right"] as const;
const calloutKinds = ["note", "warning", "tip", "important"] as const;
const fontSizes = ["14px", "16px", "18px", "20px", "24px"] as const;

export type SafeTextAlignment = (typeof textAlignments)[number];
export type SafeImageAlignment = (typeof imageAlignments)[number];
export type SafeCalloutKind = (typeof calloutKinds)[number];

export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href !== value || /[\u0000-\u0020\\]/.test(href)) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;

  try {
    const url = new URL(href);
    if (url.username || url.password) return null;
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? href : null;
  } catch {
    return null;
  }
}

export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const src = value.trim();
  if (!src || src !== value || /[\u0000-\u0020\\]/.test(src)) return null;

  try {
    const url = new URL(src);
    if (url.username || url.password) return null;
    return ["https:", "http:"].includes(url.protocol) ? src : null;
  } catch {
    return null;
  }
}

export function safeTextAlignment(value: unknown): SafeTextAlignment | null {
  return typeof value === "string" &&
    textAlignments.includes(value as SafeTextAlignment)
    ? (value as SafeTextAlignment)
    : null;
}

export function safeTextColor(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : null;
}

export function safeFontSize(value: unknown): string | null {
  return typeof value === "string" &&
    fontSizes.includes(value as (typeof fontSizes)[number])
    ? value
    : null;
}

export function safeImageAlignment(value: unknown): SafeImageAlignment {
  return typeof value === "string" &&
    imageAlignments.includes(value as SafeImageAlignment)
    ? (value as SafeImageAlignment)
    : "center";
}

export function safeImageWidth(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return Number.isFinite(parsed) && parsed >= 100 && parsed <= 1600
    ? Math.round(parsed)
    : null;
}

export function safeImageCaption(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 300)
    : null;
}

export function safeCalloutKind(value: unknown): SafeCalloutKind {
  return typeof value === "string" &&
    calloutKinds.includes(value as SafeCalloutKind)
    ? (value as SafeCalloutKind)
    : "note";
}
