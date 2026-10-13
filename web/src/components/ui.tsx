import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react'
import { explorerLink } from '../config'
import { cx } from '../lib/classes'
import { shortAddress } from '../lib/format'
import { CloseIcon, StarIcon } from './icons'

const BUTTON_VARIANTS = {
  primary: 'bg-monad text-white hover:bg-monad-soft hover:text-ink-950',
  secondary: 'border border-line bg-ink-800 text-snow hover:bg-ink-700',
  ghost: 'text-fog hover:text-snow hover:bg-ink-800',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monad-soft',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-ink-900/80 p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-mist uppercase">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md animate-rise rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl shadow-black/60"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-m-1 rounded-md p-1 text-fog transition-colors hover:bg-ink-800 hover:text-snow"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-medium text-mist">
        {label}
        {hint && <span className="font-normal text-fog">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

/** Address shown short, linking to the explorer when the network has one. */
export function AddressLabel({ address, you }: { address: string; you?: boolean }) {
  const href = explorerLink('address', address)
  const text = you ? 'You' : shortAddress(address)
  if (!href) return <span className="font-mono">{text}</span>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-mono hover:text-snow hover:underline">
      {text}
    </a>
  )
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          width={size}
          height={size}
          filled={star <= value}
          className={star <= value ? 'text-amber' : 'text-ink-600'}
        />
      ))}
    </span>
  )
}

export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          className={cx(
            'rounded p-0.5 transition-transform hover:scale-110',
            star <= value ? 'text-amber' : 'text-ink-600 hover:text-fog',
          )}
        >
          <StarIcon width={22} height={22} filled={star <= value} />
        </button>
      ))}
    </div>
  )
}
