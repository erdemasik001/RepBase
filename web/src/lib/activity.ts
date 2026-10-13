import type { Address } from 'viem'
import { type Agent, type Task, TaskStatus } from '../types'

export type Activity = {
  key: string
  kind: 'registered' | 'assigned' | 'delivered' | 'rated'
  timestamp: number
  actor: Address
  agentId: bigint
  agentName: string
  task?: Task
}

// Tie-breaker for events that land in the same second: later lifecycle stages first.
const STAGE = { registered: 0, assigned: 1, delivered: 2, rated: 3 } as const

/** Derives a chronological feed from contract state, so no log queries are needed. */
export function buildActivity(agents: readonly Agent[], tasks: readonly Task[], limit: number): Activity[] {
  const byId = new Map(agents.map((agent) => [agent.id, agent]))
  const items: Activity[] = []

  for (const agent of agents) {
    items.push({
      key: `agent-${agent.id}`,
      kind: 'registered',
      timestamp: Number(agent.registeredAt),
      actor: agent.owner,
      agentId: agent.id,
      agentName: agent.name,
    })
  }

  for (const task of tasks) {
    const agent = byId.get(task.agentId)
    const base = { agentId: task.agentId, agentName: agent?.name ?? `Agent #${task.agentId}`, task }

    items.push({ ...base, key: `task-${task.id}-assigned`, kind: 'assigned', timestamp: Number(task.createdAt), actor: task.client })
    if (task.status >= TaskStatus.Completed && agent) {
      items.push({ ...base, key: `task-${task.id}-delivered`, kind: 'delivered', timestamp: Number(task.completedAt), actor: agent.owner })
    }
    if (task.status === TaskStatus.Rated) {
      items.push({ ...base, key: `task-${task.id}-rated`, kind: 'rated', timestamp: Number(task.ratedAt), actor: task.client })
    }
  }

  return items
    .sort(
      (a, b) =>
        b.timestamp - a.timestamp ||
        Number((b.task?.id ?? 0n) - (a.task?.id ?? 0n)) ||
        STAGE[b.kind] - STAGE[a.kind],
    )
    .slice(0, limit)
}
