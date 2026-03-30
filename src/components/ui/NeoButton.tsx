import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-debate text-ink hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0',
  secondary:
    'bg-orange-argument text-ink hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0',
  ghost: 'bg-card text-ink hover:bg-paper',
  danger: 'bg-red-signal text-paper hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0',
}

export function NeoButton({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: NeoButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border-3 border-ink px-4 py-2 font-semibold uppercase tracking-wide shadow-neo-sm transition disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    />
  )
}
