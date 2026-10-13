import { explorerLink } from '../config'
import { useTx } from '../hooks/useTx'
import { ArrowUpRightIcon, BoltIcon, CloseIcon } from './icons'

function Spinner() {
  return <span className="block size-4 animate-spin rounded-full border-2 border-snow border-t-transparent" />
}

function ExplorerLink({ hash }: { hash: string }) {
  const href = explorerLink('tx', hash)
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:text-mist">
      View transaction <ArrowUpRightIcon width={13} height={13} />
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
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm animate-rise border border-line bg-ink-900 shadow-2xl shadow-black sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 sm:w-88"
    >
      <span className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-orchid to-monad" />
      <div className="flex items-start gap-3 p-5">
        <span className="mt-1 shrink-0">
          {(state.status === 'signing' || state.status === 'pending') && <Spinner />}
          {state.status === 'confirmed' && <BoltIcon className="text-mint" />}
          {state.status === 'failed' && <CloseIcon className="text-rose" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="eyebrow">{state.label}</p>
          {state.status === 'signing' && <p className="mt-1 text-mist">Confirm in your wallet…</p>}
          {state.status === 'pending' && <p className="mt-1 text-mist">Waiting for inclusion…</p>}
          {state.status === 'confirmed' && (
            <p className="mt-1 text-mist">
              Confirmed in{' '}
              <span className="font-display text-2xl leading-none font-black text-chrome">{state.ms} ms</span>
            </p>
          )}
          {state.status === 'failed' && <p className="mt-1 break-words text-rose">{state.message}</p>}
          {(state.status === 'pending' || state.status === 'confirmed') && (
            <p className="mt-2">
              <ExplorerLink hash={state.hash} />
            </p>
          )}
        </div>

        {(state.status === 'confirmed' || state.status === 'failed') && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="-m-1 p-1 text-fog hover:text-snow"
          >
            <CloseIcon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  )
}
