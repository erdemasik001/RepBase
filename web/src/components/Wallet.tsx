import { useState } from 'react'
import { type Connector, useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { chain, devAccounts } from '../config'
import { describeError } from '../lib/errors'
import { shortAddress } from '../lib/format'
import { ChevronRightIcon } from './icons'
import { Button, Modal } from './ui'

type WalletOption = { connector: Connector; label: string; detail?: string }

function useWalletOptions(): WalletOption[] {
  const { connectors } = useConnect()

  // Wallets announced through EIP-6963 carry their own name; fall back to the generic
  // injected connector only when a provider exists but did not announce itself.
  const announced = connectors.filter((connector) => connector.type === 'injected' && connector.id !== 'injected')
  const generic = connectors.find((connector) => connector.id === 'injected')
  const browserWallets = announced.length > 0 ? announced : generic && 'ethereum' in window ? [generic] : []

  const devWallets = connectors.filter((connector) => connector.type === 'mock')

  return [
    ...browserWallets.map((connector) => ({
      connector,
      label: connector.id === 'injected' ? 'Browser wallet' : connector.name,
    })),
    ...devWallets.map((connector, index) => ({
      connector,
      label: devAccounts[index].label,
      detail: shortAddress(devAccounts[index].address),
    })),
  ]
}

export function WalletButton({ onOpen }: { onOpen: () => void }) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 text-base font-medium whitespace-nowrap hover:text-mist"
      >
        Connect wallet
        <ChevronRightIcon />
      </button>
    )
  }

  if (chainId !== chain.id) {
    return (
      <Button
        size="sm"
        className="border-amber/50 text-amber"
        disabled={isPending}
        onClick={() => switchChain({ chainId: chain.id })}
      >
        Switch to {chain.name}
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={onOpen} className="font-mono">
      <span className="size-1.5 rounded-full bg-mint" />
      {shortAddress(address)}
    </Button>
  )
}

export function WalletModal({ onClose }: { onClose: () => void }) {
  const options = useWalletOptions()
  const { address, connector: activeConnector, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const [pendingUid, setPendingUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function connect(option: WalletOption) {
    setError(null)
    setPendingUid(option.connector.uid)
    try {
      if (isConnected) await disconnectAsync()
      await connectAsync({ connector: option.connector, chainId: chain.id })
      onClose()
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setPendingUid(null)
    }
  }

  return (
    <Modal title={isConnected ? 'Wallet.' : 'Connect a wallet.'} onClose={onClose}>
      {isConnected && address && (
        <div className="mb-5 flex items-center justify-between gap-3 border border-line bg-ink-950 px-4 py-3">
          <div className="min-w-0">
            <p className="eyebrow">Connected</p>
            <p className="mt-1 truncate font-mono text-sm">{address}</p>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              await disconnectAsync()
              onClose()
            }}
          >
            Disconnect
          </Button>
        </div>
      )}

      {options.length === 0 ? (
        <p className="text-mist">
          No browser wallet was found.{' '}
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-snow underline">
            Install MetaMask
          </a>{' '}
          and reload the page.
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((option) => {
            const active = isConnected && option.connector.uid === activeConnector?.uid
            return (
              <li key={option.connector.uid}>
                <button
                  type="button"
                  disabled={active || pendingUid !== null}
                  onClick={() => connect(option)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="font-mono text-xs text-fog">
                    {pendingUid === option.connector.uid ? 'Connecting…' : active ? 'Active' : option.detail}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {error && <p className="mt-4 text-sm text-rose">{error}</p>}
      <p className="mt-5 text-sm text-fog">RepBase runs on {chain.name}. You will be asked to switch if needed.</p>
    </Modal>
  )
}
