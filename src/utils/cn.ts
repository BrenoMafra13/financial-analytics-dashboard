export type ClassValue = string | number | boolean | null | undefined

export function cn(...classes: ClassValue[]) {
  return classes
    .flatMap((value) => {
      if (typeof value === 'string') return value.split(' ')
      if (typeof value === 'number') return String(value)
      if (typeof value === 'boolean' || value == null) return []
      return []
    })
    .filter(Boolean)
    .join(' ')
}
