export function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
    }
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function dedupeByUrl(articles) {
  const seen = new Set();
  const result = [];
  for (const article of articles) {
    const key = normalizeUrl(article.link);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(article);
  }
  return result;
}
