import { Router } from 'express'
import { fallbackAnalyze, fallbackAnalyzeLowSignal } from '../services/fallbacks'
import { generateStructuredWithFallback } from '../services/ollama'
import { buildAnalyzePrompts } from '../services/prompts'
import { analyzeFormatSchema } from '../services/response-format'
import { analyzeRequestSchema, analyzeResponseSchema } from '../services/schemas'

const analyzeRouter = Router()

function isLowSignalTranscript(transcript: string) {
  const normalized = transcript.toLowerCase().trim()
  const tokens = normalized.match(/[a-z0-9']+/g) ?? []
  const alphaTokens = normalized.match(/[a-z']+/g) ?? []
  const compactLength = normalized.replace(/\s+/g, '').length
  const uniqueRatio =
    tokens.length === 0 ? 0 : new Set(tokens).size / Math.max(tokens.length, 1)

  const reasoningCues = [
    'because',
    'since',
    'therefore',
    'for example',
    'for instance',
    'i think',
    'i believe',
    'should',
    'must',
    'however',
  ]
  const hasReasoningCue = reasoningCues.some((cue) => normalized.includes(cue))

  // Extremely short content is always low-signal.
  if (compactLength < 40 || tokens.length < 8 || alphaTokens.length < 5) {
    return true
  }

  // If the student gave a reasonably long response, do not block analysis.
  if (tokens.length >= 35 || compactLength >= 180) {
    return false
  }

  // Mid-length responses with at least one reasoning cue should pass through.
  if (hasReasoningCue && tokens.length >= 12) {
    return false
  }

  // Only mark repetitive text as low-signal when still relatively short.
  if (tokens.length < 25 && uniqueRatio < 0.22) {
    return true
  }

  // Short responses without cues are often placeholder content.
  if (!hasReasoningCue && tokens.length < 16) {
    return true
  }

  return false
}

analyzeRouter.post('/analyze', async (request, response) => {
  const body = analyzeRequestSchema.safeParse(request.body)

  if (!body.success) {
    return response.status(400).json({
      message: `Invalid analyze payload: ${body.error.issues[0]?.message ?? 'unknown error'}`,
    })
  }

  if (isLowSignalTranscript(body.data.transcript)) {
    return response.json({ ...fallbackAnalyzeLowSignal(body.data), source: 'mock' })
  }

  const result = await generateStructuredWithFallback({
    schema: analyzeResponseSchema,
    prompts: buildAnalyzePrompts(body.data),
    fallback: () => fallbackAnalyze(body.data),
    endpoint: 'analyze',
    formatSchema: analyzeFormatSchema,
    requestPayload: body.data,
  })

  if (result.warning) {
    console.warn(result.warning)
  }

  return response.json({ ...result.data, source: result.source })
})

export { analyzeRouter }
