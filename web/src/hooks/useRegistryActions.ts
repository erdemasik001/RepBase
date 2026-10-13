import { useWriteContract } from 'wagmi'
import { agentRegistryAbi } from '../abi/AgentRegistry'
import { chain, registryAddress } from '../config'
import { useTx } from './useTx'

/** Wallet writes against the registry, each tracked through the shared transaction toast. */
export function useRegistryActions() {
  const { send } = useTx()
  const { writeContractAsync } = useWriteContract()
  const contract = { address: registryAddress!, abi: agentRegistryAbi, chainId: chain.id } as const

  return {
    register: (name: string, agentURI: string) =>
      send('Register agent', () =>
        writeContractAsync({ ...contract, functionName: 'register', args: [name, agentURI] }),
      ),
    createTask: (agentId: bigint, description: string) =>
      send('Assign task', () =>
        writeContractAsync({ ...contract, functionName: 'createTask', args: [agentId, description] }),
      ),
    completeTask: (taskId: bigint, result: string) =>
      send('Deliver task', () =>
        writeContractAsync({ ...contract, functionName: 'completeTask', args: [taskId, result] }),
      ),
    giveFeedback: (taskId: bigint, rating: number) =>
      send('Rate task', () =>
        writeContractAsync({ ...contract, functionName: 'giveFeedback', args: [taskId, rating] }),
      ),
  }
}
