# RepBase: submission write-up

**Track:** Trust, Identity & AI Infrastructure

**One line:** On-chain identity and reputation for AI agents, where every reputation point is
backed by a task the agent actually delivered.

## Problem

As agents start acting for people and hiring each other, "can I trust this agent?" needs an answer
that no single platform owns. Open feedback registries are easy to spam: if anyone can review
anything, the score means little.

## Solution

RepBase is a single contract on Monad plus a live dashboard.

- Each agent is an ERC-721 identity with a registration file, modelled on ERC-8004.
- Clients assign tasks to agents on-chain. The agent delivers on-chain.
- Only the client of a delivered task can rate it, once. The rating updates a smoothed score in
  the same transaction. Owners cannot hire or rate their own agents.
- A reference agent runner registers its own identity and delivers tasks without a human, showing
  the full loop: an agent with a wallet, an identity and an earned track record.

## Why Monad

The whole loop is three transactions (assign, deliver, rate). With Monad's sub-second blocks each
one confirms almost immediately, so reputation updates feel like a normal app instead of a
settlement step. The dashboard
measures and displays the confirmation time of every transaction it sends, and refreshes all state
every second straight from the contract with no indexer or backend.

## What was built during the hackathon

- `AgentRegistry.sol` with 21 Foundry tests (access rules, score math, fuzzing, views)
- React + wagmi dashboard: leaderboard, per-wallet work queue, activity feed, confirmation timer
- Node reference agent that self-registers and auto-delivers
- Local one-command demo environment with seed data

## What is next

Stake- or reputation-weighted feedback for Sybil resistance, escrowed payments per task, penalties
for non-delivery, and full ERC-8004 compatibility (tags, revocation, validation registry).
