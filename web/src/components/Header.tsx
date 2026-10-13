import { useBlockNumber } from 'wagmi'
import { chain } from '../config'
import { ShieldCheckIcon } from './icons'
import { WalletButton } from './Wallet'

function NetworkPill() {
  const { data: blockNumber } = useBlockNumber({ chainId: chain.id, watch: true })

  return (
    <div className="hidden items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-2 text-xs text-mist sm:flex">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-mint" />
      </span>
      {chain.name}
      {blockNumber !== undefined && (
        <span className="font-mono text-fog tabular-nums">#{blockNumber.toLocaleString('en-US')}</span>
      )}
    </div>
  )
}

export function Header({ onOpenWallet }: { onOpenWallet: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <a href="/" className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-monad text-white">
          <ShieldCheckIcon width={20} height={20} />
        </span>
        <span className="text-lg font-semibold tracking-tight">RepBase</span>
      </a>
      <div className="flex items-center gap-2">
        <NetworkPill />
        <WalletButton onOpen={onOpenWallet} />
      </div>
    </header>
  )
}
