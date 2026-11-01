/**
 * Pure helpers for VoxNote. Kept separate from the DOM so they can be unit
 * tested with `node --test` without a browser.
 */

/** 83_000 -> "1:23" */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** First few words of a transcript, used as the default note title. */
export function makeTitle(text, max = 48) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled note";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/** Case-insensitive search across title, body and tags. */
export function searchNotes(notes, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return notes;
  return notes.filter((note) => {
    const haystack = [note.title, note.text, ...(note.tags || [])].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}

/** Word count that ignores empty splits. */
export function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

/** Stable, human-readable export. */
export function toMarkdown(notes) {
  return notes
    .slice()
    .sort((a, b) => b.created - a.created)
    .map((note) => {
      const when = new Date(note.created).toISOString().slice(0, 16).replace("T", " ");
      const tags = (note.tags || []).map((tag) => `#${tag}`).join(" ");
      return `## ${note.title}\n\n_${when} UTC_\n\n${note.text}\n${tags ? `\n${tags}\n` : ""}`;
    })
    .join("\n---\n\n");
}

/** Aggregate counters shown in the footer. */
export function summarise(notes) {
  return {
    notes: notes.length,
    words: notes.reduce((total, note) => total + wordCount(note.text), 0),
    minutes: Math.round(notes.reduce((total, note) => total + (note.duration || 0), 0) / 60000),
  };
}
