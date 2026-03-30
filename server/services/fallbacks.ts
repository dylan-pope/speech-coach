import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CounterpointRequest,
  CounterpointResponse,
  SessionSummaryRequest,
  SessionSummaryResponse,
} from './schemas'

export function fallbackAnalyze(payload: AnalyzeRequest): AnalyzeResponse {
  return {
    summary: `Based on your response, your ${payload.mode} argument is clear but could use stronger evidence in the middle of your reasoning.`,
    rubric: {
      claimClarity: {
        level: 'strong',
        feedback: 'Your claim is visible early and stays consistent.',
      },
      reasoning: {
        level: 'developing',
        feedback: 'You provide causes and outcomes, but some logic jumps need one extra sentence.',
      },
      evidence: {
        level: 'emerging',
        feedback: 'Add one concrete classroom or real-world example to support your argument.',
      },
      organization: {
        level: 'developing',
        feedback: 'A clearer transition between points would improve structure.',
      },
    },
    strengths: ['Clear position', 'Relevant topic framing'],
    improvements: [
      'Add one specific example',
      'Explain why your evidence proves your claim',
      'Close with a sharper restatement',
    ],
    coachQuestion: 'What one example would make your strongest point harder to challenge?',
  }
}

export function fallbackCounterpoint(payload: CounterpointRequest): CounterpointResponse {
  return {
    counterpoints: [
      {
        id: 'cp1',
        title: 'Not all students benefit equally',
        text: `A likely counterpoint is that "${payload.promptTitle}" could help some students but create extra stress for others.`,
      },
      {
        id: 'cp2',
        title: 'Curriculum time tradeoff',
        text: 'A likely counterpoint is that schools may need to protect time for core subjects before adding new required activities.',
      },
    ],
  }
}

export function fallbackSessionSummary(payload: SessionSummaryRequest): SessionSummaryResponse {
  return {
    overallAssessment:
      'Based on your response, you improved by addressing the counterpoint directly instead of repeating your opening argument.',
    bestMoment: 'You answered a specific objection and kept your claim focused.',
    nextRep: 'Practice one 45-second rebuttal that includes one example and one comparison.',
    reflectionPrompt: `What sentence from your rebuttal to "${payload.selectedCounterpoint}" would you rewrite first?`,
  }
}
