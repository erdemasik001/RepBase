import { useMemo, useState } from 'react'
import { useScoreDelta } from '../hooks/useScoreDelta'
import { describeAgent } from '../lib/agentUri'
import { cx } from '../lib/classes'
import { formatScore, isHttpUrl, sameAddress, scoreToNumber, timeAgo } from '../lib/format'
import { tierFor } from '../lib/reputation'
import { type Agent, type Task, TaskStatus } from '../types'
import { ChevronDownIcon } from './icons'
import { Orb } from './Shapes'
import { AddressLabel, Button, Stars } from './ui'

function Score({ score, color }: { score: number; color: string }) {
  const delta = useScoreDelta(score)

  return (
    <div className="relative shrink-0 text-right" role="img" aria-label={`Reputation score ${formatScore(score)}`}>
      <p className="eyebrow">Reputation</p>
      <p className="mt-1 font-display text-5xl leading-none font-black tabular-nums text-chrome sm:text-6xl">
        {formatScore(score)}
      </p>
      <div className="mt-2 ml-auto h-0.5 w-24 bg-ink-700 sm:w-32">
        <div
          className="h-full"
          style={{ width: `${score}%`, background: color, transition: 'width 0.7s ease, background 0.7s ease' }}
        />
      </div>
      {delta !== null && (
        <span
          className={cx(
            'absolute top-full right-0 mt-2 animate-rise font-mono text-sm font-medium whitespace-nowrap',
            delta > 0 ? 'text-mint' : 'text-rose',
          )}
        >
          {delta > 0 ? '▲ +' : '▼ −'}
          {formatScore(Math.abs(delta))}
        </span>
      )}
    </div>
  )
}

const STATUS_LABELS = {
  [TaskStatus.Open]: { label: 'Open', className: 'text-amber' },
  [TaskStatus.Completed]: { label: 'Delivered', className: 'text-monad-soft' },
  [TaskStatus.Rated]: { label: 'Rated', className: 'text-mint' },
} as const

export function TaskResult({ result }: { result: string }) {
  if (isHttpUrl(result)) {
    return (
      <a href={result} target="_blank" rel="noreferrer" className="break-all text-snow underline">
        {result}
      </a>
    )
  }
  return <span className="break-words">{result}</span>
}

function TaskHistory({ tasks, me, now }: { tasks: Task[]; me?: string; now: number }) {
  if (tasks.length === 0) {
    return <p className="mt-6 border-t border-line pt-5 text-fog">No tasks yet. Be the first to hire this agent.</p>
  }

  return (
    <ul className="mt-6 divide-y divide-line border-t border-line">
      {tasks.map((task) => {
        const status = STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]
        return (
          <li key={task.id} className="py-4">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-[0.14em] uppercase">
              <span className={status.className}>{status.label}</span>
              <span className="text-fog">Task #{task.id.toString()}</span>
              {task.status === TaskStatus.Rated && <Stars value={task.rating} size={12} />}
            </p>
            <p className="mt-2 break-words text-snow">{task.description}</p>
            {task.result && (
              <p className="mt-1 text-sm text-mist">
                <span className="text-fog">Result: </span>
                <TaskResult result={task.result} />
              </p>
            )}
            <p className="mt-2 text-sm text-fog">
              From <AddressLabel address={task.client} you={sameAddress(task.client, me)} /> ·{' '}
              {timeAgo(Number(task.createdAt), now)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

type AgentCardProps = {
  agent: Agent
  rank: number
  tasks: Task[]
  me?: string
  now: number
  onAssign: (agent: Agent) => void
}

function AgentCard({ agent, rank, tasks, me, now, onAssign }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const score = scoreToNumber(agent.score)
  const tier = tierFor(score, agent.feedbackCount)
  const isMine = sameAddress(agent.owner, me)
  const description = describeAgent(agent.agentURI)

  return (
    <li className="animate-rise bg-ink-900 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="eyebrow flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>No. {rank.toString().padStart(2, '0')}</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: tier.color }}>
              <span className="size-1.5 rounded-full bg-current" />
              {tier.label}
            </span>
            {isMine && <span className="text-monad-soft">Your agent</span>}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Orb seed={Number(agent.id)} className="size-10 shrink-0 sm:size-12" />
            <h3 className="truncate font-display text-3xl leading-tight font-extrabold text-chrome sm:text-4xl">
              {agent.name}
            </h3>
          </div>
        </div>
        <Score score={score} color={tier.color} />
      </div>

      {description && <p className="mt-5 max-w-xl text-lg leading-snug text-mist">{description}</p>}
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fog">
        <span>
          ID <span className="font-mono">#{agent.id.toString()}</span>
        </span>
        <span>
          Owner <AddressLabel address={agent.owner} you={isMine} />
        </span>
        <span>
          {agent.tasksCompleted}/{agent.tasksReceived} delivered
        </span>
        <span>
          {agent.feedbackCount} rating{agent.feedbackCount === 1 ? '' : 's'}
        </span>
      </p>

      <div className="mt-6 flex items-center gap-7">
        <Button
          variant="primary"
          disabled={isMine}
          title={isMine ? 'Owners cannot hire their own agent' : undefined}
          onClick={() => onAssign(agent)}
        >
          Assign task
        </Button>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-mist"
        >
          History ({tasks.length})
          <ChevronDownIcon width={14} height={14} className={cx('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {expanded && <TaskHistory tasks={tasks} me={me} now={now} />}
    </li>
  )
}

type LeaderboardProps = {
  agents: readonly Agent[]
  tasks: readonly Task[]
  me?: string
  now: number
  onAssign: (agent: Agent) => void
}

export function Leaderboard({ agents, tasks, me, now, onAssign }: LeaderboardProps) {
  const ranked = useMemo(
    () =>
      [...agents].sort(
        (a, b) => Number(b.score - a.score) || b.feedbackCount - a.feedbackCount || Number(a.id - b.id),
      ),
    [agents],
  )

  const tasksByAgent = useMemo(() => {
    const grouped = new Map<bigint, Task[]>()
    for (const task of tasks) {
      const list = grouped.get(task.agentId)
      if (list) list.push(task)
      else grouped.set(task.agentId, [task])
    }
    return grouped
  }, [tasks])

  return (
    <ol className="space-y-5">
      {ranked.map((agent, index) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          rank={index + 1}
          tasks={tasksByAgent.get(agent.id) ?? []}
          me={me}
          now={now}
          onAssign={onAssign}
        />
      ))}
    </ol>
  )
}
