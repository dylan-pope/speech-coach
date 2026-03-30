# One-Shot Build Prompt

Use this prompt in a future build pass to implement the prototype described in `docs/prototype-spec.md`.

---

Build a polished proof-of-concept web app in this repository called `Civic Debate Academy: Argument Coach`.

Read and follow `docs/prototype-spec.md` as the source of truth.

## Outcome required

Create a working prototype with:

- React
- TypeScript
- Vite
- Tailwind CSS
- a bold neubrutalist visual style based on the brand cues in `docs/brand-guides`
- browser speech-to-text using the Web Speech API
- manual transcript fallback when speech recognition is unsupported
- a local Express server that calls Ollama at `http://localhost:11434/api/chat`
- structured AI feedback on the content of a student speech
- AI-generated counterpoints for rebuttal practice
- a final session summary
- localStorage persistence for recent sessions and reflection notes
- a static demo mode with mocked AI responses

## Important constraints

- use free tools only
- do not use any paid API or hosted LLM service
- do not add authentication
- do not add a database
- do not analyze delivery unless there is an extremely simple free browser-native feature
- treat the AI as a coach, not a grader
- optimize for a strong visual result, not backend complexity

## Required architecture

Implement two modes:

1. `full-local`
   Frontend + local Express server + local Ollama
2. `static-demo`
   Frontend only with mocked feedback data so the UI can still be deployed to GitHub Pages later

Use a thin local server because it should:

- normalize all AI responses
- validate JSON with `zod`
- keep prompts out of the browser
- provide graceful fallback when Ollama is offline

## Functional requirements

Implement these routes:

- `/`
- `/practice`
- `/report/:sessionId`

Implement these flows:

1. user picks a prompt
2. user records opening statement with speech recognition
3. transcript appears live and can be edited
4. user submits transcript for AI feedback
5. app displays structured coaching cards
6. app generates 2 counterpoints
7. user records rebuttal to one selected counterpoint
8. app returns final session summary and reflection prompt
9. session is saved to localStorage

## AI requirements

Use Ollama as the only functional AI backend.

Default model:

- `llama3.2`

Fallback for lower-spec machines:

- make the model configurable via environment variable

Create these server endpoints:

- `GET /api/health`
- `POST /api/analyze`
- `POST /api/counterpoint`
- `POST /api/session-summary`

Use structured JSON output. Validate the response using `zod`. Retry once on malformed AI output, then fall back to mock JSON.

## UI requirements

The app should not look generic.

Use:

- heavy borders
- hard shadows
- bold section labels
- asymmetrical cards
- strong red, black, cream, blue, and orange accents
- expressive typography

Include:

- a landing page hero
- practice mode cards
- progress indicator across rounds
- a roadmap / TODO panel on the landing page
- recent sessions sidebar or section

## Speech requirements

Use the Web Speech API directly, not a paid speech service.

Requirements:

- start / stop mic controls
- live transcript updates
- editable transcript text area
- clear retry state
- unsupported browser fallback to manual input

If simple and low-effort, also add optional audio recording with `MediaRecorder`, but do not block the prototype on that feature.

## Technical requirements

Use a modern, clean file structure.

Recommended dependencies:

- `react`
- `react-dom`
- `typescript`
- `vite`
- `tailwindcss`
- `@tailwindcss/vite`
- `react-router-dom`
- `zod`
- `clsx`
- `lucide-react`
- `framer-motion`
- `express`
- `cors`

## Delivery requirements

Create all necessary code, config, and styles.

Also include:

- a README section or short setup notes for running Ollama locally
- seeded prompt data
- mocked feedback data for demo mode
- clear empty states and error states

## Error handling

Handle:

- mic permission denied
- speech recognition unsupported
- empty transcript
- Ollama not running
- invalid AI JSON

## Behavior rules

The coaching copy must:

- be constructive
- be age-appropriate
- be concise
- avoid grades
- avoid certainty language
- focus on claim clarity, reasoning, evidence, organization, and rebuttal quality

## Finish the task fully

Do not stop at planning.

Implement the full prototype, wire the major flows end to end, and leave only clearly labeled TODOs for non-MVP items like delivery analysis, teacher dashboards, or classroom management.

When finished:

- summarize what was built
- list any limitations
- explain how to run it locally

---

If there is any ambiguity, choose the option that best preserves:

1. free-only tooling
2. local reliability
3. visual quality
4. low-stakes coaching UX
