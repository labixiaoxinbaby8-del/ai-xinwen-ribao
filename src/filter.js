const DAY_MS = 24 * 60 * 60 * 1000;

export function filterLast24h(articles, now = new Date()) {
  const cutoff = now.getTime() - DAY_MS;
  return articles.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
}
