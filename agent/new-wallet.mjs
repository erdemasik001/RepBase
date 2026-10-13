// Creates a throwaway wallet for the agent runner and stores its key in agent/.env.
// Prints only the address, so the key never shows up in a terminal or a log.
// Safe to re-run: an existing key is kept.
import { chmodSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const envPath = new URL('.env', import.meta.url)
if (!existsSync(envPath)) copyFileSync(new URL('.env.example', import.meta.url), envPath)

const env = readFileSync(envPath, 'utf8')
const existingKey = env.match(/^AGENT_PRIVATE_KEY=(.*)$/m)?.[1].trim()
const key = existingKey || generatePrivateKey()

if (!existingKey) {
  const line = `AGENT_PRIVATE_KEY=${key}`
  const updated = /^AGENT_PRIVATE_KEY=/m.test(env) ? env.replace(/^AGENT_PRIVATE_KEY=.*$/m, line) : `${env}\n${line}\n`
  writeFileSync(envPath, updated)
}
chmodSync(envPath, 0o600)

console.log(`Agent wallet: ${privateKeyToAccount(key).address}`)
console.log(existingKey ? 'Using the key already in agent/.env.' : 'New key saved to agent/.env. Never commit that file.')
