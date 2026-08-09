# VoxNote

> Voice-to-text note-taking app with transcription, organization, and search capabilities.

[![CI](https://github.com/Ankitavasudev/VoxNote/actions/workflows/ci.yml/badge.svg)](https://github.com/Ankitavasudev/VoxNote/actions)
[![React 18](https://img.shields.io/badge/react-18-61DAFB.svg)](https://reactjs.org)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **Voice Recording** - High-quality audio capture with noise reduction
- **AI Transcription** - Accurate speech-to-text conversion
- **Smart Organization** - Auto-categorize notes by topic
- **Full-text Search** - Search within transcriptions
- **Tags & Folders** - Hierarchical organization
- **Export** - Markdown, PDF, plain text export
- **Offline Mode** - Local storage with sync capability
- **Keyboard Shortcuts** - Power user shortcuts

## Demo

```
┌─────────────────────────────────────────────────────────┐
│  VoxNote - Voice Notes                                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔴 REC 00:03:42                    [⏹ Stop]    │   │
│  │                                                 │   │
│  │  "Today we discussed the new Kubernetes         │   │
│  │   deployment strategy. The team agreed to       │   │
│  │   implement blue-green deployments for          │   │
│  │   production environments..."                   │   │
│  │                                                 │   │
│  │  Tags: #kubernetes #deployment #meeting         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Recent Notes                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📝 Sprint Planning - Aug 9    #meeting #scrum   │   │
│  │ 📝 API Design Review - Aug 8  #api #design      │   │
│  │ 📝 Bug Triage - Aug 7         #bugs #urgent     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Search: [________________________] 🔍                 │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## API Usage

```bash
# Record and transcribe
curl -X POST http://localhost:8000/api/transcribe \
  -F "audio=@recording.wav"

# Search notes
curl "http://localhost:8000/api/search?q=kubernetes&tag=meeting"

# Get all notes
curl http://localhost:8000/api/notes

# Export note as markdown
curl http://localhost:8000/api/notes/123/export?format=markdown
```

## Architecture

```
VoxNote/
├── src/
│   ├── components/
│   │   ├── Recorder.jsx          # Audio recording
│   │   ├── Transcription.jsx     # Live transcription
│   │   ├── NoteList.jsx          # Note list view
│   │   ├── NoteEditor.jsx        # Note editing
│   │   ├── SearchBar.jsx         # Search functionality
│   │   └── TagManager.jsx        # Tag management
│   ├── hooks/
│   │   ├── useRecorder.js        # Audio recording logic
│   │   ├── useTranscription.js   # Speech-to-text
│   │   └── useNotes.js           # Note CRUD operations
│   ├── utils/
│   │   ├── audio.js              # Audio processing
│   │   ├── transcription.js      # Transcription API
│   │   └── storage.js            # Local storage
│   └── styles/
│       └── globals.css           # TailwindCSS styles
├── api/
│   ├── main.py                   # FastAPI server
│   ├── transcription.py          # Whisper integration
│   ├── search.py                 # Full-text search
│   └── models.py                 # Data models
└── .github/workflows/            # CI/CD pipeline
```

## Tech Stack

- **Frontend**: React 18, Web Audio API, TailwindCSS
- **Backend**: Python, FastAPI, OpenAI Whisper
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Search**: SQLite FTS5 (full-text search)
- **CI/CD**: GitHub Actions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Add tests for new features
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.