import { Router } from 'express'
import { fallbackSessionSummary } from '../services/fallbacks'
import { generateStructuredWithFallback } from '../services/ollama'
import { buildSessionSummaryPrompts } from '../services/prompts'
import { sessionSummaryFormatSchema } from '../services/response-format'
import {
  sessionSummaryRequestSchema,
  sessionSummaryResponseSchema,
} from '../services/schemas'

const sessionSummaryRouter = Router()

sessionSummaryRouter.post('/session-summary', async (request, response) => {
  const body = sessionSummaryRequestSchema.safeParse(request.body)

  if (!body.success) {
    return response.status(400).json({
      message: `Invalid summary payload: ${body.error.issues[0]?.message ?? 'unknown error'}`,
    })
  }

  const result = await generateStructuredWithFallback({
    schema: sessionSummaryResponseSchema,
    prompts: buildSessionSummaryPrompts(body.data),
    fallback: () => fallbackSessionSummary(body.data),
    endpoint: 'session-summary',
    formatSchema: sessionSummaryFormatSchema,
    requestPayload: body.data,
  })

  if (result.warning) {
    console.warn(result.warning)
  }

  return response.json({ ...result.data, source: result.source })
})

export { sessionSummaryRouter }
