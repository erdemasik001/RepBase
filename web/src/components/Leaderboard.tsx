import { useMemo, useState } from 'react'
import { useScoreDelta } from '../hooks/useScoreDelta'
import { describeAgent } from '../lib/agentUri'
import { cx } from '../lib/classes'
import { formatScore, isHttpUrl, sameAddress, scoreToNumber, timeAgo } from '../lib/format'
import { tierFor } from '../lib/reputation'
import { type Agent, type Task, TaskStatus } from '../types'
import { ChevronDownIcon, PlusIcon } from './icons'
import { AddressLabel, Button, Stars } from './ui'

const RING_RADIUS = 27
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function ScoreRing({ score, color }: { score: number; color: string }) {
  const delta = useScoreDelta(score)

  return (
    <div className="relative shrink-0 text-center">
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`Reputation score ${formatScore(score)}`}>
        <circle cx="34" cy="34" r={RING_RADIUS} fill="none" stroke="var(--color-ink-700)" strokeWidth="5" />
        <circle
          cx="34"
          cy="34"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - score / 100)}
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.7s ease' }}
        />
        <text
          x="34"
          y="35"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-snow font-mono text-[15px] font-semibold"
        >
          {formatScore(score)}
        </text>
      </svg>
      {delta !== null && (
        <span
          className={cx(
            'absolute -bottom-3 left-1/2 -translate-x-1/2 animate-rise rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap',
            delta > 0 ? 'bg-mint/15 text-mint' : 'bg-rose/15 text-rose',
          )}
        >
          {delta > 0 ? '▲ +' : '▼ −'}
          {formatScore(Math.abs(delta))}
        </span>
      )}
    </div>
  )
}

function Avatar({ agent }: { agent: Agent }) {
  const hue = (Number(agent.id) * 67 + 250) % 360
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-xl text-base font-semibold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 50) % 360} 65% 40%))` }}
      aria-hidden="true"
    >
      {agent.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

const STATUS_LABELS = {
  [TaskStatus.Open]: { label: 'Open', className: 'bg-amber/15 text-amber' },
  [TaskStatus.Completed]: { label: 'Delivered', className: 'bg-monad/20 text-monad-soft' },
  [TaskStatus.Rated]: { label: 'Rated', className: 'bg-mint/15 text-mint' },
} as const

export function TaskResult({ result }: { result: string }) {
  if (isHttpUrl(result)) {
    return (
      <a href={result} target="_blank" rel="noreferrer" className="break-all text-monad-soft underline">
        {result}
      </a>
    )
  }
  return <span className="break-words">{result}</span>
}

function TaskHistory({ tasks, me, now }: { tasks: Task[]; me?: string; now: number }) {
  if (tasks.length === 0) {
    return <p className="mt-4 border-t border-line pt-4 text-sm text-fog">No tasks yet. Be the first to hire this agent.</p>
  }

  return (
    <ul className="mt-4 space-y-3 border-t border-line pt-4">
      {tasks.map((task) => {
        const status = STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]
        return (
          <li key={task.id} className="text-sm">
            <div className="flex items-start gap-2">
              <span className={cx('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold', status.className)}>
                {status.label}
              </span>
              <p className="min-w-0 break-words text-snow">{task.description}</p>
            </div>
            {task.result && (
              <p className="mt-1 pl-1 text-mist">
                <span className="text-fog">Result: </span>
                <TaskResult result={task.result} />
              </p>
            )}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 pl-1 text-xs text-fog">
              <span>
                Task #{task.id.toString()} from <AddressLabel address={task.client} you={sameAddress(task.client, me)} />
              </span>
              <span>· {timeAgo(Number(task.createdAt), now)}</span>
              {task.status === TaskStatus.Rated && <Stars value={task.rating} size={12} />}
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
    <li className="animate-rise rounded-2xl border border-line bg-ink-900/80 p-4 transition-colors hover:border-white/15 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden w-6 shrink-0 text-center font-mono text-sm text-fog sm:block">{rank}</span>
        <Avatar agent={agent} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-base font-semibold">{agent.name}</h3>
            <span
              className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
              style={{ color: tier.color, borderColor: `color-mix(in srgb, ${tier.color} 40%, transparent)` }}
            >
              {tier.label}
            </span>
            {isMine && (
              <span className="rounded-full bg-monad/20 px-2 py-0.5 text-[11px] font-semibold text-monad-soft">
                Your agent
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 truncate text-sm text-mist">{description}</p>}
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-fog">
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
        </div>
        <ScoreRing score={score} color={tier.color} />
      </div>

      <div className="mt-4 flex items-center gap-2 sm:pl-10">
        <Button
          size="sm"
          variant="primary"
          disabled={isMine}
          title={isMine ? 'Owners cannot hire their own agent' : undefined}
          onClick={() => onAssign(agent)}
        >
          <PlusIcon width={14} height={14} />
          Assign task
        </Button>
        <Button size="sm" variant="ghost" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          History ({tasks.length})
          <ChevronDownIcon width={14} height={14} className={cx('transition-transform', expanded && 'rotate-180')} />
        </Button>
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
    <ol className="space-y-3">
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
