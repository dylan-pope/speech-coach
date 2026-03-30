import type { PracticePrompt } from '../types/session'

export const seededPrompts: PracticePrompt[] = [
  {
    id: 'debate-required',
    title: 'Schools should require debate for all students.',
    body: 'Defend or challenge this claim using reasons and at least one concrete example.',
  },
  {
    id: 'social-media',
    title: 'Social media does more harm than good for teens.',
    body: 'Take a position and explain both impact and tradeoffs for students.',
  },
  {
    id: 'homework-limits',
    title: 'Homework should be limited in middle school.',
    body: 'Argue for or against limits and support your claim with realistic school scenarios.',
  },
  {
    id: 'uniforms',
    title: 'School uniforms improve school culture.',
    body: 'Defend or challenge this claim with at least two reasons.',
  },
  {
    id: 'ai-in-classrooms',
    title: 'AI tools should be allowed in classrooms with limits.',
    body: 'Take a clear stance and explain what limits would make your position stronger.',
  },
  {
    id: 'later-start',
    title: 'Students should have a later school start time.',
    body: 'Argue your position and include at least one evidence-style example.',
  },
  {
    id: 'phone-ban',
    title: 'Phones should be banned during the school day.',
    body: 'Choose a side and address one likely concern from the other side.',
  },
  {
    id: 'service-learning',
    title: 'Community service should be a graduation requirement.',
    body: 'Build a case and explain how schools could apply the policy fairly.',
  },
]
