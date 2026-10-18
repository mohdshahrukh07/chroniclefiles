import type { MetadataRoute } from "next";
// import { getPublicSiteUrl } from "@/lib/public-site-config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-dashboard", "/api/"],
    },
    // ...(siteUrl
    //   ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() }
    //   : {}),
  };
}
