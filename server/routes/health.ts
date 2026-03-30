import { Router } from 'express'
import { checkOllamaHealth } from '../services/ollama'

const healthRouter = Router()

healthRouter.get('/health', async (_, response) => {
  const status = await checkOllamaHealth()

  if (status.healthy) {
    return response.json({ status: 'ok', model: status.model })
  }

  return response.status(503).json({
    status: 'offline',
    model: status.model,
    message: status.message ?? 'Ollama is not available.',
  })
})

export { healthRouter }
