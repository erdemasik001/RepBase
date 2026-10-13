import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react'
import { explorerLink } from '../config'
import { cx } from '../lib/classes'
import { shortAddress } from '../lib/format'
import { CloseIcon, StarIcon } from './icons'

const BUTTON_VARIANTS = {
  primary: 'bg-chrome text-ink-950 hover:brightness-110',
  secondary: 'border border-white/25 text-snow hover:bg-white/10',
  ghost: 'text-mist hover:text-snow',
}

const BUTTON_SIZES = {
  sm: 'h-9 rounded-lg px-5 text-sm',
  md: 'h-11 rounded-xl px-7 text-sm',
  lg: 'h-14 rounded-2xl px-10 text-base',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-snow',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-ink-900 p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
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
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md animate-rise border border-line bg-ink-900 p-7 shadow-2xl shadow-black"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight font-extrabold text-chrome">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-m-1 p-1 text-fog transition-colors hover:text-snow"
          >
            <CloseIcon width={18} height={18} />
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
      <span className="mb-2 flex items-baseline justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {hint && <span className="text-xs text-fog">{hint}</span>}
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
            'p-0.5 transition-transform hover:scale-110',
            star <= value ? 'text-amber' : 'text-ink-600 hover:text-fog',
          )}
        >
          <StarIcon width={22} height={22} filled={star <= value} />
        </button>
      ))}
    </div>
  )
}
