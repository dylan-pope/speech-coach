import { z } from 'zod'

export const analyzeRequestSchema = z.object({
  mode: z.enum(['opening', 'rebuttal']),
  promptTitle: z.string().min(3),
  promptBody: z.string().min(3),
  transcript: z.string().min(3),
})

export const analyzeResponseSchema = z.object({
  summary: z.string().min(8),
  rubric: z.object({
    claimClarity: z.object({
      level: z.enum(['strong', 'developing', 'emerging']),
      feedback: z.string().min(4),
    }),
    reasoning: z.object({
      level: z.enum(['strong', 'developing', 'emerging']),
      feedback: z.string().min(4),
    }),
    evidence: z.object({
      level: z.enum(['strong', 'developing', 'emerging']),
      feedback: z.string().min(4),
    }),
    organization: z.object({
      level: z.enum(['strong', 'developing', 'emerging']),
      feedback: z.string().min(4),
    }),
  }),
  strengths: z.array(z.string().min(2)).min(1),
  improvements: z.array(z.string().min(2)).min(1),
  coachQuestion: z.string().min(6),
})

export const counterpointRequestSchema = z.object({
  promptTitle: z.string().min(3),
  transcript: z.string().min(3),
})

export const counterpointResponseSchema = z.object({
  counterpoints: z
    .array(
      z.object({
        id: z.string().min(2),
        title: z.string().min(3),
        text: z.string().min(8),
      }),
    )
    .length(2),
})

export const sessionSummaryRequestSchema = z.object({
  promptTitle: z.string().min(3),
  openingTranscript: z.string().min(3),
  selectedCounterpoint: z.string().min(3),
  rebuttalTranscript: z.string().min(3),
})

export const sessionSummaryResponseSchema = z.object({
  overallAssessment: z.string().min(8),
  bestMoment: z.string().min(8),
  nextRep: z.string().min(8),
  reflectionPrompt: z.string().min(8),
})

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>
export type CounterpointRequest = z.infer<typeof counterpointRequestSchema>
export type CounterpointResponse = z.infer<typeof counterpointResponseSchema>
export type SessionSummaryRequest = z.infer<typeof sessionSummaryRequestSchema>
export type SessionSummaryResponse = z.infer<typeof sessionSummaryResponseSchema>
