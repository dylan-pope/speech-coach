import { Router } from 'express'
import { fallbackAnalyze } from '../services/fallbacks'
import { generateStructuredWithFallback } from '../services/ollama'
import { buildAnalyzePrompts } from '../services/prompts'
import { analyzeRequestSchema, analyzeResponseSchema } from '../services/schemas'

const analyzeRouter = Router()

analyzeRouter.post('/analyze', async (request, response) => {
  const body = analyzeRequestSchema.safeParse(request.body)

  if (!body.success) {
    return response.status(400).json({
      message: `Invalid analyze payload: ${body.error.issues[0]?.message ?? 'unknown error'}`,
    })
  }

  const result = await generateStructuredWithFallback({
    schema: analyzeResponseSchema,
    prompts: buildAnalyzePrompts(body.data),
    fallback: () => fallbackAnalyze(body.data),
  })

  if (result.warning) {
    console.warn(result.warning)
  }

  return response.json({ ...result.data, source: result.source })
})

export { analyzeRouter }
