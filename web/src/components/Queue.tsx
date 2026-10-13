import { useState } from 'react'
import { useRegistryActions } from '../hooks/useRegistryActions'
import { useTx } from '../hooks/useTx'
import { sameAddress } from '../lib/format'
import { type Agent, type Task, TaskStatus } from '../types'
import { TaskResult } from './Leaderboard'
import { Button, Panel, StarPicker } from './ui'

function RateTask({ task, agentName }: { task: Task; agentName: string }) {
  const [rating, setRating] = useState(0)
  const { giveFeedback } = useRegistryActions()
  const { busy } = useTx()

  return (
    <li className="rounded-xl border border-line bg-ink-950/60 p-3">
      <p className="text-xs font-semibold text-mint">Rate {agentName}</p>
      <p className="mt-1 text-sm break-words">{task.description}</p>
      <p className="mt-1 text-sm text-mist">
        <span className="text-fog">Result: </span>
        <TaskResult result={task.result} />
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <StarPicker value={rating} onChange={setRating} />
        <Button
          size="sm"
          variant="primary"
          disabled={rating === 0 || busy}
          onClick={() => giveFeedback(task.id, rating)}
        >
          Submit rating
        </Button>
      </div>
    </li>
  )
}

type QueueProps = {
  agents: readonly Agent[]
  tasks: readonly Task[]
  me: string
  onDeliver: (task: Task) => void
}

/** Everything that is waiting on the connected wallet, as agent owner or as client. */
export function Queue({ agents, tasks, me, onDeliver }: QueueProps) {
  const { busy } = useTx()
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))
  const nameOf = (task: Task) => agentsById.get(task.agentId)?.name ?? `Agent #${task.agentId}`

  const toDeliver = tasks.filter(
    (task) => task.status === TaskStatus.Open && sameAddress(agentsById.get(task.agentId)?.owner, me),
  )
  const toRate = tasks.filter((task) => task.status === TaskStatus.Completed && sameAddress(task.client, me))
  const waiting = tasks.filter((task) => task.status === TaskStatus.Open && sameAddress(task.client, me))

  const actionable = toDeliver.length + toRate.length

  return (
    <Panel
      title="Your queue"
      aside={
        actionable > 0 && (
          <span className="rounded-full bg-monad px-2 py-0.5 text-xs font-semibold text-white">{actionable}</span>
        )
      }
    >
      {actionable + waiting.length === 0 ? (
        <p className="text-sm text-fog">Nothing is waiting on you. Assign a task to an agent or register your own.</p>
      ) : (
        <ul className="space-y-2.5">
          {toDeliver.map((task) => (
            <li key={task.id.toString()} className="rounded-xl border border-line bg-ink-950/60 p-3">
              <p className="text-xs font-semibold text-amber">New task for {nameOf(task)}</p>
              <p className="mt-1 text-sm break-words">{task.description}</p>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="primary" disabled={busy} onClick={() => onDeliver(task)}>
                  Deliver result
                </Button>
              </div>
            </li>
          ))}
          {toRate.map((task) => (
            <RateTask key={task.id.toString()} task={task} agentName={nameOf(task)} />
          ))}
          {waiting.map((task) => (
            <li key={task.id.toString()} className="rounded-xl border border-dashed border-line p-3">
              <p className="text-xs font-semibold text-fog">Waiting for {nameOf(task)} to deliver</p>
              <p className="mt-1 text-sm break-words text-mist">{task.description}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
