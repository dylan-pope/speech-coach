import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Send,
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppFrame } from '../../components/layout/AppFrame'
import { NeoButton } from '../../components/ui/NeoButton'
import { NeoCard } from '../../components/ui/NeoCard'
import { StatusPill } from '../../components/ui/StatusPill'
import { useLocalSessions } from '../../hooks/useLocalSessions'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import {
  analyzeTranscript,
  checkHealth,
  generateCounterpoints,
  generateSessionSummary,
} from '../../lib/api'
import { APP_MODE, IS_DEMO_MODE, STORAGE_KEYS } from '../../lib/constants'
import { seededPrompts } from '../../mocks/prompts'
import type { AnalyzeResponse, Counterpoint, SessionSummaryResponse } from '../../types/feedback'

type UiStatus =
  | 'idle'
  | 'listening'
  | 'transcript-ready'
  | 'analyzing'
  | 'feedback-ready'
  | 'rebuttal-listening'
  | 'summary-ready'
  | 'error'

type StepKey = 'prompt' | 'opening' | 'feedback' | 'rebuttal' | 'summary'
type StepMode = 'auto' | 'open' | 'closed'

const progressSteps: { key: StepKey; label: string }[] = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'opening', label: 'Opening' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'rebuttal', label: 'Rebuttal' },
  { key: 'summary', label: 'Summary' },
]

const collapsedHints: Record<StepKey, string> = {
  prompt: 'Choose a debate prompt to unlock opening practice.',
  opening: 'Opening statement step is collapsed.',
  feedback: 'Feedback is collapsed. Expand to review coaching.',
  rebuttal: 'Rebuttal unlocks after you finish feedback review.',
  summary: 'Summary unlocks after rebuttal submission.',
}

const uiStatusLabels: Record<UiStatus, string> = {
  idle: 'Waiting for prompt selection',
  listening: 'Recording opening statement',
  'transcript-ready': 'Opening transcript ready for analysis',
  analyzing: 'Analyzing opening argument',
  'feedback-ready': 'Feedback and counterpoints are ready',
  'rebuttal-listening': 'Recording rebuttal',
  'summary-ready': 'Session summary generated',
  error: 'Action needed: review the error message',
}

function appendSegment(current: string, segment: string) {
  return current ? `${current} ${segment}`.trim() : segment.trim()
}

function getRubricTone(level: AnalyzeResponse['rubric']['claimClarity']['level']) {
  if (level === 'strong') {
    return 'success'
  }

  if (level === 'developing') {
    return 'warning'
  }

  return 'error'
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.floor(Math.random() * 100_000)}`
}

function StepCard(props: {
  accent: 'red' | 'blue' | 'orange' | 'teal' | 'lime' | 'steel' | 'none'
  completed: boolean
  expanded: boolean
  canToggle: boolean
  title: string
  stepNumber: number
  onToggle: () => void
  collapsedHint: string
  children: ReactNode
}) {
  return (
    <NeoCard accent={props.accent} className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl uppercase">
            {props.stepNumber}) {props.title}
          </h2>
          <StatusPill tone={props.completed ? 'success' : 'neutral'}>
            {props.completed ? 'Completed' : 'In Progress'}
          </StatusPill>
        </div>
        <button
          aria-label={props.expanded ? `Collapse ${props.title}` : `Expand ${props.title}`}
          className="inline-flex items-center gap-2 border-2 border-ink bg-paper px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!props.canToggle}
          onClick={props.onToggle}
          type="button"
        >
          {props.expanded ? 'Collapse' : 'Expand'}
          {props.expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      {props.expanded ? (
        props.children
      ) : (
        <p className="border-2 border-ink bg-paper p-3 text-sm">{props.collapsedHint}</p>
      )}
    </NeoCard>
  )
}

export function PracticePage() {
  const [selectedPromptId, setSelectedPromptId] = useState(() => {
    const persisted = window.localStorage.getItem(STORAGE_KEYS.lastPromptId)
    return persisted && seededPrompts.some((prompt) => prompt.id === persisted)
      ? persisted
      : seededPrompts[0].id
  })
  const selectedPrompt =
    seededPrompts.find((prompt) => prompt.id === selectedPromptId) ?? seededPrompts[0]

  const [openingTranscript, setOpeningTranscript] = useState('')
  const [rebuttalTranscript, setRebuttalTranscript] = useState('')
  const [openingFeedback, setOpeningFeedback] = useState<AnalyzeResponse | null>(null)
  const [counterpoints, setCounterpoints] = useState<Counterpoint[]>([])
  const [selectedCounterpointId, setSelectedCounterpointId] = useState('')
  const [summary, setSummary] = useState<SessionSummaryResponse | null>(null)
  const [reflection, setReflection] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [uiStatus, setUiStatus] = useState<UiStatus>('idle')
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'offline' | 'unreachable'>(
    IS_DEMO_MODE ? 'ok' : 'checking',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [promptConfirmed, setPromptConfirmed] = useState(false)
  const [feedbackReviewed, setFeedbackReviewed] = useState(false)
  const [stepModes, setStepModes] = useState<Partial<Record<StepKey, StepMode>>>({})

  const { sessions, upsertSession, updateReflection } = useLocalSessions()

  const openingSpeech = useSpeechRecognition({
    onFinalSegment: (segment) => {
      setOpeningTranscript((current) => appendSegment(current, segment))
      setUiStatus('transcript-ready')
    },
  })

  const rebuttalSpeech = useSpeechRecognition({
    onFinalSegment: (segment) => {
      setRebuttalTranscript((current) => appendSegment(current, segment))
    },
  })

  const selectedCounterpoint =
    counterpoints.find((item) => item.id === selectedCounterpointId) ?? null

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.lastPromptId, selectedPromptId)
  }, [selectedPromptId])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.preferredMode, APP_MODE)
  }, [])

  useEffect(() => {
    if (!promptConfirmed && (openingTranscript.trim() || openingFeedback || rebuttalTranscript.trim())) {
      setPromptConfirmed(true)
    }
  }, [openingTranscript, openingFeedback, rebuttalTranscript, promptConfirmed])

  useEffect(() => {
    if (IS_DEMO_MODE) {
      return
    }

    let active = true

    checkHealth()
      .then((response) => {
        if (!active) {
          return
        }
        setServerStatus(response.status === 'ok' ? 'ok' : 'offline')
      })
      .catch(() => {
        if (!active) {
          return
        }
        setServerStatus('unreachable')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (openingSpeech.listening) {
      setUiStatus('listening')
    } else if (rebuttalSpeech.listening) {
      setUiStatus('rebuttal-listening')
    }
  }, [openingSpeech.listening, rebuttalSpeech.listening])

  useEffect(() => {
    if (openingSpeech.error) {
      setErrorMessage(openingSpeech.error)
      setUiStatus('error')
    }
  }, [openingSpeech.error])

  useEffect(() => {
    if (rebuttalSpeech.error) {
      setErrorMessage(rebuttalSpeech.error)
      setUiStatus('error')
    }
  }, [rebuttalSpeech.error])

  const stepCompletion: Record<StepKey, boolean> = {
    prompt: promptConfirmed,
    opening: Boolean(openingFeedback),
    feedback: feedbackReviewed,
    rebuttal: Boolean(summary),
    summary: Boolean(summary),
  }

  const activeStep: StepKey = !stepCompletion.prompt
    ? 'prompt'
    : !stepCompletion.opening
      ? 'opening'
      : !stepCompletion.feedback
        ? 'feedback'
        : !stepCompletion.rebuttal
          ? 'rebuttal'
          : 'summary'

  useEffect(() => {
    setStepModes((current) => {
      if (current[activeStep] !== 'closed') {
        return current
      }
      return { ...current, [activeStep]: 'auto' }
    })
  }, [activeStep])

  function isStepExpanded(stepKey: StepKey) {
    const mode = stepModes[stepKey] ?? 'auto'
    if (mode === 'open') {
      return true
    }
    if (mode === 'closed') {
      return false
    }
    return stepKey === activeStep
  }

  function canToggleStep(stepKey: StepKey) {
    return stepCompletion[stepKey] || stepKey === activeStep
  }

  function toggleStep(stepKey: StepKey) {
    const currentlyExpanded = isStepExpanded(stepKey)
    setStepModes((current) => ({
      ...current,
      [stepKey]: currentlyExpanded ? 'closed' : 'open',
    }))
  }

  function clearRound() {
    setOpeningTranscript('')
    setRebuttalTranscript('')
    setOpeningFeedback(null)
    setCounterpoints([])
    setSelectedCounterpointId('')
    setSummary(null)
    setReflection('')
    setSessionId(null)
    setErrorMessage(null)
    setUiStatus('idle')
    setPromptConfirmed(false)
    setFeedbackReviewed(false)
    setStepModes({})
    openingSpeech.resetState()
    rebuttalSpeech.resetState()
  }

  async function onAnalyzeOpening() {
    const normalized = openingTranscript.trim()

    if (!normalized) {
      setErrorMessage('Please capture or type an opening transcript before analysis.')
      setUiStatus('error')
      return
    }

    setIsAnalyzing(true)
    setErrorMessage(null)
    setUiStatus('analyzing')
    setFeedbackReviewed(false)

    try {
      const feedback = await analyzeTranscript({
        mode: 'opening',
        promptTitle: selectedPrompt.title,
        promptBody: selectedPrompt.body,
        transcript: normalized,
      })
      setOpeningFeedback(feedback)

      const counterpointResult = await generateCounterpoints({
        promptTitle: selectedPrompt.title,
        transcript: normalized,
      })

      setCounterpoints(counterpointResult.counterpoints)
      setSelectedCounterpointId(counterpointResult.counterpoints[0]?.id ?? '')
      setUiStatus('feedback-ready')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Analysis failed. Confirm local server/Ollama status or switch to demo mode.'
      setErrorMessage(message)
      setUiStatus('error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function onGenerateSummary() {
    const normalizedRebuttal = rebuttalTranscript.trim()
    if (!selectedCounterpoint) {
      setErrorMessage('Pick one counterpoint before submitting a rebuttal summary.')
      setUiStatus('error')
      return
    }

    if (!normalizedRebuttal) {
      setErrorMessage('Capture or type your rebuttal transcript before generating summary.')
      setUiStatus('error')
      return
    }

    setErrorMessage(null)
    setIsSummarizing(true)

    try {
      const result = await generateSessionSummary({
        promptTitle: selectedPrompt.title,
        openingTranscript: openingTranscript.trim(),
        selectedCounterpoint: selectedCounterpoint.title,
        rebuttalTranscript: normalizedRebuttal,
      })
      setSummary(result)
      setUiStatus('summary-ready')

      const nextSessionId = sessionId ?? createSessionId()
      setSessionId(nextSessionId)

      upsertSession({
        id: nextSessionId,
        createdAt: new Date().toISOString(),
        mode: APP_MODE,
        prompt: selectedPrompt,
        openingTranscript: openingTranscript.trim(),
        openingFeedback:
          openingFeedback ??
          ({
            summary: 'No opening feedback captured.',
            rubric: {
              claimClarity: { level: 'emerging', feedback: 'Missing feedback.' },
              reasoning: { level: 'emerging', feedback: 'Missing feedback.' },
              evidence: { level: 'emerging', feedback: 'Missing feedback.' },
              organization: { level: 'emerging', feedback: 'Missing feedback.' },
            },
            strengths: [],
            improvements: [],
            coachQuestion: '',
          } satisfies AnalyzeResponse),
        counterpoints,
        selectedCounterpoint,
        rebuttalTranscript: normalizedRebuttal,
        finalSummary: result,
        reflection,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate summary. Try again after checking your local services.'
      setErrorMessage(message)
      setUiStatus('error')
    } finally {
      setIsSummarizing(false)
    }
  }

  function onReflectionChange(next: string) {
    setReflection(next)
    if (sessionId) {
      updateReflection(sessionId, next)
    }
  }

  const activeStepIndex = progressSteps.findIndex((step) => step.key === activeStep)

  return (
    <AppFrame className="space-y-5 md:space-y-7">
      <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <NeoCard accent="red" className="space-y-3">
          <p className="inline-flex border-2 border-ink bg-lime px-2 py-1 text-xs font-semibold uppercase">
            Practice Studio
          </p>
          <h1 className="text-3xl uppercase md:text-4xl">Argument Coach Rounds</h1>
          <p>
            Capture your opening, get structured coaching, respond to a counterpoint, and end with
            a final summary.
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={IS_DEMO_MODE ? 'warning' : 'neutral'}>
              Mode: {APP_MODE}
            </StatusPill>
            {!IS_DEMO_MODE && (
              <StatusPill
                tone={
                  serverStatus === 'ok'
                    ? 'success'
                    : serverStatus === 'offline'
                      ? 'warning'
                      : serverStatus === 'checking'
                        ? 'neutral'
                        : 'error'
                }
              >
                {serverStatus === 'ok'
                  ? 'Ollama ready'
                  : serverStatus === 'offline'
                    ? 'Ollama offline: using fallback'
                    : serverStatus === 'checking'
                      ? 'Checking local server'
                      : 'Server unreachable'}
              </StatusPill>
            )}
          </div>
          {IS_DEMO_MODE && (
            <p className="border-2 border-ink bg-orange-argument p-2 text-sm font-semibold uppercase">
              Demo mode: AI responses are mocked.
            </p>
          )}
        </NeoCard>

        <NeoCard accent="blue" className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em]">Round Progress</p>
          <p className="border-2 border-ink bg-paper p-2 text-xs font-semibold uppercase">
            Current status: {uiStatusLabels[uiStatus]}
          </p>
          <div className="grid gap-2">
            {progressSteps.map((step, index) => {
              const reached = index < activeStepIndex || step.key === activeStep || stepCompletion[step.key]
              return (
                <div
                  className="flex items-center gap-3 border-2 border-ink bg-paper px-3 py-2"
                  key={step.key}
                >
                  <span className="inline-flex size-7 items-center justify-center border-2 border-ink bg-card font-display text-xs">
                    {index + 1}
                  </span>
                  <span className={reached ? 'font-semibold' : 'opacity-70'}>{step.label}</span>
                  {reached && <CheckCircle2 className="ml-auto size-4" />}
                </div>
              )
            })}
          </div>
          <NeoButton onClick={clearRound} variant="ghost">
            <RotateCcw className="size-4" />
            Reset round
          </NeoButton>
        </NeoCard>
      </section>

      {errorMessage && (
        <NeoCard accent="red" className="flex items-start gap-3 bg-red-signal text-paper">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p>{errorMessage}</p>
        </NeoCard>
      )}

      <section className="space-y-5">
        <StepCard
          accent="orange"
          canToggle={canToggleStep('prompt')}
          collapsedHint={collapsedHints.prompt}
          completed={stepCompletion.prompt}
          expanded={isStepExpanded('prompt')}
          onToggle={() => toggleStep('prompt')}
          stepNumber={1}
          title="Pick a Prompt"
        >
          <div className="grid gap-2">
            {seededPrompts.map((prompt) => (
              <button
                className={`border-3 p-3 text-left transition ${
                  selectedPromptId === prompt.id
                    ? 'border-ink bg-blue-debate text-ink shadow-neo-sm'
                    : 'border-ink bg-paper hover:bg-orange-argument/45'
                }`}
                key={prompt.id}
                onClick={() => {
                  setSelectedPromptId(prompt.id)
                  setPromptConfirmed(true)
                  setErrorMessage(null)
                }}
                type="button"
              >
                <p className="font-semibold">{prompt.title}</p>
                <p className="mt-1 text-sm">{prompt.body}</p>
              </button>
            ))}
          </div>
        </StepCard>

        <StepCard
          accent="teal"
          canToggle={canToggleStep('opening')}
          collapsedHint={collapsedHints.opening}
          completed={stepCompletion.opening}
          expanded={isStepExpanded('opening')}
          onToggle={() => toggleStep('opening')}
          stepNumber={2}
          title="Opening Statement"
        >
          {!openingSpeech.supported && (
            <p className="border-2 border-ink bg-orange-argument p-2 text-sm">
              Speech recognition is unsupported in this browser. Continue with manual transcript
              input.
            </p>
          )}
          {openingSpeech.permissionDenied && (
            <p className="border-2 border-ink bg-orange-argument p-2 text-sm">
              Microphone permission denied. Manual input is active.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <NeoButton
              disabled={!openingSpeech.supported || openingSpeech.listening}
              onClick={() => openingSpeech.start()}
            >
              <Mic className="size-4" />
              Start mic
            </NeoButton>
            <NeoButton
              disabled={!openingSpeech.listening}
              onClick={() => openingSpeech.stop()}
              variant="danger"
            >
              <MicOff className="size-4" />
              Stop mic
            </NeoButton>
          </div>
          <p className="text-xs uppercase tracking-[0.12em]">
            Status: <span className="font-semibold">{openingSpeech.listening ? 'Listening' : 'Idle'}</span>
          </p>
          {openingSpeech.interimTranscript && (
            <p className="border-2 border-ink bg-lime p-2 text-sm">
              Live transcript: {openingSpeech.interimTranscript}
            </p>
          )}
          <textarea
            className="min-h-44 w-full resize-y border-3 border-ink bg-paper p-3 shadow-neo-sm"
            onChange={(event) => {
              setOpeningTranscript(event.target.value)
              if (!promptConfirmed) {
                setPromptConfirmed(true)
              }
            }}
            placeholder="Your opening transcript appears here. You can edit or paste text."
            value={openingTranscript}
          />
          <NeoButton disabled={isAnalyzing} onClick={onAnalyzeOpening}>
            {isAnalyzing ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Analyze opening + generate counterpoints
              </>
            )}
          </NeoButton>
        </StepCard>

        <StepCard
          accent="blue"
          canToggle={canToggleStep('feedback')}
          collapsedHint={collapsedHints.feedback}
          completed={stepCompletion.feedback}
          expanded={isStepExpanded('feedback')}
          onToggle={() => toggleStep('feedback')}
          stepNumber={3}
          title="Coaching Feedback"
        >
          {!openingFeedback ? (
            <p className="border-2 border-ink bg-paper p-3 text-sm">
              Submit your opening transcript to receive structured coaching.
            </p>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
              initial={{ opacity: 0, y: 8 }}
            >
              <p className="border-2 border-ink bg-paper p-3">{openingFeedback.summary}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(openingFeedback.rubric).map(([key, item]) => (
                  <div className="border-2 border-ink bg-paper p-2 text-sm" key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <StatusPill tone={getRubricTone(item.level)}>{item.level}</StatusPill>
                    </div>
                    <p>{item.feedback}</p>
                  </div>
                ))}
              </div>
              <p className="border-2 border-ink bg-lime p-2 text-sm font-semibold">
                Coach question: {openingFeedback.coachQuestion}
              </p>
              <NeoButton
                onClick={() => {
                  setFeedbackReviewed(true)
                  setErrorMessage(null)
                }}
                variant="secondary"
              >
                Continue to rebuttal
              </NeoButton>
            </motion.div>
          )}
        </StepCard>

        <StepCard
          accent="orange"
          canToggle={canToggleStep('rebuttal')}
          collapsedHint={collapsedHints.rebuttal}
          completed={stepCompletion.rebuttal}
          expanded={isStepExpanded('rebuttal')}
          onToggle={() => toggleStep('rebuttal')}
          stepNumber={4}
          title="Rebuttal Drill"
        >
          {counterpoints.length === 0 ? (
            <p className="border-2 border-ink bg-paper p-3 text-sm">
              Counterpoints appear here after opening analysis.
            </p>
          ) : (
            <div className="space-y-2">
              {counterpoints.map((counterpoint) => (
                <button
                  className={`w-full border-3 p-3 text-left ${
                    selectedCounterpointId === counterpoint.id
                      ? 'border-ink bg-orange-argument shadow-neo-sm'
                      : 'border-ink bg-paper hover:bg-paper/60'
                  }`}
                  key={counterpoint.id}
                  onClick={() => setSelectedCounterpointId(counterpoint.id)}
                  type="button"
                >
                  <p className="font-semibold">{counterpoint.title}</p>
                  <p className="text-sm">{counterpoint.text}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <NeoButton
              disabled={!rebuttalSpeech.supported || rebuttalSpeech.listening}
              onClick={() => rebuttalSpeech.start()}
            >
              <Mic className="size-4" />
              Record rebuttal
            </NeoButton>
            <NeoButton
              disabled={!rebuttalSpeech.listening}
              onClick={() => rebuttalSpeech.stop()}
              variant="danger"
            >
              <MicOff className="size-4" />
              Stop rebuttal
            </NeoButton>
          </div>
          {rebuttalSpeech.interimTranscript && (
            <p className="border-2 border-ink bg-lime p-2 text-sm">
              Live rebuttal: {rebuttalSpeech.interimTranscript}
            </p>
          )}
          <textarea
            className="min-h-36 w-full resize-y border-3 border-ink bg-paper p-3 shadow-neo-sm"
            onChange={(event) => setRebuttalTranscript(event.target.value)}
            placeholder="Rebuttal transcript..."
            value={rebuttalTranscript}
          />
          <NeoButton disabled={isSummarizing || !openingFeedback} onClick={onGenerateSummary}>
            {isSummarizing ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Generating summary...
              </>
            ) : (
              'Generate final session summary'
            )}
          </NeoButton>
        </StepCard>

        <StepCard
          accent="lime"
          canToggle={canToggleStep('summary')}
          collapsedHint={collapsedHints.summary}
          completed={stepCompletion.summary}
          expanded={isStepExpanded('summary')}
          onToggle={() => toggleStep('summary')}
          stepNumber={5}
          title="Final Summary + Reflection"
        >
          {!summary ? (
            <p className="border-2 border-ink bg-paper p-3 text-sm">
              Complete the rebuttal drill to unlock your final coaching summary.
            </p>
          ) : (
            <>
              <p className="border-2 border-ink bg-paper p-3">{summary.overallAssessment}</p>
              <p>
                <span className="font-semibold">Best moment:</span> {summary.bestMoment}
              </p>
              <p>
                <span className="font-semibold">Next rep:</span> {summary.nextRep}
              </p>
              <p className="font-semibold">{summary.reflectionPrompt}</p>
              <textarea
                className="min-h-32 w-full resize-y border-3 border-ink bg-paper p-3 shadow-neo-sm"
                onChange={(event) => onReflectionChange(event.target.value)}
                placeholder="Type your reflection and next adjustment."
                value={reflection}
              />
              {sessionId && (
                <Link to={`/report/${sessionId}`}>
                  <NeoButton>Open full report</NeoButton>
                </Link>
              )}
            </>
          )}
        </StepCard>
      </section>

      <section>
        <NeoCard accent="steel" className="space-y-3">
          <h2 className="text-xl uppercase">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="border-2 border-ink bg-paper p-2 text-sm">
              No local sessions yet. They will appear after your first summary.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <li className="border-2 border-ink bg-paper p-2 text-sm" key={session.id}>
                  <p className="font-semibold">{session.prompt.title}</p>
                  <Link className="underline decoration-2" to={`/report/${session.id}`}>
                    Open session report
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </NeoCard>
      </section>
    </AppFrame>
  )
}
