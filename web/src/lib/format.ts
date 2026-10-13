export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase())
}

/** Scores come from the contract as fixed-point with 2 decimals (6250 = 62.50). */
export function scoreToNumber(score: bigint) {
  return Number(score) / 100
}

export function formatScore(score: number) {
  return score.toFixed(1)
}

export function timeAgo(timestamp: number, nowMs: number) {
  const seconds = Math.max(0, Math.floor(nowMs / 1000) - timestamp)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function byteLength(value: string) {
  return new TextEncoder().encode(value).length
}

export function isHttpUrl(value: string) {
  return /^https?:\/\/\S+$/.test(value)
}
