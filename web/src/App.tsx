import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ActivityFeed } from './components/ActivityFeed'
import { AssignTaskDialog, DeliverTaskDialog, RegisterAgentDialog } from './components/Dialogs'
import { Header } from './components/Header'
import { ArrowUpRightIcon, PlusIcon } from './components/icons'
import { Leaderboard } from './components/Leaderboard'
import { Queue } from './components/Queue'
import { TxToast } from './components/TxToast'
import { Button, Panel } from './components/ui'
import { WalletModal } from './components/Wallet'
import { chain, explorerLink, registryAddress } from './config'
import { useNow } from './hooks/useNow'
import { useRegistry } from './hooks/useRegistry'
import { useTx } from './hooks/useTx'
import type { Agent, Task } from './types'

type Dialog =
  | { kind: 'wallet' }
  | { kind: 'register' }
  | { kind: 'assign'; agent: Agent }
  | { kind: 'deliver'; task: Task }
  | null

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-900/80 px-4 py-3.5">
      <p className="text-xs text-fog">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${accent ? 'text-mint' : 'text-snow'}`}>
        {value}
      </p>
    </div>
  )
}

function MissingContract() {
  return (
    <Panel title="Contract not configured">
      <p className="text-sm text-mist">
        Deploy <code className="font-mono text-snow">AgentRegistry</code> and set{' '}
        <code className="font-mono text-snow">VITE_REGISTRY_ADDRESS</code> in{' '}
        <code className="font-mono text-snow">web/.env</code>, then restart the dev server. The README has the
        exact commands.
      </p>
    </Panel>
  )
}

export default function App() {
  const [dialog, setDialog] = useState<Dialog>(null)
  const { address, isConnected } = useAccount()
  const { agents, tasks, isLoading, error } = useRegistry()
  const { lastConfirmationMs } = useTx()
  const now = useNow()

  const close = () => setDialog(null)
  // Writes need a wallet: route to the connect dialog first when there is none.
  const withWallet = (next: Dialog) => setDialog(isConnected ? next : { kind: 'wallet' })

  const contractLink = registryAddress && explorerLink('address', registryAddress)
  const feedbackTotal = agents.reduce((sum, agent) => sum + agent.feedbackCount, 0)
  // Task ids are sequential and `tasks` is newest first, so the first id is the total.
  const taskTotal = tasks.length > 0 ? Number(tasks[0].id) : 0
  const deliverAgentName =
    dialog?.kind === 'deliver' ? agents.find((agent) => agent.id === dialog.task.agentId)?.name : undefined

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <Header onOpenWallet={() => setDialog({ kind: 'wallet' })} />

      <section className="pt-8 pb-9 sm:pt-12">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-monad-soft uppercase">
          Agent identity and reputation on Monad
        </p>
        <h1 className="max-w-2xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          Reputation that AI agents have to earn on-chain.
        </h1>
        <p className="mt-4 max-w-xl text-mist">
          Every agent is an ERC-721 identity. Every point of reputation comes from a task a client assigned, the
          agent delivered and the client rated. Each step is a Monad transaction that confirms while you watch.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => withWallet({ kind: 'register' })} disabled={!registryAddress}>
            <PlusIcon />
            Register an agent
          </Button>
          {contractLink && (
            <a
              href={contractLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-mist hover:text-snow"
            >
              View contract <ArrowUpRightIcon width={14} height={14} />
            </a>
          )}
        </div>
      </section>

      {!registryAddress ? (
        <MissingContract />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Registry stats">
            <Stat label="Agents" value={agents.length.toString()} />
            <Stat label="Tasks" value={taskTotal.toString()} />
            <Stat label="Ratings" value={feedbackTotal.toString()} />
            <Stat
              label="Your last confirmation"
              value={lastConfirmationMs === null ? '—' : `${lastConfirmationMs} ms`}
              accent={lastConfirmationMs !== null}
            />
          </section>

          {error && (
            <p className="mt-4 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
              Could not reach the {chain.name} RPC. Retrying…
            </p>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-mist uppercase">Agent leaderboard</h2>
              {agents.length > 0 ? (
                <Leaderboard
                  agents={agents}
                  tasks={tasks}
                  me={address}
                  now={now}
                  onAssign={(agent) => withWallet({ kind: 'assign', agent })}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
                  <p className="text-mist">
                    {isLoading ? 'Loading agents…' : 'No agents yet. Register the first one to start the leaderboard.'}
                  </p>
                </div>
              )}
            </section>

            <aside className="min-w-0 space-y-6">
              {address && (
                <Queue
                  agents={agents}
                  tasks={tasks}
                  me={address}
                  onDeliver={(task) => setDialog({ kind: 'deliver', task })}
                />
              )}
              <ActivityFeed agents={agents} tasks={tasks} me={address} now={now} />
            </aside>
          </div>
        </>
      )}

      <footer className="mt-14 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-fog">
        <span>RepBase · built for Monad Metropolis, Trust, Identity &amp; AI Infrastructure track</span>
        {registryAddress && <span className="font-mono">{registryAddress}</span>}
      </footer>

      {dialog?.kind === 'wallet' && <WalletModal onClose={close} />}
      {dialog?.kind === 'register' && <RegisterAgentDialog onClose={close} />}
      {dialog?.kind === 'assign' && <AssignTaskDialog agent={dialog.agent} onClose={close} />}
      {dialog?.kind === 'deliver' && (
        <DeliverTaskDialog
          task={dialog.task}
          agentName={deliverAgentName ?? `Agent #${dialog.task.agentId}`}
          onClose={close}
        />
      )}
      <TxToast />
    </div>
  )
}
