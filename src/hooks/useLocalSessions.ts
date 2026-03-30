import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import type { PracticeSession } from '../types/session'

function loadSessions(): PracticeSession[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.sessions)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as PracticeSession[]
  } catch {
    return []
  }
}

export function useLocalSessions() {
  const [sessions, setSessions] = useState<PracticeSession[]>(loadSessions)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions))
  }, [sessions])

  function upsertSession(nextSession: PracticeSession) {
    setSessions((current) => {
      const withoutCurrent = current.filter((session) => session.id !== nextSession.id)
      return [nextSession, ...withoutCurrent].slice(0, 12)
    })
  }

  function updateReflection(sessionId: string, reflection: string) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, reflection } : session,
      ),
    )
  }

  function getSessionById(sessionId: string) {
    return sessions.find((session) => session.id === sessionId) ?? null
  }

  return { sessions, upsertSession, updateReflection, getSessionById }
}
