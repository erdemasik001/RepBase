export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export const fieldClass =
  'w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-snow placeholder:text-fog/60 ' +
  'focus:border-monad focus:outline-none'
