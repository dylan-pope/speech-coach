import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../lib/constants'
import { cn } from '../../lib/cn'

interface AppFrameProps {
  children: ReactNode
  className?: string
}

export function AppFrame({ children, className }: AppFrameProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b-4 border-ink bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            className="font-display text-sm uppercase tracking-[0.2em] hover:text-red-signal"
            to="/"
          >
            Civic Debate Academy
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide md:gap-4">
            <Link
              className="rounded-md border-2 border-ink bg-lime px-3 py-1.5 shadow-neo-sm transition-transform hover:-translate-y-0.5"
              to="/practice"
            >
              Practice
            </Link>
            <span className="hidden text-steel md:block">{APP_NAME}</span>
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto w-full max-w-7xl px-4 py-8 md:px-8', className)}>
        {children}
      </main>
    </div>
  )
}
