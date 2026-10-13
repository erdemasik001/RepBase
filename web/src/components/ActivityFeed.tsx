import { useMemo } from 'react'
import { type Activity, buildActivity } from '../lib/activity'
import { sameAddress, timeAgo } from '../lib/format'
import type { Agent, Task } from '../types'
import { AddressLabel, Panel, Stars } from './ui'

const FEED_LENGTH = 14

const DOT_COLORS: Record<Activity['kind'], string> = {
  registered: 'bg-monad',
  assigned: 'bg-amber',
  delivered: 'bg-monad-soft',
  rated: 'bg-mint',
}

function Line({ item, me }: { item: Activity; me?: string }) {
  const actor = <AddressLabel address={item.actor} you={sameAddress(item.actor, me)} />
  const agent = <span className="font-semibold text-snow">{item.agentName}</span>

  switch (item.kind) {
    case 'registered':
      return (
        <>
          {agent} was registered by {actor}
        </>
      )
    case 'assigned':
      return (
        <>
          {actor} assigned a task to {agent}
        </>
      )
    case 'delivered':
      return <>{agent} delivered a result</>
    case 'rated':
      return (
        <>
          {actor} rated {agent} <Stars value={item.task?.rating ?? 0} size={12} />
        </>
      )
  }
}

type ActivityFeedProps = { agents: readonly Agent[]; tasks: readonly Task[]; me?: string; now: number }

export function ActivityFeed({ agents, tasks, me, now }: ActivityFeedProps) {
  const items = useMemo(() => buildActivity(agents, tasks, FEED_LENGTH), [agents, tasks])

  return (
    <Panel title="Live activity">
      {items.length === 0 ? (
        <p className="text-sm text-fog">On-chain activity shows up here as it happens.</p>
      ) : (
        <ol className="space-y-3.5">
          {items.map((item) => (
            <li key={item.key} className="flex animate-rise gap-3 text-sm">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_COLORS[item.kind]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-mist">
                  <Line item={item} me={me} />
                </p>
                {item.kind === 'assigned' && item.task && (
                  <p className="mt-0.5 truncate text-xs text-fog">“{item.task.description}”</p>
                )}
                <p className="mt-0.5 text-xs text-fog">{timeAgo(item.timestamp, now)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
