import { z } from 'zod'
import { writeAiLog } from './ai-logs'

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434/api/chat'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2'

interface PromptPair {
  systemPrompt: string
  userPrompt: string
}

interface StructuredGenerationResult<TOutput> {
  data: TOutput
  source: 'ollama' | 'mock'
  warning?: string
}

function extractAndParseEmbeddedObject(text: string) {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null
  }

  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1))
  } catch {
    return null
  }
}

function normalizeJsonValue(value: unknown) {
  let current = value

  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== 'string') {
      return current
    }

    const trimmed = current.trim()
    if (!trimmed) {
      return trimmed
    }

    const looksLikeJsonEnvelope =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))

    if (looksLikeJsonEnvelope) {
      try {
        current = JSON.parse(trimmed)
        continue
      } catch {
        return current
      }
    }

    const embeddedObject = extractAndParseEmbeddedObject(trimmed)
    if (embeddedObject !== null) {
      current = embeddedObject
      continue
    }

    return current
  }

  return current
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseJsonFromContent(content: string) {
  try {
    return normalizeJsonValue(JSON.parse(content))
  } catch {
    const embeddedObject = extractAndParseEmbeddedObject(content)
    if (embeddedObject !== null) {
      return normalizeJsonValue(embeddedObject)
    }
    throw new Error('AI response did not contain valid JSON.')
  }
}

async function requestOllamaJson(
  prompts: PromptPair,
  formatSchema?: Record<string, unknown>,
) {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: formatSchema ?? 'json',
      options: {
        temperature: 0.1,
      },
      messages: [
        { role: 'system', content: prompts.systemPrompt },
        { role: 'user', content: prompts.userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const details = await readJsonResponse(response)
    const errorMessage =
      typeof details === 'object' && details && 'error' in details
        ? String((details as { error: string }).error)
        : `Ollama request failed with status ${response.status}.`
    throw new Error(errorMessage)
  }

  const payload = (await response.json()) as { message?: { content?: string } }
  const content = payload.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ollama returned an empty response.')
  }

  return {
    rawContent: content,
    parsed: parseJsonFromContent(content),
  }
}

export async function generateStructuredWithFallback<TOutput>(options: {
  schema: z.ZodType<TOutput>
  prompts: PromptPair
  fallback: () => TOutput
  endpoint: 'analyze' | 'counterpoint' | 'session-summary'
  formatSchema?: Record<string, unknown>
  requestPayload?: unknown
}): Promise<StructuredGenerationResult<TOutput>> {
  let lastError = 'Unknown AI error.'

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let rawContent: string | undefined
    let parsedType: string | undefined
    try {
      const ollamaResponse = await requestOllamaJson(options.prompts, options.formatSchema)
      rawContent = ollamaResponse.rawContent
      let normalized = normalizeJsonValue(ollamaResponse.parsed)
      let parsed = options.schema.safeParse(normalized)
      parsedType = Array.isArray(normalized) ? 'array' : typeof normalized

      if (!parsed.success && typeof normalized === 'string') {
        try {
          normalized = parseJsonFromContent(normalized)
          parsed = options.schema.safeParse(normalized)
          parsedType = Array.isArray(normalized) ? 'array' : typeof normalized
        } catch {
          // keep original parse error path
        }
      }

      if (!parsed.success) {
        throw new Error(`Schema mismatch: ${parsed.error.issues[0]?.message ?? 'invalid output'}`)
      }

      await writeAiLog({
        timestamp: new Date().toISOString(),
        endpoint: options.endpoint,
        source: 'ollama',
        model: OLLAMA_MODEL,
        attempt: attempt + 1,
        success: true,
        rawContent,
        parsedType,
        requestPayload: options.requestPayload,
      })

      return { data: parsed.data, source: 'ollama' }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown AI error.'

      await writeAiLog({
        timestamp: new Date().toISOString(),
        endpoint: options.endpoint,
        source: 'ollama',
        model: OLLAMA_MODEL,
        attempt: attempt + 1,
        success: false,
        error: lastError,
        rawContent,
        parsedType,
        requestPayload: options.requestPayload,
      })
    }
  }

  const warning = `Fell back to mock output: ${lastError}`
  await writeAiLog({
    timestamp: new Date().toISOString(),
    endpoint: options.endpoint,
    source: 'mock',
    model: OLLAMA_MODEL,
    attempt: 3,
    success: false,
    warning,
    error: lastError,
    requestPayload: options.requestPayload,
  })

  return {
    data: options.fallback(),
    source: 'mock',
    warning,
  }
}

export async function checkOllamaHealth() {
  const tagsUrl = OLLAMA_URL.replace('/api/chat', '/api/tags')
  try {
    const response = await fetch(tagsUrl)
    if (!response.ok) {
      return {
        healthy: false,
        message: `Ollama health check failed with status ${response.status}.`,
        model: OLLAMA_MODEL,
      }
    }

    return {
      healthy: true,
      model: OLLAMA_MODEL,
    }
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Unable to reach Ollama.',
      model: OLLAMA_MODEL,
    }
  }
}
