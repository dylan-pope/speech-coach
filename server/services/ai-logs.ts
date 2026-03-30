import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const LOGS_DIR = path.resolve(process.cwd(), 'server', 'logs')
const LOG_FILE = path.join(LOGS_DIR, 'ollama-output.jsonl')

interface AiLogEntry {
  timestamp: string
  endpoint: string
  source: 'ollama' | 'mock'
  model: string
  attempt: number
  success: boolean
  error?: string
  warning?: string
  rawContent?: string
  parsedType?: string
  requestPayload?: unknown
}

export async function writeAiLog(entry: AiLogEntry) {
  try {
    await mkdir(LOGS_DIR, { recursive: true })
    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf-8')
  } catch (error) {
    console.error('Failed to write AI log:', error)
  }
}
