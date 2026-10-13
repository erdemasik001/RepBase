import type { Address, Chain } from 'viem'
import { anvil, monad, monadTestnet } from 'viem/chains'

const MONADVISION = { name: 'MonadVision', url: 'https://monadvision.com' }
const MONADVISION_TESTNET = { name: 'MonadVision', url: 'https://testnet.monadvision.com' }

// MonadVision is the explorer the contract is verified on (via Sourcify), so link there.
const networks: Record<string, Chain> = {
  testnet: { ...monadTestnet, blockExplorers: { default: MONADVISION_TESTNET } },
  mainnet: { ...monad, blockExplorers: { default: MONADVISION } },
  local: anvil,
}

const networkName = import.meta.env.VITE_NETWORK || 'testnet'

export const chain = networks[networkName] ?? networks.testnet
export const isLocal = networkName === 'local'
export const rpcUrl: string = import.meta.env.VITE_RPC_URL || chain.rpcUrls.default.http[0]
export const registryAddress = (import.meta.env.VITE_REGISTRY_ADDRESS || undefined) as Address | undefined

/** Anvil's unlocked default accounts, offered as one-click wallets on a local chain. */
export const devAccounts: { label: string; address: Address }[] = isLocal
  ? [
      { label: 'Dev wallet A', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
      { label: 'Dev wallet B', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { label: 'Dev wallet C', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
    ]
  : []

export function explorerLink(kind: 'tx' | 'address', value: string) {
  const explorer = chain.blockExplorers?.default.url
  return explorer ? `${explorer}/${kind}/${value}` : undefined
}

/** How often on-chain reads are refreshed. Monad's blocks are sub-second, so 1s keeps the UI live. */
export const POLL_INTERVAL_MS = 1_000
