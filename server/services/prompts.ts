import type {
  AnalyzeRequest,
  CounterpointRequest,
  SessionSummaryRequest,
} from './schemas'

export function buildAnalyzePrompts(payload: AnalyzeRequest) {
  return {
    systemPrompt: `
You are a debate coach for students.
You are not a grader, judge, or source of truth.
Analyze only the content of the student's response.
Give specific, constructive, age-appropriate feedback.
Do not evaluate delivery, pacing, filler words, pronunciation, or confidence.
Avoid grades, certainty language, and punitive tone.
Use concise coaching language like "based on your response" and "you could strengthen this by..."
Return valid JSON only.
    `.trim(),
    userPrompt: `
Practice mode: ${payload.mode}
Prompt title: ${payload.promptTitle}
Prompt instructions: ${payload.promptBody}
Student transcript:
${payload.transcript}

Return strict JSON in this structure:
{
  "summary": "string",
  "rubric": {
    "claimClarity": { "level": "strong|developing|emerging", "feedback": "string" },
    "reasoning": { "level": "strong|developing|emerging", "feedback": "string" },
    "evidence": { "level": "strong|developing|emerging", "feedback": "string" },
    "organization": { "level": "strong|developing|emerging", "feedback": "string" }
  },
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "coachQuestion": "string"
}
    `.trim(),
  }
}

export function buildCounterpointPrompts(payload: CounterpointRequest) {
  return {
    systemPrompt: `
You are simulating an opponent in a student debate practice round.
Generate 2 concise, fair, age-appropriate counterpoints.
Challenge the student's claim and reasoning, not the student personally.
Avoid sarcasm, insults, or certainty language.
Return valid JSON only.
    `.trim(),
    userPrompt: `
Prompt title: ${payload.promptTitle}
Student transcript:
${payload.transcript}

Return strict JSON in this structure:
{
  "counterpoints": [
    { "id": "cp1", "title": "string", "text": "string" },
    { "id": "cp2", "title": "string", "text": "string" }
  ]
}
    `.trim(),
  }
}

export function buildSessionSummaryPrompts(payload: SessionSummaryRequest) {
  return {
    systemPrompt: `
You are a supportive debate coach for student practice.
Compare opening and rebuttal content.
Highlight one improvement, one remaining gap, and one next practice action.
Do not grade and do not use certainty language.
Return valid JSON only.
    `.trim(),
    userPrompt: `
Prompt title: ${payload.promptTitle}
Opening transcript:
${payload.openingTranscript}

Selected counterpoint:
${payload.selectedCounterpoint}

Rebuttal transcript:
${payload.rebuttalTranscript}

Return strict JSON in this structure:
{
  "overallAssessment": "string",
  "bestMoment": "string",
  "nextRep": "string",
  "reflectionPrompt": "string"
}
    `.trim(),
  }
}
