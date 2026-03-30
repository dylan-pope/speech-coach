import { Router } from 'express'
import { fallbackCounterpoint } from '../services/fallbacks'
import { generateStructuredWithFallback } from '../services/ollama'
import { buildCounterpointPrompts } from '../services/prompts'
import { counterpointRequestSchema, counterpointResponseSchema } from '../services/schemas'

const counterpointRouter = Router()

counterpointRouter.post('/counterpoint', async (request, response) => {
  const body = counterpointRequestSchema.safeParse(request.body)

  if (!body.success) {
    return response.status(400).json({
      message: `Invalid counterpoint payload: ${body.error.issues[0]?.message ?? 'unknown error'}`,
    })
  }

  const result = await generateStructuredWithFallback({
    schema: counterpointResponseSchema,
    prompts: buildCounterpointPrompts(body.data),
    fallback: () => fallbackCounterpoint(body.data),
  })

  if (result.warning) {
    console.warn(result.warning)
  }

  return response.json({ ...result.data, source: result.source })
})

export { counterpointRouter }
