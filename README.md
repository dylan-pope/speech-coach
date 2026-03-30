# Civic Debate Academy: Argument Coach

Polished proof-of-concept for classroom speech and debate practice.

## Tech stack

- React + TypeScript + Vite + Tailwind CSS
- Framer Motion + Lucide icons
- Browser speech recognition via Web Speech API
- Local Express API with Ollama backend (`http://localhost:11434/api/chat`)
- `zod` validation with malformed-output retry and mock fallback
- `localStorage` persistence for recent sessions and reflection notes

## Modes

1. `full-local` (default)
- Frontend + local Express server + local Ollama
- Runs real AI coaching calls through the local API

2. `static-demo`
- Frontend only
- Returns mocked coaching responses for GitHub Pages style demos

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install and start Ollama locally:

```bash
ollama pull llama3.2
ollama run llama3.2
```

3. Start the full local app (frontend + API server):

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
API server: `http://localhost:8787`

## Demo mode

Run frontend-only mock mode:

```bash
npm run dev:demo
```

Banner will display: `Demo mode: AI responses are mocked`.

## Environment variables

Copy `.env.example` to `.env` if you need overrides.

- `VITE_APP_MODE=full-local|static-demo`
- `VITE_API_BASE` for custom API host (optional)
- `SERVER_PORT` local API port (default `8787`)
- `OLLAMA_URL` Ollama chat endpoint (default `http://localhost:11434/api/chat`)
- `OLLAMA_MODEL` model name (default `llama3.2`, fallback option `llama3.2:1b`)

## AI Debug Logs

When the local API calls Ollama, request/response debug logs are written to:

- `server/logs/ollama-output.jsonl`

Each line includes timestamp, endpoint, attempt number, raw model content, parse result type, request payload, and fallback warnings/errors.

## Routes

- `/` landing page
- `/practice` practice studio
- `/report/:sessionId` local session recap

## Scripts

- `npm run dev` start client + local API server
- `npm run dev:client` start Vite frontend only
- `npm run dev:server` start local API server only
- `npm run dev:demo` start static demo mode frontend
- `npm run build` type-check + build frontend bundle
- `npm run preview` preview production frontend build
