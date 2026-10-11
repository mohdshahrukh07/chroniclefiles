import "server-only";

export function getPublicSiteUrl(): URL | null {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function arePublicAdsConfigured(): boolean {
  return (
    process.env.ADS_ENABLED === "true" &&
    /^ca-pub-\d+$/.test(process.env.ADSENSE_PUBLISHER_ID?.trim() ?? "")
  );
}
