import { test } from "node:test";
import assert from "node:assert/strict";
import { filterLast24h } from "../src/filter.js";

const NOW = new Date("2026-09-10T12:00:00Z");

test("keeps articles published within the last 24 hours", () => {
  const articles = [
    { title: "in range - just now", publishedAt: "2026-09-10T11:00:00Z" },
    { title: "in range - exactly 24h ago", publishedAt: "2026-09-09T12:00:00Z" },
    { title: "out of range", publishedAt: "2026-09-09T11:59:00Z" },
  ];

  const result = filterLast24h(articles, NOW);

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((a) => a.title),
    ["in range - just now", "in range - exactly 24h ago"]
  );
});

test("returns empty array when nothing is recent", () => {
  const articles = [{ title: "old", publishedAt: "2020-01-01T00:00:00Z" }];
  assert.deepEqual(filterLast24h(articles, NOW), []);
});
