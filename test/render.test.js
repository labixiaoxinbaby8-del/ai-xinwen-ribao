import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, renderHtml } from "../src/render.js";

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

test("renderHtml includes title, link, source and summary", () => {
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

  const html = renderHtml(articles, now);

  assert.match(html, /<title>AI 新闻日报 - 2026-09-10<\/title>/);
  assert.match(html, /共 1 篇文章/);
  assert.match(html, /<a href="https:\/\/example\.com\/gpt6"[^>]*>GPT-6 发布<\/a>/);
  assert.match(html, /TechCrunch AI/);
  assert.match(html, /一句话总结。/);
});

test("renderHtml escapes HTML special characters from article content", () => {
  const now = new Date("2026-09-10T12:00:00Z");
  const articles = [
    {
      title: '<script>alert("xss")</script>',
      link: "https://example.com/a?x=1&y=2",
      source: "TechCrunch AI",
      publishedAt: "2026-09-10T08:30:00Z",
      summary: "包含 <b>标签</b> & 特殊字符",
    },
  ];

  const html = renderHtml(articles, now);

  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  assert.match(html, /包含 &lt;b&gt;标签&lt;\/b&gt; &amp; 特殊字符/);
});
