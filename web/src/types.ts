import type { ReadContractReturnType } from 'viem'
import type { agentRegistryAbi } from './abi/AgentRegistry'

export type Agent = ReadContractReturnType<typeof agentRegistryAbi, 'getAgent'>
export type Task = ReadContractReturnType<typeof agentRegistryAbi, 'getTask'>

// Mirrors AgentRegistry.TaskStatus
export const TaskStatus = { Open: 0, Completed: 1, Rated: 2 } as const
