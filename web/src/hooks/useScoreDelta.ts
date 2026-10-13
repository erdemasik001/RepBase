import { useEffect, useRef, useState } from 'react'

const VISIBLE_MS = 6_000

/** Returns how much a score just moved, for a few seconds after it changes. */
export function useScoreDelta(score: number) {
  const previous = useRef(score)
  const [delta, setDelta] = useState<number | null>(null)

  useEffect(() => {
    if (score === previous.current) return
    setDelta(score - previous.current)
    previous.current = score

    const timer = setTimeout(() => setDelta(null), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [score])

  return delta
}
