import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl, dedupeByUrl } from "../src/dedupe.js";

test("normalizeUrl strips utm params, hash, and trailing slash", () => {
  assert.equal(
    normalizeUrl("https://example.com/post/?utm_source=x&utm_medium=y&ref=z#section"),
    "https://example.com/post?ref=z"
  );
  assert.equal(normalizeUrl("https://example.com/"), "https://example.com/");
});

test("dedupeByUrl keeps the first occurrence of each normalized URL", () => {
  const articles = [
    { title: "A", link: "https://example.com/a?utm_source=hn" },
    { title: "A duplicate", link: "https://example.com/a?utm_source=rss" },
    { title: "B", link: "https://example.com/b" },
  ];

  const result = dedupeByUrl(articles);

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((a) => a.title),
    ["A", "B"]
  );
});

test("dedupeByUrl falls back to raw link for invalid URLs", () => {
  const articles = [{ title: "weird", link: "not-a-real-url" }];
  assert.deepEqual(dedupeByUrl(articles), articles);
});
