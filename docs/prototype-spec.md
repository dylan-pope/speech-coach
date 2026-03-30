# Speech Practice Prototype Spec

## 1. Project summary

Build a polished proof-of-concept web app for a speech and debate classroom that helps students:

- defend a claim
- receive immediate coaching on the content of their argument
- respond to one or more AI-generated counterpoints
- reflect on strengths and weaknesses

This prototype is a coach, not a grader. It should feel low-stakes, fast, and visually strong.

The product working name for the prototype is:

`Civic Debate Academy: Argument Coach`

## 2. Key decision

The recommended implementation target is:

- `Frontend`: React + TypeScript + Vite + Tailwind CSS
- `Speech-to-text`: browser `SpeechRecognition` / Web Speech API
- `AI feedback`: local Ollama endpoint
- `Persistence`: browser `localStorage`
- `Optional recording`: browser `MediaRecorder`

### Why this is the recommended path

- It stays fully within the "free tools only" constraint.
- It avoids exposing paid API keys in a browser app.
- It keeps the product visually rich and modern without spending time on backend complexity.
- It isolates the AI layer behind a thin local API so the frontend can still be structured for a future static-hosted shell.

### Deployment decision

The project should be designed in two modes:

1. `full-local` mode
   This is the primary working prototype. The frontend runs locally and calls a local Ollama server.
2. `static-demo` mode
   This is GitHub Pages-friendly. It ships the full frontend shell and UI, but the AI call path is disabled or replaced with seeded mock feedback.

### Rationale

GitHub Pages only hosts static assets. A fully functional free AI workflow that is both reliable and client-safe is harder than a local Ollama setup. WebLLM is a valid future option, but it adds WebGPU/browser constraints and large model downloads. For a one-shot build, the local-Ollama path is the most predictable outcome.

## 3. Product goals

### Primary goals

- Let students practice argumentation more often without waiting on teacher review.
- Return immediate, useful coaching on argument content.
- Simulate rebuttal practice by generating counterarguments.
- Encourage student reflection after feedback.
- Present the experience as a modern, branded, school-ready prototype.

### Non-goals for this prototype

- no production auth
- no teacher dashboard
- no grading workflow
- no persistent database
- no advanced analytics
- no robust delivery analysis
- no paid APIs
- no full deployment requirement

## 4. MVP scope

### In scope

- landing page with strong branding and product framing
- practice studio
- microphone-based speech capture with manual transcript fallback
- editable transcript before submission
- AI content feedback on the transcript
- AI-generated counterpoint
- rebuttal round
- final coaching summary
- reflection box saved locally
- visible roadmap / TODO features on the frontend
- mock/demo mode for static hosting

### Out of scope

- pronunciation scoring
- filler-word counting
- pacing analysis
- speaker diarization
- teacher accounts
- LMS integration
- rubric exports
- multi-user sync

## 5. Users

### Primary user

- middle school or high school speech/debate student

### Secondary user

- teacher reviewing the concept and using demo mode in class

## 6. Core user stories

- As a student, I can choose a debate prompt and start speaking without typing everything manually.
- As a student, I can fix my transcript before analysis so the feedback is based on what I meant.
- As a student, I can receive feedback on claim clarity, reasoning, evidence, organization, and rebuttal quality.
- As a student, I can get a realistic counterpoint and respond to it.
- As a student, I can reflect on what I will improve next time.
- As a teacher, I can demo the product even if the AI backend is not running.

## 7. Experience concept

The prototype should feel like:

- a debate gym
- a coach’s whiteboard
- a bold, low-friction practice space

It should not feel like:

- a test platform
- an LMS
- a generic chatbot

## 8. Brand and visual direction

### Source cues from provided materials

Observed from the supplied brand assets:

- brand: `Civic Debate Academy`
- visual direction: neubrutalism presentation style
- likely core palette from slide theme:
  - `#000000`
  - `#FFFFFF`
  - `#EEEEEE`
  - `#595959`
  - `#4285F4`
  - `#212121`
  - `#78909C`
  - `#FFAB40`
  - `#0097A7`
  - `#EEFF41`
- logo mark includes a deep red close to `#AD0000`

### Recommended UI palette

Use this adapted palette:

- `Ink`: `#111111`
- `Paper`: `#FFF9F0`
- `Card`: `#FFFFFF`
- `Signal Red`: `#AD0000`
- `Debate Blue`: `#4285F4`
- `Argument Orange`: `#FFAB40`
- `Coach Teal`: `#0097A7`
- `Highlight Lime`: `#EEFF41`
- `Steel`: `#78909C`

### Visual rules

- heavy 3px to 4px borders
- hard drop shadows, not soft glassmorphism
- oversized section labels
- asymmetrical block layout
- bold CTA buttons
- textured or patterned background areas
- minimal rounded corners
- loud but controlled accent use

### Typography

Use free fonts only.

Recommended combination:

- display: `Archivo Black`
- body/UI: `Space Grotesk`

Fallback if needed:

- `Arial`, `sans-serif`

### Motion

- subtle staggered entrance for cards
- record button pulse while listening
- progress rail between rounds
- no excessive motion

## 9. Information architecture

Use a single-page app with these routes:

- `/`
  Landing page
- `/practice`
  Main recording and coaching studio
- `/report/:sessionId`
  Session recap page backed by localStorage

## 10. Screen spec

### A. Landing page

Purpose:

- explain the concept fast
- make the prototype look credible
- push the user into practice mode

Sections:

- hero
- how it works
- practice modes
- why this matters
- visible roadmap / TODO panel
- footer

Hero copy direction:

- eyebrow: `LOW-STAKES AI PRACTICE`
- title: `Build stronger arguments. Practice rebuttals. Get instant coaching.`
- supporting text: position the tool as a speech and debate practice coach
- CTAs:
  - `Start Practicing`
  - `View Demo Flow`

### B. Practice studio

Primary layout:

- left column: prompt, round status, controls
- right column: transcript editor, feedback panel, counterpoint panel

Main sections:

- prompt card
- round tracker
- microphone controls
- transcript editor
- analyze button
- returned feedback cards
- counterpoint panel
- rebuttal controls
- reflection box

### C. Report page

Sections:

- prompt recap
- opening statement transcript
- coaching summary
- counterpoint used
- rebuttal transcript
- final reflection
- restart session CTA

## 11. Practice flow

### Mode 1: Quick claim defense

1. user selects a prompt card
2. user starts microphone capture
3. transcript builds in real time
4. user stops and edits transcript
5. user submits for analysis
6. app returns content feedback
7. app shows one generated counterpoint
8. user can finish or continue

### Mode 2: Rebuttal drill

1. user selects prompt
2. user records opening argument
3. app analyzes content
4. app generates 2 counterpoints
5. app selects one or user chooses one
6. user records rebuttal
7. app analyzes rebuttal
8. app returns final coaching summary and reflection prompt

## 12. Functional requirements

### Speech-to-text

- Use the Web Speech API directly.
- Capture interim text while the user is speaking.
- Append finalized transcript segments into editable text.
- Detect unsupported browsers and fall back to manual text entry.
- Language setting can default to `en-US`.

### Transcript editing

- Transcript must be editable before sending to AI.
- User can clear and retry.
- User can paste their own text if microphone use fails.

### AI feedback

The AI should analyze content only.

Required coaching dimensions:

- claim clarity
- reasoning quality
- evidence use
- organization
- response to counterargument
- next-step coaching

### Counterargument generation

- Generate 2 concise opponent responses.
- Keep them plausible and age-appropriate.
- Make them challenge the actual claim, not the student personally.

### Reflection

- Present a reflection prompt after feedback.
- Save response to localStorage.

### Session history

- Save each session locally with timestamp and prompt.
- Display recent sessions on landing page or practice page sidebar.

## 13. AI behavior rules

The AI voice must be:

- constructive
- concise
- coach-like
- specific
- not authoritative
- not punitive

The AI must not:

- assign a grade
- pretend to know truth beyond the transcript
- shame the student
- overstate confidence

Required framing:

- "based on your response"
- "you could strengthen this by..."
- "a likely counterpoint is..."

## 14. Recommended local AI stack

### Primary recommendation

- install `Ollama`
- default model: `llama3.2`
- low-spec fallback model: `llama3.2:1b`

Reason:

- free
- local
- stable HTTP API
- good enough for structured coaching text in a prototype

### Optional alternative

- `gemma3:1b` or `gemma3:4b`

Do not depend on any paid hosted model.

## 15. API architecture

### Frontend

- browser handles microphone capture and transcript editing
- frontend sends normalized request to a thin local server

### Local server

- expose `/api/health`
- expose `/api/analyze`
- expose `/api/counterpoint`
- expose `/api/session-summary`

The server talks to `http://localhost:11434/api/chat`.

### Why add a thin local server

- keeps Ollama prompts off the client
- normalizes JSON output
- allows future swap to another free model
- avoids frontend coupling to model quirks

## 16. Request and response contracts

### `POST /api/analyze`

Request:

```json
{
  "mode": "opening" ,
  "promptTitle": "Schools should require debate for all students",
  "promptBody": "Defend or challenge the claim with reasons and evidence.",
  "transcript": "I think schools should require debate because..."
}
```

Response:

```json
{
  "summary": "You clearly argued that debate builds communication skills, but your reasoning needs a stronger example.",
  "rubric": {
    "claimClarity": {
      "level": "strong",
      "feedback": "Your main position is clear in the first sentence."
    },
    "reasoning": {
      "level": "developing",
      "feedback": "You connect debate to confidence, but you do not fully explain why practice causes that improvement."
    },
    "evidence": {
      "level": "emerging",
      "feedback": "You mention benefits, but you do not include a specific example, comparison, or fact."
    },
    "organization": {
      "level": "developing",
      "feedback": "The response has a beginning and end, but the middle ideas could be grouped more clearly."
    }
  },
  "strengths": [
    "Clear stance",
    "Relevant school-based topic framing"
  ],
  "improvements": [
    "Add one concrete example",
    "Explain why your evidence supports the claim",
    "Use a closing sentence that restates the argument"
  ],
  "coachQuestion": "What specific classroom example best proves your point?"
}
```

### `POST /api/counterpoint`

Request:

```json
{
  "promptTitle": "Schools should require debate for all students",
  "transcript": "I think schools should require debate because..."
}
```

Response:

```json
{
  "counterpoints": [
    {
      "id": "cp1",
      "title": "Not every student benefits the same way",
      "text": "An opponent could argue that requiring debate could increase stress for students who already struggle with public speaking."
    },
    {
      "id": "cp2",
      "title": "Curriculum time is limited",
      "text": "An opponent could argue that schools should prioritize math, reading, and science over a required debate class."
    }
  ]
}
```

### `POST /api/session-summary`

Request:

```json
{
  "promptTitle": "Schools should require debate for all students",
  "openingTranscript": "Opening statement transcript",
  "selectedCounterpoint": "Curriculum time is limited",
  "rebuttalTranscript": "Rebuttal transcript"
}
```

Response:

```json
{
  "overallAssessment": "You improved in the rebuttal by addressing the counterclaim directly, but you still need a more concrete example.",
  "bestMoment": "You directly answered the curriculum objection instead of repeating your opening claim.",
  "nextRep": "Practice giving one example and one comparison in under 45 seconds.",
  "reflectionPrompt": "What is one sentence you would rewrite before doing this again?"
}
```

## 17. Prompt engineering spec

### System prompt for analysis

Use a system prompt similar to:

```text
You are a debate coach for students. You are not a grader, judge, or source of truth.
Analyze only the content of the student's response.
Give specific, constructive, age-appropriate feedback.
Do not comment on vocal delivery, pacing, filler words, pronunciation, or confidence unless the user text explicitly mentions them.
Return valid JSON that matches the provided schema.
Prefer short, actionable language.
```

### Analysis prompt template

```text
Practice mode: {{mode}}
Prompt title: {{promptTitle}}
Prompt instructions: {{promptBody}}
Student transcript:
{{transcript}}

Evaluate:
1. Claim clarity
2. Reasoning quality
3. Evidence use
4. Organization
5. One coach question

Return JSON only.
```

### Counterpoint prompt template

```text
You are simulating an opponent in a student debate practice round.
Generate 2 realistic counterpoints to the student's argument.
Make them concise, fair, and useful for practice.
Avoid insults or sarcasm.
Return JSON only.

Prompt title: {{promptTitle}}
Student transcript:
{{transcript}}
```

### Final summary prompt template

```text
You are a supportive debate coach.
Compare the student's opening and rebuttal.
Identify one improvement, one remaining gap, and one next practice suggestion.
Return JSON only.
```

## 18. JSON enforcement

Use Ollama chat with JSON output or JSON schema formatting so the frontend can render reliably.

The local server should:

- validate AI responses with `zod`
- retry once on invalid JSON
- fall back to mock coaching JSON if parsing fails

## 19. Frontend technical stack

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

Server-side dependencies:

- `express`
- `cors`
- `zod`

## 20. Suggested file structure

```text
/
  docs/
    brand-guides/
    prototype-spec.md
    one-shot-build-prompt.md
  public/
    favicon.svg
  src/
    app/
      router.tsx
      providers.tsx
    components/
      layout/
      ui/
    features/
      landing/
      practice/
      report/
    hooks/
      useSpeechRecognition.ts
      useLocalSessions.ts
    lib/
      cn.ts
      formatters.ts
      constants.ts
    mocks/
      prompts.ts
      feedback.ts
    styles/
      index.css
      theme.css
    types/
      session.ts
      feedback.ts
    main.tsx
  server/
    index.ts
    routes/
      health.ts
      analyze.ts
      counterpoint.ts
      session-summary.ts
    services/
      ollama.ts
      prompts.ts
      schemas.ts
  package.json
  vite.config.ts
  tsconfig.json
```

## 21. UX details

### Prompt cards

Seed 6 to 10 prompt cards such as:

- Schools should require debate for all students.
- Social media does more harm than good for teens.
- Homework should be limited in middle school.
- School uniforms improve school culture.
- AI tools should be allowed in classrooms with limits.
- Students should have a later school start time.

### Status states

- idle
- listening
- transcript-ready
- analyzing
- feedback-ready
- rebuttal-listening
- summary-ready
- error

### Error handling

Handle these clearly:

- microphone permission denied
- speech recognition unsupported
- no transcript captured
- Ollama unavailable
- invalid AI JSON

Each error should offer a practical next step.

## 22. Accessibility requirements

- all buttons keyboard reachable
- visible focus styles
- sufficient contrast
- status text for recording state
- transcript area usable without microphone
- no motion dependency for core tasks

## 23. Local persistence

Use `localStorage` for:

- saved sessions
- last selected prompt
- reflection notes
- preferred mode

Do not add a real backend database.

## 24. Static demo mode

The app should support a demo configuration:

- show all pages and interactions
- allow transcript entry
- use seeded mock feedback instead of local AI calls
- surface a banner: `Demo mode: AI responses are mocked`

This keeps the frontend deployable to GitHub Pages even if the functional AI mode remains local-only.

## 25. Visible TODO features

Display a product roadmap panel on the landing page with items like:

- delivery coaching
- saved class rosters
- teacher dashboard
- side-by-side progress over time
- audio upload review
- rubric export
- multiplayer debate mode

These can be visually present without being implemented.

## 26. Acceptance criteria

The prototype is successful when:

- a user can open the app and start a practice session
- speech recognition works in supported browsers
- manual transcript entry works in unsupported browsers
- the user receives structured content coaching on an opening response
- the user receives at least one generated counterpoint
- the user can submit a rebuttal and receive a session summary
- the app looks intentionally branded and polished
- the prototype can run in `full-local` mode with free tools only
- the frontend can also run in `static-demo` mode without backend access

## 27. Implementation sequencing

Recommended build order:

1. scaffold Vite React TypeScript app
2. install Tailwind and establish theme tokens
3. build landing page and practice layout
4. implement speech recognition hook with manual fallback
5. add localStorage session model
6. build Express local API
7. wire Ollama analysis endpoint
8. add counterpoint generation
9. add rebuttal round and report page
10. add demo mode and mock data
11. polish motion, empty states, and roadmap panel

## 28. Testing expectations

Minimum testing for the build pass:

- manual verification in Chrome
- manual verification of no-mic fallback
- confirm Ollama-down state is handled gracefully
- confirm malformed AI response falls back cleanly
- confirm localStorage history renders after refresh

## 29. Source notes and implementation constraints

Validated constraints used for this spec:

- GitHub Pages is a static hosting service for HTML, CSS, and JavaScript files.
- MDN marks `SpeechRecognition` as limited availability and notes that some browsers use server-based recognition.
- MDN marks `MediaRecorder` as widely available.
- Ollama exposes a local HTTP API by default at `http://localhost:11434/api`.
- Ollama supports chat requests and structured JSON formatting.
- WebLLM is a viable browser-only future path, but it requires a WebGPU-compatible browser.

## 30. Final build instruction

When this spec is implemented, prioritize:

- visual quality first
- reliable happy-path experience second
- graceful fallbacks third

Do not spend time on production concerns beyond what is required to make the prototype coherent and demoable.
