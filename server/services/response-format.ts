const rubricDimensionSchema = {
  type: 'object',
  properties: {
    level: {
      type: 'string',
      enum: ['strong', 'developing', 'emerging'],
    },
    feedback: {
      type: 'string',
    },
  },
  required: ['level', 'feedback'],
  additionalProperties: false,
}

export const analyzeFormatSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    rubric: {
      type: 'object',
      properties: {
        claimClarity: rubricDimensionSchema,
        reasoning: rubricDimensionSchema,
        evidence: rubricDimensionSchema,
        organization: rubricDimensionSchema,
      },
      required: ['claimClarity', 'reasoning', 'evidence', 'organization'],
      additionalProperties: false,
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
    },
    coachQuestion: { type: 'string' },
  },
  required: ['summary', 'rubric', 'strengths', 'improvements', 'coachQuestion'],
  additionalProperties: false,
}

export const counterpointFormatSchema = {
  type: 'object',
  properties: {
    counterpoints: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['id', 'title', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['counterpoints'],
  additionalProperties: false,
}

export const sessionSummaryFormatSchema = {
  type: 'object',
  properties: {
    overallAssessment: { type: 'string' },
    bestMoment: { type: 'string' },
    nextRep: { type: 'string' },
    reflectionPrompt: { type: 'string' },
  },
  required: ['overallAssessment', 'bestMoment', 'nextRep', 'reflectionPrompt'],
  additionalProperties: false,
}
