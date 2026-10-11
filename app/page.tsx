import type { Metadata } from "next";
import { HomepagePage } from "@/components/blog/homepage-page";
import { getPublicHomepageData } from "@/lib/homepage";
import { getPublicSiteUrl } from "@/lib/public-site-config";

const siteUrl = getPublicSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ChronicleFiles — Stories, Ideas & Knowledge",
  description:
    "Discover stories, ideas, and knowledge across technology, education, entertainment, and more.",
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  alternates: siteUrl ? { canonical: siteUrl.toString() } : undefined,
  openGraph: {
    type: "website",
    siteName: "ChronicleFiles",
    title: "ChronicleFiles — Stories, Ideas & Knowledge",
    description:
      "Discover stories, ideas, and knowledge across technology, education, entertainment, and more.",
    ...(siteUrl ? { url: siteUrl.toString() } : {}),
  },
};

export default async function Home() {
  let data;
  try {
    data = await getPublicHomepageData();
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public homepage could not be loaded (${errorName}).`);
    throw new Error("The ChronicleFiles homepage could not be loaded. Please try again.");
  }

  return <HomepagePage data={data} />;
}
