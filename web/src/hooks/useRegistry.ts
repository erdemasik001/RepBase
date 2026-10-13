import { useReadContract } from 'wagmi'
import { agentRegistryAbi } from '../abi/AgentRegistry'
import { chain, POLL_INTERVAL_MS, registryAddress } from '../config'
import type { Agent, Task } from '../types'

const AGENT_PAGE_SIZE = 200n
const RECENT_TASKS = 100n

const NO_AGENTS: readonly Agent[] = []
const NO_TASKS: readonly Task[] = []

/** Live snapshot of the registry, refreshed every poll interval. Works without a wallet. */
export function useRegistry() {
  const contract = { address: registryAddress, abi: agentRegistryAbi, chainId: chain.id } as const
  const query = { enabled: Boolean(registryAddress), refetchInterval: POLL_INTERVAL_MS }

  const agents = useReadContract({ ...contract, functionName: 'getAgents', args: [0n, AGENT_PAGE_SIZE], query })
  const tasks = useReadContract({ ...contract, functionName: 'getRecentTasks', args: [RECENT_TASKS], query })

  return {
    agents: agents.data ?? NO_AGENTS,
    tasks: tasks.data ?? NO_TASKS,
    isLoading: agents.isLoading || tasks.isLoading,
    error: agents.error ?? tasks.error,
  }
}
