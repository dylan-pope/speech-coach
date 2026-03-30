import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface StatusPillProps {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

const toneStyles = {
  neutral: 'bg-paper text-ink',
  success: 'bg-lime text-ink',
  warning: 'bg-orange-argument text-ink',
  error: 'bg-red-signal text-paper',
} as const

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border-2 border-ink px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  )
}
