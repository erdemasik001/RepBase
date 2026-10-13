export type Tier = { label: string; color: string }

/** Colour and label for a score. Agents without feedback sit at the neutral prior. */
export function tierFor(score: number, feedbackCount: number): Tier {
  if (feedbackCount === 0) return { label: 'Unrated', color: 'var(--color-fog)' }
  if (score >= 80) return { label: 'Trusted', color: 'var(--color-mint)' }
  if (score >= 60) return { label: 'Reliable', color: 'var(--color-monad-soft)' }
  if (score >= 45) return { label: 'Mixed', color: 'var(--color-amber)' }
  return { label: 'Risky', color: 'var(--color-rose)' }
}
