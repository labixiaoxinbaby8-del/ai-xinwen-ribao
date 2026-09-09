import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import cron from "node-cron";
import { fetchAll } from "./fetch.js";
import { filterLast24h } from "./filter.js";
import { dedupeByUrl } from "./dedupe.js";
import { summarizeAll } from "./summarize.js";
import { renderMarkdown, renderHtml } from "./render.js";

const REPORTS_DIR = path.join(process.cwd(), "reports");
const DOCS_DIR = path.join(process.cwd(), "docs");
const DOCS_REPORTS_DIR = path.join(DOCS_DIR, "reports");

export async function run() {
  console.log("[run] 开始抓取...");
  const raw = await fetchAll();
  console.log(`[run] 抓取到 ${raw.length} 篇原始文章`);

  const recent = filterLast24h(raw);
  console.log(`[run] 近 24 小时内 ${recent.length} 篇`);

  const deduped = dedupeByUrl(recent).sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  console.log(`[run] 去重后 ${deduped.length} 篇`);

  const summarized = await summarizeAll(deduped);

  const now = new Date();
  const markdown = renderMarkdown(summarized, now);
  const html = renderHtml(summarized, now);

  await mkdir(REPORTS_DIR, { recursive: true });
  const dateStr = now.toISOString().slice(0, 10);
  const mdPath = path.join(REPORTS_DIR, `${dateStr}.md`);
  const htmlPath = path.join(REPORTS_DIR, `${dateStr}.html`);
  await writeFile(mdPath, markdown, "utf-8");
  await writeFile(htmlPath, html, "utf-8");
  console.log(`[run] 日报已生成: ${mdPath}`);
  console.log(`[run] 网页已生成: ${htmlPath}`);

  // 同时发布一份到 docs/,供 GitHub Pages 使用:
  // docs/index.html 始终是最新一期,docs/reports/DATE.html 保留历史存档
  await mkdir(DOCS_REPORTS_DIR, { recursive: true });
  const docsArchivePath = path.join(DOCS_REPORTS_DIR, `${dateStr}.html`);
  const docsIndexPath = path.join(DOCS_DIR, "index.html");
  await writeFile(docsArchivePath, html, "utf-8");
  await writeFile(docsIndexPath, html, "utf-8");
  console.log(`[run] Pages 存档已生成: ${docsArchivePath}`);
  console.log(`[run] Pages 首页已更新: ${docsIndexPath}`);

  return { mdPath, htmlPath, docsArchivePath, docsIndexPath };
}

function main() {
  const isCron = process.argv.includes("--cron");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[warn] 未检测到环境变量 ANTHROPIC_API_KEY,摘要步骤会全部走兜底截断。");
  }

  if (isCron) {
    console.log("[cron] 已启动定时模式,每天 08:00(Asia/Shanghai)自动运行一次");
    cron.schedule("0 8 * * *", () => {
      run().catch((err) => console.error("[cron] 运行失败:", err));
    }, { timezone: "Asia/Shanghai" });
  } else {
    run().catch((err) => {
      console.error("[run] 运行失败:", err);
      process.exitCode = 1;
    });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
