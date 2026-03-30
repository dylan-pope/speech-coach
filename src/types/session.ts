import type { AnalyzeResponse, Counterpoint, SessionSummaryResponse } from './feedback'

export interface PracticePrompt {
  id: string
  title: string
  body: string
}

export interface PracticeSession {
  id: string
  createdAt: string
  mode: 'full-local' | 'static-demo'
  prompt: PracticePrompt
  openingTranscript: string
  openingFeedback: AnalyzeResponse
  counterpoints: Counterpoint[]
  selectedCounterpoint: Counterpoint
  rebuttalTranscript: string
  finalSummary: SessionSummaryResponse
  reflection: string
}
