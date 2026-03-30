import cors from 'cors'
import express from 'express'
import { analyzeRouter } from './routes/analyze'
import { counterpointRouter } from './routes/counterpoint'
import { healthRouter } from './routes/health'
import { sessionSummaryRouter } from './routes/session-summary'

const app = express()
const port = Number(process.env.SERVER_PORT ?? 8787)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/', (_, response) => {
  response.json({
    service: 'Civic Debate Academy local API',
    status: 'ready',
    endpoints: ['/api/health', '/api/analyze', '/api/counterpoint', '/api/session-summary'],
  })
})

app.use('/api', healthRouter)
app.use('/api', analyzeRouter)
app.use('/api', counterpointRouter)
app.use('/api', sessionSummaryRouter)

app.use((error: unknown, request: express.Request, response: express.Response) => {
  void request
  console.error('Unhandled API error:', error)
  response.status(500).json({
    message: 'Unexpected server error while generating coaching output.',
  })
})

app.listen(port, () => {
  console.log(`Local API server running on http://localhost:${port}`)
})
