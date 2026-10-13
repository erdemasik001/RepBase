const DATA_PREFIX = 'data:application/json;base64,'

/**
 * Builds an ERC-8004 style registration file and inlines it as a data URI,
 * so the MVP needs no IPFS pinning or backend.
 */
export function buildAgentURI(name: string, description: string) {
  const registration = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description,
    supportedTrust: ['reputation'],
  }
  const bytes = new TextEncoder().encode(JSON.stringify(registration))
  return DATA_PREFIX + btoa(String.fromCharCode(...bytes))
}

/** Returns the description from an inlined registration file, or the raw URI for anything else. */
export function describeAgent(agentURI: string): string {
  if (!agentURI.startsWith(DATA_PREFIX)) return agentURI
  try {
    const bytes = Uint8Array.from(atob(agentURI.slice(DATA_PREFIX.length)), (char) => char.charCodeAt(0))
    const registration: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (typeof registration === 'object' && registration !== null && 'description' in registration) {
      return typeof registration.description === 'string' ? registration.description : ''
    }
    return ''
  } catch {
    return ''
  }
}
