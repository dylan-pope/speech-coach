export type RubricLevel = 'strong' | 'developing' | 'emerging'

export type AnalyzeMode = 'opening' | 'rebuttal'

export interface RubricDimension {
  level: RubricLevel
  feedback: string
}

export interface AnalyzeResponse {
  summary: string
  rubric: {
    claimClarity: RubricDimension
    reasoning: RubricDimension
    evidence: RubricDimension
    organization: RubricDimension
  }
  strengths: string[]
  improvements: string[]
  coachQuestion: string
  source?: 'ollama' | 'mock'
}

export interface Counterpoint {
  id: string
  title: string
  text: string
}

export interface CounterpointResponse {
  counterpoints: Counterpoint[]
  source?: 'ollama' | 'mock'
}

export interface SessionSummaryResponse {
  overallAssessment: string
  bestMoment: string
  nextRep: string
  reflectionPrompt: string
  source?: 'ollama' | 'mock'
}

export interface AnalyzeRequest {
  mode: AnalyzeMode
  promptTitle: string
  promptBody: string
  transcript: string
}

export interface CounterpointRequest {
  promptTitle: string
  transcript: string
}

export interface SessionSummaryRequest {
  promptTitle: string
  openingTranscript: string
  selectedCounterpoint: string
  rebuttalTranscript: string
}
