import Parser from "rss-parser";
import { SOURCES } from "./sources.js";

const parser = new Parser({ timeout: 10_000 });

function normalizeItem(item, sourceName) {
  const publishedRaw = item.isoDate || item.pubDate;
  const publishedAt = publishedRaw ? new Date(publishedRaw) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return null;

  return {
    title: (item.title || "").trim(),
    link: (item.link || "").trim(),
    description: (item.contentSnippet || item.content || item.summary || "").trim(),
    publishedAt: publishedAt.toISOString(),
    source: sourceName,
  };
}

async function fetchSource({ name, url }) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || [])
      .map((item) => normalizeItem(item, name))
      .filter((item) => item && item.title && item.link);
  } catch (err) {
    console.warn(`[fetch] 抓取失败,跳过该源: ${name} (${url}) - ${err.message}`);
    return [];
  }
}

export async function fetchAll() {
  const results = await Promise.all(SOURCES.map(fetchSource));
  return results.flat();
}
