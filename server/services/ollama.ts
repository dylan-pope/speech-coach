import { z } from 'zod'

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
    return JSON.parse(content)
  } catch {
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1))
    }
    throw new Error('AI response did not contain valid JSON.')
  }
}

async function requestOllamaJson(prompts: PromptPair) {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: 'json',
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

  return parseJsonFromContent(content)
}

export async function generateStructuredWithFallback<TOutput>(options: {
  schema: z.ZodType<TOutput>
  prompts: PromptPair
  fallback: () => TOutput
}): Promise<StructuredGenerationResult<TOutput>> {
  let lastError = 'Unknown AI error.'

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const generated = await requestOllamaJson(options.prompts)
      const parsed = options.schema.safeParse(generated)

      if (!parsed.success) {
        throw new Error(`Schema mismatch: ${parsed.error.issues[0]?.message ?? 'invalid output'}`)
      }

      return { data: parsed.data, source: 'ollama' }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown AI error.'
    }
  }

  return {
    data: options.fallback(),
    source: 'mock',
    warning: `Fell back to mock output: ${lastError}`,
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
