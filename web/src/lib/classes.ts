export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export const fieldClass =
  'w-full border border-ink-600 bg-ink-950 px-3.5 py-2.5 text-[15px] text-snow placeholder:text-fog/60 ' +
  'focus:border-snow focus:outline-none'
