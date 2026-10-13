import { createContext, useContext } from 'react'
import type { Hash } from 'viem'

export type TxState =
  | { status: 'idle' }
  | { status: 'signing'; label: string }
  | { status: 'pending'; label: string; hash: Hash }
  | { status: 'confirmed'; label: string; hash: Hash; ms: number }
  | { status: 'failed'; label: string; message: string }

export type TxContextValue = {
  state: TxState
  /** True while a transaction is waiting for a signature or a receipt. */
  busy: boolean
  /** Time from broadcast to receipt of the latest confirmed transaction. */
  lastConfirmationMs: number | null
  /** Runs a wallet write and tracks it until it is included. Resolves to whether it succeeded. */
  send: (label: string, write: () => Promise<Hash>) => Promise<boolean>
  dismiss: () => void
}

export const TxContext = createContext<TxContextValue | null>(null)

export function useTx() {
  const value = useContext(TxContext)
  if (!value) throw new Error('useTx must be used inside <TxProvider>')
  return value
}
