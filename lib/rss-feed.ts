export interface RssFeedItem {
  title: string;
  url: string;
  description: string;
  publicationDate: Date;
  category?: string;
  enclosure?: {
    url: string;
    mimeType: string;
    length: number;
  };
}

export function escapeXml(value: string): string {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderRssFeed(
  siteUrl: URL,
  items: RssFeedItem[],
  buildDate: Date,
): string {
  const feedUrl = new URL("/rss.xml", siteUrl).toString();
  const renderedItems = items
    .map((item) => {
      const category = item.category
        ? `<category>${escapeXml(item.category)}</category>`
        : "";
      const enclosure = item.enclosure
        ? `<enclosure url="${escapeXml(item.enclosure.url)}" length="${item.enclosure.length}" type="${escapeXml(item.enclosure.mimeType)}"/>`
        : "";

      return [
        "<item>",
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(item.url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
        `<description>${escapeXml(item.description)}</description>`,
        `<pubDate>${item.publicationDate.toUTCString()}</pubDate>`,
        category,
        enclosure,
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    "<title>ChronicleFiles</title>",
    `<link>${escapeXml(siteUrl.toString())}</link>`,
    "<description>Stories and ideas from ChronicleFiles.</description>",
    "<language>en-us</language>",
    `<lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    renderedItems,
    "</channel>",
    "</rss>",
  ].join("");
}
