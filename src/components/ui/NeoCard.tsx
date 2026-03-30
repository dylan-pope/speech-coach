import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface NeoCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'red' | 'blue' | 'orange' | 'teal' | 'lime' | 'steel' | 'none'
}

const accentStyles = {
  red: 'before:bg-red-signal',
  blue: 'before:bg-blue-debate',
  orange: 'before:bg-orange-argument',
  teal: 'before:bg-teal-coach',
  lime: 'before:bg-lime',
  steel: 'before:bg-steel',
  none: 'before:bg-transparent',
} as const

export function NeoCard({ className, accent = 'none', ...props }: NeoCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border-3 border-ink bg-card p-4 shadow-neo md:p-5',
        "before:absolute before:inset-x-0 before:top-0 before:h-2 before:content-['']",
        accentStyles[accent],
        className,
      )}
      {...props}
    />
  )
}
