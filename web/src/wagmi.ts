import { createConfig, http } from 'wagmi'
import { injected, mock } from 'wagmi/connectors'
import { chain, devAccounts, POLL_INTERVAL_MS, rpcUrl } from './config'

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [
    injected(),
    ...devAccounts.map((account) => mock({ accounts: [account.address], features: { reconnect: true } })),
  ],
  transports: { [chain.id]: http(rpcUrl) },
  pollingInterval: POLL_INTERVAL_MS,
})
