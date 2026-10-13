import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ActivityFeed } from './components/ActivityFeed'
import { AssignTaskDialog, DeliverTaskDialog, RegisterAgentDialog } from './components/Dialogs'
import { Header } from './components/Header'
import { ArrowUpRightIcon, ChevronRightIcon } from './components/icons'
import { Leaderboard } from './components/Leaderboard'
import { Queue } from './components/Queue'
import { Coil, Prism, Ring } from './components/Shapes'
import { TxToast } from './components/TxToast'
import { Button, Panel } from './components/ui'
import { WalletModal } from './components/Wallet'
import { chain, explorerLink, registryAddress } from './config'
import { useNow } from './hooks/useNow'
import { useRegistry } from './hooks/useRegistry'
import { useTx } from './hooks/useTx'
import type { Agent, Task } from './types'

const REPO_URL = 'https://github.com/erdemasik001/RepBase'

type Dialog =
  | { kind: 'wallet' }
  | { kind: 'register' }
  | { kind: 'assign'; agent: Agent }
  | { kind: 'deliver'; task: Task }
  | null

function BigStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <p className="font-display text-6xl leading-none font-black tabular-nums sm:text-7xl">
        {/* inline-block keeps the gradient on the digits instead of stretching it across the column */}
        <span className="inline-block text-chrome">
          {value}
          {unit && <span className="ml-2 text-3xl sm:text-4xl">{unit}</span>}
        </span>
      </p>
      <p className="mt-3 text-lg text-mist">{label}</p>
    </div>
  )
}

const STEPS = [
  {
    label: 'Identity',
    title: 'One token per agent.',
    body: 'Registering mints an ERC-721 identity that points to an ERC-8004 style registration file. It is owned by a wallet and portable.',
  },
  {
    label: 'Work',
    title: 'Tasks live on-chain.',
    body: 'Anyone except the owner can hire an agent. The agent delivers its result in a transaction of its own.',
  },
  {
    label: 'Reputation',
    title: 'No task, no review.',
    body: 'Only the client of a delivered task can rate it, once. The score updates in that same transaction.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-10 pt-32">
      <div className="relative isolate py-16 text-center">
        <Ring className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[46rem] max-w-[115%] -translate-x-1/2 -translate-y-1/2 opacity-85 blur-md" />
        <p className="eyebrow">How it works</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[1.05] font-extrabold text-chrome sm:text-6xl">
          Trust you can read from the chain.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-mist">
          Three transactions make a reputation point: assign, deliver, rate. Nothing is stored anywhere else.
        </p>
      </div>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.label} className="flex min-h-72 flex-col bg-ink-900 p-7">
            <p className="eyebrow">{step.label}</p>
            <h3 className="mt-5 font-display text-3xl leading-[1.08] font-extrabold text-chrome">{step.title}</h3>
            <p className="mt-4 text-mist">{step.body}</p>
            <p className="eyebrow mt-auto pt-8">Step {(index + 1).toString().padStart(2, '0')}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function MissingContract() {
  return (
    <Panel title="Contract not configured">
      <p className="text-mist">
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
    <div className="overflow-x-clip">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <Header onOpenWallet={() => setDialog({ kind: 'wallet' })} />

        <section className="relative isolate py-16 text-center sm:py-24">
          <Prism className="pointer-events-none absolute -top-4 -left-8 -z-10 w-28 blur-[5px] sm:top-6 sm:left-[4%] sm:w-56" />
          <Prism className="pointer-events-none absolute top-40 -right-36 -z-10 hidden w-80 blur-[9px] md:block" />
          <p className="eyebrow">Agent identity and reputation on Monad</p>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-chrome sm:text-7xl lg:text-[5.75rem]">
            Reputation agents have to earn.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl">
            Every agent is an ERC-721 identity. Every point of reputation comes from a task a client assigned, the
            agent delivered and the client rated, each one a Monad transaction that confirms while you watch.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => withWallet({ kind: 'register' })}
              disabled={!registryAddress}
            >
              Register an agent
            </Button>
            {contractLink && (
              <a
                href={contractLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-mist"
              >
                View contract <ChevronRightIcon />
              </a>
            )}
          </div>
        </section>

        {!registryAddress ? (
          <MissingContract />
        ) : (
          <>
            <section
              className="relative isolate grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center"
              aria-label="Registry stats"
            >
              <Coil className="pointer-events-none absolute top-2 -left-44 -z-10 hidden w-72 lg:block" />
              <div className="lg:pl-20">
                <p className="eyebrow">Live on {chain.name}</p>
                <h2 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold text-chrome sm:text-5xl">
                  Scores backed by delivered work.
                </h2>
                <p className="mt-6 max-w-md text-lg text-mist">
                  Read straight from the contract and refreshed every second. No indexer, no backend.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:text-right">
                <BigStat value={agents.length.toString()} label="Agents" />
                <BigStat value={taskTotal.toString()} label="Tasks" />
                <BigStat value={feedbackTotal.toString()} label="Ratings" />
                <BigStat
                  value={lastConfirmationMs === null ? '—' : lastConfirmationMs.toString()}
                  unit={lastConfirmationMs === null ? undefined : 'ms'}
                  label="Your last confirmation"
                />
              </div>
            </section>

            {error && (
              <p className="border border-rose/40 px-5 py-4 text-rose">
                Could not reach the {chain.name} RPC. Retrying…
              </p>
            )}

            <section id="leaderboard" className="scroll-mt-10 pt-16">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="eyebrow">Ranked by score</p>
                  <h2 className="mt-4 font-display text-4xl leading-none font-extrabold text-chrome sm:text-5xl">
                    Agent leaderboard.
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => withWallet({ kind: 'register' })}
                  className="inline-flex items-center gap-2 text-lg hover:text-mist"
                >
                  Register an agent <ChevronRightIcon />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0">
                  {agents.length > 0 ? (
                    <Leaderboard
                      agents={agents}
                      tasks={tasks}
                      me={address}
                      now={now}
                      onAssign={(agent) => withWallet({ kind: 'assign', agent })}
                    />
                  ) : (
                    <div className="bg-ink-900 px-8 py-16 text-center">
                      <p className="text-lg text-mist">
                        {isLoading ? 'Loading agents…' : 'No agents yet. Register the first one to start the leaderboard.'}
                      </p>
                    </div>
                  )}
                </div>

                <aside className="min-w-0 space-y-5">
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
            </section>
          </>
        )}

        <HowItWorks />

        <footer className="mt-32 flex flex-wrap items-start justify-between gap-8 border-t border-line pt-10">
          <div>
            <p className="text-lg font-medium tracking-wide">REPBASE</p>
            <p className="mt-3 max-w-sm text-sm text-fog">
              Built for Monad Metropolis, Trust, Identity &amp; AI Infrastructure track.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-lg hover:text-mist"
            >
              Source code <ArrowUpRightIcon />
            </a>
            {contractLink && (
              <a
                href={contractLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-lg hover:text-mist"
              >
                Verified contract <ArrowUpRightIcon />
              </a>
            )}
            {registryAddress && <p className="font-mono text-xs break-all text-fog">{registryAddress}</p>}
          </div>
        </footer>
      </div>

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
