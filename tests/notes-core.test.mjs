import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatDuration,
  makeTitle,
  searchNotes,
  summarise,
  toMarkdown,
  wordCount,
} from "../notes-core.js";

test("formatDuration pads seconds and floors milliseconds", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(1000), "0:01");
  assert.equal(formatDuration(83_000), "1:23");
  assert.equal(formatDuration(600_000), "10:00");
  assert.equal(formatDuration(59_999), "0:59");
});

test("formatDuration never renders negative time", () => {
  assert.equal(formatDuration(-5000), "0:00");
});

test("makeTitle falls back for empty input", () => {
  assert.equal(makeTitle(""), "Untitled note");
  assert.equal(makeTitle("   \n\t "), "Untitled note");
  assert.equal(makeTitle(null), "Untitled note");
});

test("makeTitle collapses whitespace", () => {
  assert.equal(makeTitle("  hello   world \n again "), "hello world again");
});

test("makeTitle truncates long text with an ellipsis", () => {
  const title = makeTitle("a".repeat(120), 20);
  assert.equal(title.length, 21);
  assert.ok(title.endsWith("…"));
});

test("makeTitle keeps text exactly at the limit intact", () => {
  const text = "x".repeat(20);
  assert.equal(makeTitle(text, 20), text);
});

const notes = [
  { id: "1", title: "Sprint notes", text: "ship the parser", tags: ["work"], created: 3, duration: 60_000 },
  { id: "2", title: "Grocery", text: "milk and coffee", tags: ["home"], created: 2, duration: 0 },
  { id: "3", title: "Ideas", text: "parser rewrite", tags: ["WORK", "deep"], created: 1, duration: 30_000 },
];

test("searchNotes returns everything for an empty query", () => {
  assert.equal(searchNotes(notes, "").length, 3);
  assert.equal(searchNotes(notes, "   ").length, 3);
});

test("searchNotes matches title, body and tags case-insensitively", () => {
  assert.deepEqual(searchNotes(notes, "parser").map((n) => n.id), ["1", "3"]);
  assert.deepEqual(searchNotes(notes, "grocery").map((n) => n.id), ["2"]);
  assert.deepEqual(searchNotes(notes, "work").map((n) => n.id), ["1", "3"]);
  assert.deepEqual(searchNotes(notes, "coffee").map((n) => n.id), ["2"]);
});

test("searchNotes returns an empty list when nothing matches", () => {
  assert.deepEqual(searchNotes(notes, "zzz"), []);
});

test("wordCount ignores extra whitespace", () => {
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount("   "), 0);
  assert.equal(wordCount("one two three"), 3);
  assert.equal(wordCount("  one   two \n three  "), 3);
});

test("summarise totals notes, words and rounded minutes", () => {
  assert.deepEqual(summarise(notes), { notes: 3, words: 8, minutes: 2 });
  assert.deepEqual(summarise([]), { notes: 0, words: 0, minutes: 0 });
});

test("toMarkdown is newest first and includes tags", () => {
  const md = toMarkdown(notes);
  const order = md.split("## ").slice(1).map((block) => block.split("\n")[0]);
  assert.deepEqual(order, ["Sprint notes", "Grocery", "Ideas"]);
  assert.ok(md.includes("#work"));
  assert.ok(md.includes("#deep"));
  assert.ok(md.includes("---"));
});

test("toMarkdown does not mutate the input array", () => {
  const copy = notes.map((n) => ({ ...n }));
  toMarkdown(notes);
  assert.deepEqual(notes, copy);
});

test("toMarkdown handles a note with no tags", () => {
  const md = toMarkdown([{ id: "x", title: "Bare", text: "no tags here", created: 0, tags: [] }]);
  assert.ok(md.startsWith("## Bare"));
  assert.equal(md.match(/^#[^\s#]/gm), null, "no tag line should be emitted");
});
