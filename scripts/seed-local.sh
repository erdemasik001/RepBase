#!/usr/bin/env bash
# Fills a local Anvil chain with a few agents, tasks and ratings so the dashboard
# has something to show. Uses Anvil's unlocked default accounts, so no keys are needed.
set -euo pipefail

RPC=${RPC_URL:-http://127.0.0.1:8545}
REGISTRY=${REGISTRY:-0x5FbDB2315678afecb367f032d93F642f64180aa3}

ALICE=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
BOB=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
CAROL=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

send() {
  local from=$1
  shift
  cast send "$REGISTRY" "$@" --from "$from" --unlocked --rpc-url "$RPC" >/dev/null
}

agent_uri() {
  local json
  json=$(printf '{"type":"https://eips.ethereum.org/EIPS/eip-8004#registration-v1","name":"%s","description":"%s","supportedTrust":["reputation"]}' "$1" "$2")
  printf 'data:application/json;base64,%s' "$(printf '%s' "$json" | base64 | tr -d '\n')"
}

echo "Registering agents..."
send "$ALICE" "register(string,string)" "Atlas" "$(agent_uri Atlas 'Research agent that reads docs and writes short briefings.')"
send "$BOB" "register(string,string)" "Nova" "$(agent_uri Nova 'Monitors on-chain positions and reports risk.')"
send "$CAROL" "register(string,string)" "Quill" "$(agent_uri Quill 'Drafts and proofreads governance proposals.')"

echo "Running tasks..."
# Atlas (agent 1): two good jobs
send "$BOB" "createTask(uint256,string)" 1 "Summarize the Monad architecture docs in five bullets."
send "$ALICE" "completeTask(uint256,string)" 1 "Five-bullet summary covering MonadBFT, parallel execution and MonadDb."
send "$BOB" "giveFeedback(uint256,uint8)" 1 5
send "$CAROL" "createTask(uint256,string)" 1 "Compare ERC-8004 with ERC-6551 for agent identity."
send "$ALICE" "completeTask(uint256,string)" 2 "One-page comparison with a recommendation."
send "$CAROL" "giveFeedback(uint256,uint8)" 2 4

# Nova (agent 2): one poor job
send "$ALICE" "createTask(uint256,string)" 2 "Report liquidation risk for my lending position."
send "$BOB" "completeTask(uint256,string)" 3 "Position looks fine."
send "$ALICE" "giveFeedback(uint256,uint8)" 3 2

# Quill (agent 3): delivered, waiting for a rating
send "$ALICE" "createTask(uint256,string)" 3 "Proofread the grant proposal draft."
send "$CAROL" "completeTask(uint256,string)" 4 "Fixed 14 typos and tightened the summary."

echo "Done. Agents: $(cast call "$REGISTRY" 'agentCount()(uint256)' --rpc-url "$RPC"), tasks: $(cast call "$REGISTRY" 'taskCount()(uint256)' --rpc-url "$RPC")"
