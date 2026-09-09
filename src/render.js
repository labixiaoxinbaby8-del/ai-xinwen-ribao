function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(isoString) {
  return new Date(isoString).toISOString().slice(11, 16) + " UTC";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

export function renderHtml(articles, now = new Date()) {
  const dateStr = formatDate(now);

  const cards = articles
    .map(
      (a) => `
      <article class="card">
        <h2><a href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.title)}</a></h2>
        <p class="meta">${escapeHtml(a.source)} · ${escapeHtml(formatTime(a.publishedAt))}</p>
        <p class="summary">${escapeHtml(a.summary)}</p>
      </article>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 新闻日报 - ${dateStr}</title>
<style>
  :root{
    --bg:#f7f8fb; --panel:#fff; --border:#e4e7ee; --text:#1f2430;
    --text-dim:#6b7280; --link:#3556d8; --accent:#5b6ef5;
  }
  @media (prefers-color-scheme: dark){
    :root{ --bg:#14161c; --panel:#1c1f28; --border:#2a2e3a; --text:#e7e9ee; --text-dim:#9aa0ae; --link:#8fa4ff; --accent:#8fa4ff; }
  }
  *{ box-sizing:border-box; }
  body{
    margin:0; background:var(--bg); color:var(--text);
    font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
    line-height:1.6;
  }
  .wrap{ max-width:720px; margin:0 auto; padding:48px 20px 80px; }
  header{ margin-bottom:32px; }
  h1{ font-size:28px; margin:0 0 8px; }
  .count{ color:var(--text-dim); font-size:14px; margin:0; }
  .card{
    background:var(--panel); border:1px solid var(--border); border-radius:12px;
    padding:20px 22px; margin-bottom:16px;
  }
  .card h2{ font-size:18px; margin:0 0 6px; line-height:1.4; }
  .card h2 a{ color:var(--text); text-decoration:none; }
  .card h2 a:hover{ color:var(--link); text-decoration:underline; }
  .meta{ color:var(--accent); font-size:13px; font-weight:600; margin:0 0 10px; }
  .summary{ color:var(--text-dim); font-size:15px; margin:0; }
  footer{ text-align:center; color:var(--text-dim); font-size:13px; margin-top:32px; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>AI 新闻日报 · ${dateStr}</h1>
      <p class="count">共 ${articles.length} 篇文章</p>
    </header>
    <main>${cards || '<p class="count">今天没有抓到符合条件的文章。</p>'}
    </main>
    <footer>自动生成 · TechCrunch AI / The Verge AI / Hacker News</footer>
  </div>
</body>
</html>
`;
}
