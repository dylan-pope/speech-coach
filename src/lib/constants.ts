export const APP_NAME = 'Civic Debate Academy: Argument Coach'

export const STORAGE_KEYS = {
  sessions: 'argument-coach.sessions.v1',
  lastPromptId: 'argument-coach.lastPromptId.v1',
  preferredMode: 'argument-coach.preferredMode.v1',
} as const

export const APP_MODE: 'full-local' | 'static-demo' =
  import.meta.env.VITE_APP_MODE === 'static-demo' ? 'static-demo' : 'full-local'

export const IS_DEMO_MODE = APP_MODE === 'static-demo'
