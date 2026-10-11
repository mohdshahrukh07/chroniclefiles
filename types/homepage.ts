import type { PublicPostCardData } from "@/components/blog/public-post-card";

export const HOMEPAGE_SLOTS = [
  "leftTopPostId",
  "leftBottomPostId",
  "editorsPickPostId",
  "rightTopPostId",
  "rightBottomPostId",
] as const;

export type HomepageSlot = (typeof HOMEPAGE_SLOTS)[number];
export type HomepageSlotValues = Record<HomepageSlot, string | null>;

export interface HomepageManagementData {
  layout: HomepageSlotValues;
  selectedPosts: Record<HomepageSlot, PublicPostCardData | null>;
  posts: PublicPostCardData[];
}

export interface PublicHomepageData {
  featured: Record<HomepageSlot, PublicPostCardData | null>;
  latest: PublicPostCardData[];
  technology: PublicPostCardData[];
  education: PublicPostCardData[];
  entertainment: PublicPostCardData[];
  recommendations: PublicPostCardData[];
  categories: { name: string; slug: string }[];
}
