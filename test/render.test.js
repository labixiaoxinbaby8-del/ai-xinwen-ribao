import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/render.js";

test("renderMarkdown includes title, link, source and summary", () => {
  const now = new Date("2026-09-10T12:00:00Z");
  const articles = [
    {
      title: "GPT-6 发布",
      link: "https://example.com/gpt6",
      source: "TechCrunch AI",
      publishedAt: "2026-09-10T08:30:00Z",
      summary: "一句话总结。",
    },
  ];

  const md = renderMarkdown(articles, now);

  assert.match(md, /# AI 新闻日报 - 2026-09-10/);
  assert.match(md, /共 1 篇文章/);
  assert.match(md, /\[GPT-6 发布\]\(https:\/\/example\.com\/gpt6\)/);
  assert.match(md, /TechCrunch AI/);
  assert.match(md, /一句话总结。/);
});
