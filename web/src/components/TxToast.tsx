import { explorerLink } from '../config'
import { useTx } from '../hooks/useTx'
import { ArrowUpRightIcon, BoltIcon, CloseIcon } from './icons'

function Spinner() {
  return <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-monad-soft border-t-transparent" />
}

function ExplorerLink({ hash }: { hash: string }) {
  const href = explorerLink('tx', hash)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 text-xs text-monad-soft hover:underline"
    >
      View transaction <ArrowUpRightIcon width={12} height={12} />
    </a>
  )
}

/** Follows the current transaction from signature to inclusion and reports how long it took. */
export function TxToast() {
  const { state, dismiss } = useTx()
  if (state.status === 'idle') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm animate-rise rounded-xl border border-line bg-ink-800 p-4 shadow-2xl shadow-black/60 sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 sm:w-80"
    >
      <div className="flex items-start gap-3">
        {(state.status === 'signing' || state.status === 'pending') && (
          <span className="mt-0.5">
            <Spinner />
          </span>
        )}
        {state.status === 'confirmed' && (
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mint/20 text-mint">
            <BoltIcon width={12} height={12} />
          </span>
        )}
        {state.status === 'failed' && (
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose/20 text-xs font-bold text-rose">
            !
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{state.label}</p>
          {state.status === 'signing' && <p className="mt-0.5 text-sm text-mist">Confirm in your wallet…</p>}
          {state.status === 'pending' && <p className="mt-0.5 text-sm text-mist">Waiting for inclusion…</p>}
          {state.status === 'confirmed' && (
            <p className="mt-0.5 text-sm text-mist">
              Confirmed in <span className="font-mono font-semibold text-mint">{state.ms} ms</span>
            </p>
          )}
          {state.status === 'failed' && <p className="mt-0.5 text-sm break-words text-rose">{state.message}</p>}
          {(state.status === 'pending' || state.status === 'confirmed') && (
            <p className="mt-1.5">
              <ExplorerLink hash={state.hash} />
            </p>
          )}
        </div>

        {(state.status === 'confirmed' || state.status === 'failed') && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="-m-1 rounded p-1 text-fog hover:bg-ink-700 hover:text-snow"
          >
            <CloseIcon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  )
}
