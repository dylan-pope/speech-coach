import {
  mockAnalyzeResponse,
  mockCounterpoints,
  mockSessionSummary,
} from '../mocks/feedback'
import { APP_MODE } from './constants'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CounterpointRequest,
  CounterpointResponse,
  SessionSummaryRequest,
  SessionSummaryResponse,
} from '../types/feedback'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

interface HealthResponse {
  status: 'ok' | 'offline'
  model: string
  message?: string
}

async function delay(ms: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function requestJson<TResponse>(
  path: string,
  payload?: unknown,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  })

  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const errorMessage =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: string }).message)
        : 'Unable to complete that request.'
    throw new Error(errorMessage)
  }

  return body as TResponse
}

export async function checkHealth(): Promise<HealthResponse> {
  if (APP_MODE === 'static-demo') {
    return { status: 'ok', model: 'mock' }
  }

  const response = await fetch(`${API_BASE}/api/health`)
  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (response.ok && body && typeof body === 'object') {
    return body as HealthResponse
  }

  if (
    body &&
    typeof body === 'object' &&
    'status' in body &&
    body.status === 'offline' &&
    'model' in body
  ) {
    return body as HealthResponse
  }

  const message =
    typeof body === 'object' && body && 'message' in body
      ? String((body as { message: string }).message)
      : 'Unable to contact local API health endpoint.'
  throw new Error(message)
}

export async function analyzeTranscript(
  payload: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  if (APP_MODE === 'static-demo') {
    await delay(450)
    return mockAnalyzeResponse(payload)
  }

  return requestJson<AnalyzeResponse>('/api/analyze', payload)
}

export async function generateCounterpoints(
  payload: CounterpointRequest,
): Promise<CounterpointResponse> {
  if (APP_MODE === 'static-demo') {
    await delay(350)
    return mockCounterpoints(payload)
  }

  return requestJson<CounterpointResponse>('/api/counterpoint', payload)
}

export async function generateSessionSummary(
  payload: SessionSummaryRequest,
): Promise<SessionSummaryResponse> {
  if (APP_MODE === 'static-demo') {
    await delay(500)
    return mockSessionSummary(payload)
  }

  return requestJson<SessionSummaryResponse>('/api/session-summary', payload)
}
