function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(isoString) {
  return new Date(isoString).toISOString().slice(11, 16) + " UTC";
}

export function renderMarkdown(articles, now = new Date()) {
  const dateStr = formatDate(now);
  const lines = [`# AI 新闻日报 - ${dateStr}`, "", `共 ${articles.length} 篇文章`, ""];

  for (const article of articles) {
    lines.push(`## [${article.title}](${article.link})`);
    lines.push(`_${article.source} · ${formatTime(article.publishedAt)}_`);
    lines.push("");
    lines.push(article.summary || "");
    lines.push("");
  }

  return lines.join("\n");
}
