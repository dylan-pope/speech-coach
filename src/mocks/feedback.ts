import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CounterpointRequest,
  CounterpointResponse,
  SessionSummaryRequest,
  SessionSummaryResponse,
} from '../types/feedback'

export function mockAnalyzeResponse(input: AnalyzeRequest): AnalyzeResponse {
  return {
    summary: `Based on your response, your ${input.mode} round shows a clear direction but needs sharper support in the middle.`,
    rubric: {
      claimClarity: {
        level: 'strong',
        feedback: 'Your position appears early and stays consistent.',
      },
      reasoning: {
        level: 'developing',
        feedback: 'You connect your claim to outcomes, but some steps are still implied.',
      },
      evidence: {
        level: 'emerging',
        feedback: 'Add one concrete example or fact to anchor your argument.',
      },
      organization: {
        level: 'developing',
        feedback: 'A stronger signpost between points would improve flow.',
      },
    },
    strengths: ['Clear stance', 'School-relevant framing', 'Respectful tone'],
    improvements: [
      'Add one specific example',
      'Explain why the evidence proves your claim',
      'Use a tighter closing line',
    ],
    coachQuestion: 'What one example would make your strongest point harder to dismiss?',
    source: 'mock',
  }
}

export function mockCounterpoints(input: CounterpointRequest): CounterpointResponse {
  return {
    counterpoints: [
      {
        id: 'cp1',
        title: 'Implementation burden',
        text: `A likely counterpoint is that "${input.promptTitle}" sounds good in theory, but schools may lack time and staff to implement it well.`,
      },
      {
        id: 'cp2',
        title: 'Uneven student impact',
        text: 'A likely counterpoint is that one policy can affect students differently and could create extra stress for some groups.',
      },
    ],
    source: 'mock',
  }
}

export function mockSessionSummary(input: SessionSummaryRequest): SessionSummaryResponse {
  return {
    overallAssessment:
      'Based on your response, you improved by engaging the counterpoint directly instead of repeating your opening claim.',
    bestMoment:
      'You addressed the opposing concern with a direct explanation instead of avoiding it.',
    nextRep:
      'In your next rep, add one concrete example within your first two rebuttal sentences.',
    reflectionPrompt: `What is one sentence in your rebuttal ("${input.rebuttalTranscript.slice(0, 42)}...") that you would rewrite to be more specific?`,
    source: 'mock',
  }
}
