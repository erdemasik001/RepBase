// Reference agent runner.
//
// Gives one wallet an on-chain agent identity (registering it on first run), then watches
// AgentRegistry for open tasks assigned to that agent and delivers a result for each.
// The "work" is a mock: replace doWork() with a real model or tool call to turn this
// into a live agent.
//
// Usage: cp .env.example .env, fill it in, then `pnpm start`.
import { createPublicClient, createWalletClient, http, parseAbi, parseEventLogs } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const POLL_INTERVAL_MS = 1_000
const TASK_STATUS_OPEN = 0

const abi = parseAbi([
  'struct AgentView { uint256 id; address owner; string name; string agentURI; uint256 score; uint64 registeredAt; uint32 tasksReceived; uint32 tasksCompleted; uint32 feedbackCount; }',
  'struct TaskView { uint256 id; uint256 agentId; address client; uint8 status; uint8 rating; uint64 createdAt; uint64 completedAt; uint64 ratedAt; string description; string result; }',
  'function getAgents(uint256 offset, uint256 limit) view returns (AgentView[])',
  'function getAgentTasks(uint256 agentId, uint256 limit) view returns (TaskView[])',
  'function ownerOf(uint256 agentId) view returns (address)',
  'function register(string name, string agentURI) returns (uint256)',
  'function completeTask(uint256 taskId, string result)',
  'event Registered(uint256 indexed agentId, address indexed owner, string name, string agentURI)',
])

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in.`)
    process.exit(1)
  }
  return value
}

const rpcUrl = requireEnv('RPC_URL')
const registry = requireEnv('REGISTRY_ADDRESS')
const account = privateKeyToAccount(requireEnv('AGENT_PRIVATE_KEY'))

const publicClient = createPublicClient({ transport: http(rpcUrl) })
const chainId = await publicClient.getChainId()
const chain = {
  id: chainId,
  name: `chain-${chainId}`,
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
}
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) })

/** Mock worker. Swap this for a real model or tool call. Must return at most 512 bytes. */
async function doWork(task) {
  const words = task.description.trim().split(/\s+/).length
  return `Done (mock worker): handled a ${words}-word brief for task #${task.id}.`
}

async function deliver(task) {
  console.log(`Task #${task.id} from ${task.client}: "${task.description}"`)
  const result = await doWork(task)

  const startedAt = performance.now()
  const hash = await walletClient.writeContract({
    address: registry,
    abi,
    functionName: 'completeTask',
    args: [task.id, result],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 200 })
  const ms = Math.round(performance.now() - startedAt)

  if (receipt.status !== 'success') throw new Error(`delivery reverted (${hash})`)
  console.log(`  delivered in ${ms} ms -> ${hash}`)
}

const sameAddress = (a, b) => a.toLowerCase() === b.toLowerCase()

/** ERC-8004 style registration file, inlined as a data URI (same format the dashboard uses). */
function buildAgentURI(name, description) {
  const registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description,
    supportedTrust: ['reputation'],
  }
  return `data:application/json;base64,${Buffer.from(JSON.stringify(registration)).toString('base64')}`
}

/** Uses AGENT_ID if set, otherwise the identity this wallet already owns, otherwise registers one. */
async function resolveAgentId() {
  if (process.env.AGENT_ID) {
    const id = BigInt(process.env.AGENT_ID)
    const owner = await publicClient.readContract({ address: registry, abi, functionName: 'ownerOf', args: [id] })
    if (!sameAddress(owner, account.address)) {
      console.error(`Agent #${id} is owned by ${owner}, not by ${account.address}.`)
      process.exit(1)
    }
    return id
  }

  const agents = await publicClient.readContract({ address: registry, abi, functionName: 'getAgents', args: [0n, 500n] })
  const existing = agents.find((agent) => sameAddress(agent.owner, account.address))
  if (existing) return existing.id

  const name = process.env.AGENT_NAME || 'Runner'
  const description = process.env.AGENT_DESCRIPTION || 'Autonomous reference agent that delivers tasks on its own.'
  console.log(`No identity yet for ${account.address}. Registering "${name}"...`)
  const hash = await walletClient.writeContract({
    address: registry,
    abi,
    functionName: 'register',
    args: [name, buildAgentURI(name, description)],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 200 })
  const [registered] = parseEventLogs({ abi, eventName: 'Registered', logs: receipt.logs })
  if (!registered) throw new Error(`registration failed (${hash})`)
  return registered.args.agentId
}

const agentId = await resolveAgentId()
console.log(`Agent #${agentId} online as ${account.address} on chain ${chainId}. Waiting for tasks...`)

for (;;) {
  try {
    const tasks = await publicClient.readContract({
      address: registry,
      abi,
      functionName: 'getAgentTasks',
      args: [agentId, 20n],
    })
    // Oldest first, one at a time, so nonces never race.
    for (const task of tasks.filter((task) => task.status === TASK_STATUS_OPEN).reverse()) {
      await deliver(task)
    }
  } catch (error) {
    console.error(`Error: ${error.shortMessage ?? error.message}`)
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
}
