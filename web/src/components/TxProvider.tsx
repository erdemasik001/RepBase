import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type Hash, TransactionReceiptNotFoundError } from 'viem'
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi'
import { chain } from '../config'
import { TxContext, type TxState } from '../hooks/useTx'
import { describeError } from '../lib/errors'

const RECEIPT_POLL_MS = 100
const RECEIPT_TIMEOUT_MS = 60_000
const DISMISS_AFTER_MS = 8_000

export function TxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TxState>({ status: 'idle' })
  const [lastConfirmationMs, setLastConfirmationMs] = useState<number | null>(null)

  const { chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: chain.id })
  const queryClient = useQueryClient()

  const send = useCallback(
    async (label: string, write: () => Promise<Hash>) => {
      try {
        if (!publicClient) throw new Error('No RPC client available.')
        setState({ status: 'signing', label })
        if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id })

        const hash = await write()
        const broadcastAt = performance.now()
        setState({ status: 'pending', label, hash })

        // Poll tightly instead of waiting for block ticks: on Monad the receipt
        // is usually available within a block or two of broadcast.
        for (;;) {
          try {
            const receipt = await publicClient.getTransactionReceipt({ hash })
            if (receipt.status !== 'success') throw new Error('Transaction reverted on-chain.')
            break
          } catch (error) {
            if (!(error instanceof TransactionReceiptNotFoundError)) throw error
            if (performance.now() - broadcastAt > RECEIPT_TIMEOUT_MS) throw new Error('Timed out waiting for the receipt.')
            await new Promise((resolve) => setTimeout(resolve, RECEIPT_POLL_MS))
          }
        }

        const ms = Math.round(performance.now() - broadcastAt)
        setLastConfirmationMs(ms)
        setState({ status: 'confirmed', label, hash, ms })
        await queryClient.invalidateQueries()
        return true
      } catch (error) {
        setState({ status: 'failed', label, message: describeError(error) })
        return false
      }
    },
    [chainId, publicClient, queryClient, switchChainAsync],
  )

  const dismiss = useCallback(() => setState({ status: 'idle' }), [])

  useEffect(() => {
    if (state.status !== 'confirmed' && state.status !== 'failed') return
    const timer = setTimeout(dismiss, DISMISS_AFTER_MS)
    return () => clearTimeout(timer)
  }, [state, dismiss])

  const value = useMemo(
    () => ({
      state,
      busy: state.status === 'signing' || state.status === 'pending',
      lastConfirmationMs,
      send,
      dismiss,
    }),
    [state, lastConfirmationMs, send, dismiss],
  )

  return <TxContext.Provider value={value}>{children}</TxContext.Provider>
}
