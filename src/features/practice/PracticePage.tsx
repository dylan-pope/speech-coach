import { motion } from 'framer-motion'
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Send,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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

const progressSteps = ['Prompt', 'Opening', 'Counterpoint', 'Summary']

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

  const progressIndex = summary
    ? 3
    : openingFeedback && counterpoints.length > 0
      ? 2
      : openingTranscript.trim()
        ? 1
        : 0

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
          <div className="grid gap-2">
            {progressSteps.map((step, index) => {
              const reached = index <= progressIndex
              return (
                <div
                  className="flex items-center gap-3 border-2 border-ink bg-paper px-3 py-2"
                  key={step}
                >
                  <span className="inline-flex size-7 items-center justify-center border-2 border-ink bg-card font-display text-xs">
                    {index + 1}
                  </span>
                  <span className={reached ? 'font-semibold' : 'opacity-70'}>{step}</span>
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

      <section className="grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <NeoCard accent="orange" className="space-y-3">
            <h2 className="text-xl uppercase">1) Pick a Prompt</h2>
            <div className="grid gap-2">
              {seededPrompts.map((prompt) => (
                <button
                  className={`border-3 p-3 text-left transition ${
                    selectedPromptId === prompt.id
                      ? 'border-ink bg-blue-debate text-ink shadow-neo-sm'
                      : 'border-ink bg-paper hover:bg-orange-argument/45'
                  }`}
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  type="button"
                >
                  <p className="font-semibold">{prompt.title}</p>
                  <p className="mt-1 text-sm">{prompt.body}</p>
                </button>
              ))}
            </div>
          </NeoCard>

          <NeoCard accent="teal" className="space-y-3">
            <h2 className="text-xl uppercase">2) Opening Statement</h2>
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
              Status:{' '}
              <span className="font-semibold">
                {openingSpeech.listening ? 'Listening' : 'Idle'}
              </span>
            </p>
            {openingSpeech.interimTranscript && (
              <p className="border-2 border-ink bg-lime p-2 text-sm">
                Live transcript: {openingSpeech.interimTranscript}
              </p>
            )}
            <textarea
              className="min-h-44 w-full resize-y border-3 border-ink bg-paper p-3 shadow-neo-sm"
              onChange={(event) => setOpeningTranscript(event.target.value)}
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
          </NeoCard>
        </div>

        <div className="space-y-5">
          <NeoCard accent="blue" className="space-y-4">
            <h2 className="text-xl uppercase">3) Coaching Feedback</h2>
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
              </motion.div>
            )}
          </NeoCard>

          <NeoCard accent="orange" className="space-y-3">
            <h2 className="text-xl uppercase">4) Rebuttal Drill</h2>
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
          </NeoCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <NeoCard accent="lime" className="space-y-3">
          <h2 className="text-xl uppercase">5) Final Summary + Reflection</h2>
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
        </NeoCard>

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
          <p className="border-2 border-ink bg-orange-argument p-2 text-xs uppercase">
            Current status: {uiStatus}
          </p>
        </NeoCard>
      </section>
    </AppFrame>
  )
}
