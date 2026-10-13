import { useEffect, useState } from 'react'

/** Current time, re-rendering the caller on every tick so relative timestamps stay fresh. */
export function useNow(intervalMs = 1_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
