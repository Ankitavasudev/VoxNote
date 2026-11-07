/**
 * VoxNote — voice notes in the browser.
 * Speech recognition is optional: without it the transcript becomes a normal
 * editable text area so the app still works everywhere.
 */

import { formatDuration, makeTitle, searchNotes, toMarkdown, summarise, wordCount } from "./notes-core.js";

const STORAGE_KEY = "voxnote.notes.v1";

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const statusText = $("statusText");
const mic = $("mic");
const timer = $("timer");
const hint = $("hint");
const transcript = $("transcript");
const placeholder = $("placeholder");
const titleInput = $("title");
const tagsInput = $("tags");
const saveBtn = $("save");
const searchInput = $("search");
const notesList = $("notes");
const emptyEl = $("empty");
const countEl = $("count");
const statsEl = $("stats");
const toastEl = $("toast");

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = Boolean(Recognition);

let notes = load();
let recording = false;
let elapsed = 0;
let timerHandle = null;
let startedAt = 0;
let finalText = "";
let recognition = null;

/* ------------------------------------------------------------------- sound */
const Sound = (() => {
  let ctx = null;
  let muted = localStorage.getItem("voxnote-sound") === "0";
  function ensure() {
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = "sine", gain = 0.07, slide = 0) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(c.destination);
    o.start(now); o.stop(now + dur + 0.02);
  }
  return {
    start: () => { tone(660, 0.06, "sine", 0.08); setTimeout(() => tone(880, 0.08, "sine", 0.09), 70); },
    stop: () => { tone(880, 0.06, "sine", 0.07); setTimeout(() => tone(550, 0.09, "sine", 0.07), 70); },
    save: () => { tone(523, 0.08, "sine", 0.08); setTimeout(() => tone(659, 0.08, "sine", 0.08), 90); setTimeout(() => tone(784, 0.12, "sine", 0.09), 180); },
    copy: () => tone(740, 0.04, "triangle", 0.06),
    del: () => { tone(440, 0.07, "sine", 0.07); setTimeout(() => tone(330, 0.1, "sine", 0.07), 70); },
    clear: () => tone(330, 0.16, "sawtooth", 0.07, -180),
    export: () => { tone(659, 0.08, "sine", 0.08); setTimeout(() => tone(784, 0.12, "sine", 0.09), 90); },
    toggleMute: () => {
      muted = !muted;
      localStorage.setItem("voxnote-sound", muted ? "0" : "1");
      if (!muted) tone(880, 0.06, "sine", 0.08);
      return muted;
    },
    isMuted: () => muted,
  };
})();

/* ------------------------------------------------------------------ storage */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* -------------------------------------------------------------------- toast */

let toastHandle = null;
function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => {
    toastEl.hidden = true;
  }, 2200);
}

/* ------------------------------------------------------------------ status */

function setStatus(state, label) {
  statusEl.dataset.state = state;
  statusText.textContent = label;
}

/* ------------------------------------------------------------- transcription */

function setTranscript(text, interim = "") {
  transcript.textContent = "";
  if (text) transcript.append(document.createTextNode(text));
  if (interim) {
    const span = document.createElement("span");
    span.className = "interim";
    span.textContent = ` ${interim}`;
    transcript.append(span);
  }
  if (!text && !interim && !transcript.isContentEditable) {
    const span = document.createElement("span");
    span.className = "placeholder";
    span.textContent = "Your words appear here…";
    transcript.append(span);
  }
  // Derive this from the arguments, not from innerText: the placeholder is a
  // child of the transcript and would otherwise look like a saved note.
  saveBtn.disabled = !(text.trim() || interim.trim());
}

function currentText() {
  return transcript.innerText.replace(/\s+\n/g, "\n").trim();
}

// What a save would actually store. In type-only mode that is whatever the
// user typed; while recording it is the finalized speech, never the placeholder.
function noteText() {
  return transcript.isContentEditable ? currentText() : finalText.trim();
}

function startRecognition() {
  if (!supported) return;
  recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalText = `${finalText} ${result[0].transcript}`.trim();
      } else {
        interim += result[0].transcript;
      }
    }
    setTranscript(finalText, interim);
  };

  recognition.onerror = (event) => {
    if (event.error === "no-speech") return;
    if (event.error === "not-allowed") {
      stopRecording();
      enableTypeOnlyMode("Microphone blocked — type your note instead");
      toast("Microphone permission denied — you can still type notes");
      return;
    }
    setStatus("error", event.error);
  };

  recognition.onend = () => {
    // Browsers stop listening after silence; resume while the user is recording.
    if (recording) {
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    }
  };

  recognition.start();
}

/* ---------------------------------------------------------------- recording */

function startRecording() {
  recording = true;
  startedAt = Date.now();
  elapsed = 0;
  finalText = "";
  mic.dataset.recording = "true";
  mic.setAttribute("aria-label", "Stop recording");
  setStatus("listening", "Listening");
  hint.textContent = "Listening… tap again to stop";
  setTranscript("");
  timerHandle = setInterval(() => {
    elapsed = Date.now() - startedAt;
    timer.textContent = formatDuration(elapsed);
  }, 250);
  startRecognition();
  Sound.start();
}

function stopRecording() {
  recording = false;
  mic.dataset.recording = "false";
  mic.setAttribute("aria-label", "Start recording");
  setStatus("idle", "Idle");
  hint.textContent = "Tap the mic and start talking";
  clearInterval(timerHandle);
  timerHandle = null;
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      /* ignore */
    }
  }
  saveBtn.disabled = finalText.trim().length === 0;
  Sound.stop();
}

mic.addEventListener("click", () => {
  if (recording) stopRecording();
  else startRecording();
});

/* --------------------------------------------------------------------- save */

function saveNote() {
  const text = noteText();
  if (!text) return;
  const tags = tagsInput.value
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
  notes.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: titleInput.value.trim() || makeTitle(text),
    text,
    tags,
    created: Date.now(),
    duration: elapsed,
  });
  persist();
  render();
  titleInput.value = "";
  tagsInput.value = "";
  setTranscript("");
  timer.textContent = "0:00";
  elapsed = 0;
  toast("Note saved");
  Sound.save();
}

saveBtn.addEventListener("click", saveNote);

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    if (!saveBtn.disabled) saveNote();
  }
});

/* ------------------------------------------------------------------- render */

function render() {
  const query = searchInput.value;
  const visible = searchNotes(notes, query);

  notesList.textContent = "";
  for (const note of visible) {
    const li = document.createElement("li");
    li.className = "note";

    const head = document.createElement("div");
    head.className = "note-head";
    const h3 = document.createElement("h3");
    h3.textContent = note.title;
    const time = document.createElement("time");
    time.dateTime = new Date(note.created).toISOString();
    time.textContent = new Date(note.created).toLocaleString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    head.append(h3, time);

    const body = document.createElement("p");
    body.textContent = note.text;

    const foot = document.createElement("div");
    foot.className = "note-foot";

    const tags = document.createElement("div");
    tags.className = "tags";
    for (const tag of note.tags || []) {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = `#${tag}`;
      tags.append(chip);
    }
    const meta = document.createElement("span");
    meta.className = "tag";
    meta.textContent = `${wordCount(note.text)} words`;
    tags.append(meta);

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "icon-btn";
    copyBtn.title = "Copy text";
    copyBtn.textContent = "⧉";
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(note.text);
      toast("Copied");
      Sound.copy();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn danger";
    deleteBtn.title = "Delete note";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => {
      notes = notes.filter((item) => item.id !== note.id);
      persist();
      render();
      toast("Deleted");
      Sound.del();
    });

    actions.append(copyBtn, deleteBtn);
    foot.append(tags, actions);
    li.append(head, body, foot);
    notesList.append(li);
  }

  emptyEl.hidden = visible.length > 0;
  countEl.textContent = String(notes.length);

  const totals = summarise(notes);
  statsEl.textContent = `${totals.notes} notes · ${totals.words} words · ${totals.minutes} min`;
}

searchInput.addEventListener("input", render);

/* ------------------------------------------------------------------- export */

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$("exportMd").addEventListener("click", () => {
  if (!notes.length) return toast("Nothing to export");
  download("voxnote-notes.md", toMarkdown(notes), "text/markdown");
  Sound.export();
});

$("exportJson").addEventListener("click", () => {
  if (!notes.length) return toast("Nothing to export");
  download("voxnote-notes.json", JSON.stringify(notes, null, 2), "application/json");
  Sound.export();
});

$("clearAll").addEventListener("click", () => {
  if (!notes.length) return;
  if (!confirm(`Delete all ${notes.length} notes? This cannot be undone.`)) return;
  notes = [];
  persist();
  render();
  toast("All notes cleared");
  Sound.clear();
});

/* --------------------------------------------------------------------- init */

// Switch the transcript into a plain editable box. Used both when the browser
// has no Speech API and when the user denies the microphone, so the app keeps
// working instead of leaving a dead record button on screen.
function enableTypeOnlyMode(message) {
  transcript.contentEditable = "true";
  transcript.setAttribute("role", "textbox");
  transcript.setAttribute("aria-label", "Type your note");
  hint.textContent = message;
  setStatus("error", "Type-only mode");
  mic.disabled = true;
  mic.style.opacity = "0.35";
  mic.style.cursor = "not-allowed";
  if (currentText()) {
    saveBtn.disabled = false;
  } else {
    setTranscript("");
  }
}

// contenteditable does not go through setTranscript, so the save button has to
// follow the text directly in type-only mode.
transcript.addEventListener("input", () => {
  if (transcript.isContentEditable) {
    saveBtn.disabled = currentText().length === 0;
  }
});

if (!supported) {
  enableTypeOnlyMode("Speech recognition is unavailable in this browser — type instead");
} else {
  setTranscript("");
}

render();

$("muteBtn").addEventListener("click", () => {
  const m = Sound.toggleMute();
  $("muteBtn").textContent = m ? "Sound off" : "Sound";
  toast(m ? "Sound off" : "Sound on");
});
$("muteBtn").textContent = Sound.isMuted() ? "Sound off" : "Sound";
