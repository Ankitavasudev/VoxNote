<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:05070D,50:0B3B45,100:00B8C4&height=170&section=header&text=VoxNote&fontSize=50&fontColor=E9F0F7&fontAlignY=40&desc=Speak.%20It%20writes.&descAlignY=60&descSize=16" width="100%" alt="VoxNote" />

**A voice-notes app that runs entirely in your browser — no account, no server, no upload.**

<br />

<a href="https://ankitavasudev.github.io/VoxNote/"><img src="https://img.shields.io/badge/%E2%96%B6%20LIVE%20DEMO-00B8C4?style=for-the-badge&logoColor=white" alt="Live demo" /></a>
&nbsp;
<img src="https://img.shields.io/badge/tests-14%20passing-3FB950?style=for-the-badge" alt="Tests" />
&nbsp;
<img src="https://img.shields.io/badge/storage-localStorage-0D1117?style=for-the-badge" alt="Storage" />

<br /><br />

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?flat-square&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Web%20Speech%20API-4285F4?flat-square&logo=googlechrome&logoColor=white" />
<img src="https://img.shields.io/badge/CSS3-1572B6?flat-square&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/GitHub%20Pages-222222?flat-square&logo=githubpages&logoColor=white" />

</div>

---

## What it does

Tap the mic, talk, and the transcript builds live in front of you. When you stop, the note is saved with a timestamp, word count and optional tags — searchable instantly, exportable as Markdown or JSON.

| Feature | How it works |
| :-- | :-- |
| **Live transcription** | Web Speech API (`SpeechRecognition`), continuous mode with interim results shown in grey while you speak |
| **Survives browser silence** | The API fires `end` after a pause; the app restarts it while recording is on, so a long note doesn't cut off |
| **Auto recovery** | A denied microphone permission flips the app into type-only mode instead of breaking |
| **Graceful degradation** | No Speech API (Firefox, older Safari)? The transcript becomes an editable area and everything else still works |
| **Search** | Case-insensitive across title, body and tags |
| **Tags** | Comma-separated, normalised to lowercase slugs |
| **Export** | Markdown (newest first) or raw JSON — generated client-side, nothing leaves the page |
| **Offline** | Notes live in `localStorage`; no backend to be down |

## Keyboard

| Keys | Action |
| :-- | :-- |
| `Ctrl`/`Cmd` + `Enter` | Save the current note |
| Click the mic | Start / stop listening |

## Run it

```bash
python -m http.server 8000     # or: npx serve .
# open http://localhost:8000
```

Microphone access requires a secure origin — `localhost` counts, `file://` does not.

## Tests

```bash
npm test          # node --test, 14 tests
```

The pure logic lives in `notes-core.js` (formatting, titles, search, word counts, Markdown export) precisely so it can be tested without a DOM. `app.js` only wires that logic to elements.

```
VoxNote/
├── index.html      # markup
├── style.css       # glass UI, recorder, library
├── app.js          # speech recognition, rendering, storage, export
├── notes-core.js   # pure helpers (tested)
├── tests/          # node:test suite
└── .github/workflows/ci.yml
```

## Browser support

Chrome, Edge and Safari 14.1+ ship `SpeechRecognition`. Firefox does not — VoxNote detects that at load and switches to typing mode automatically.

## Stack

Vanilla JavaScript (ES modules) · Web Speech API · CSS custom properties · `node:test` · GitHub Actions · GitHub Pages

---

<div align="center">

**Ankita Salaria** · [@Ankitavasudev](https://github.com/Ankitavasudev)

</div>
