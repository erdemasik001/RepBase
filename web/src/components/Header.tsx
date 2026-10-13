import { useBlockNumber } from 'wagmi'
import { chain, explorerLink, registryAddress } from '../config'
import { WalletButton } from './Wallet'

function NetworkStatus() {
  const { data: blockNumber } = useBlockNumber({ chainId: chain.id, watch: true })

  return (
    <div className="hidden items-center gap-2 font-mono text-xs text-fog lg:flex">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
      </span>
      {chain.name}
      {blockNumber !== undefined && <span className="tabular-nums">#{blockNumber.toLocaleString('en-US')}</span>}
    </div>
  )
}

export function Header({ onOpenWallet }: { onOpenWallet: () => void }) {
  const contractLink = registryAddress && explorerLink('address', registryAddress)

  return (
    <header className="flex items-center justify-between gap-6 py-8">
      <a href="/" className="flex items-center gap-3 text-lg font-medium tracking-wide">
        <img src="/logo.png" alt="" width={36} height={36} className="size-9" />
        REPBASE
      </a>
      <nav className="hidden items-center gap-10 text-sm md:flex" aria-label="Sections">
        <a href="#leaderboard" className="hover:text-mist">
          Leaderboard
        </a>
        <a href="#how-it-works" className="hover:text-mist">
          How it works
        </a>
        {contractLink && (
          <a href={contractLink} target="_blank" rel="noreferrer" className="hover:text-mist">
            Contract
          </a>
        )}
      </nav>
      <div className="flex items-center gap-6">
        <NetworkStatus />
        <WalletButton onOpen={onOpenWallet} />
      </div>
    </header>
  )
}
