export function toLocalISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string) {
  const [yearRaw, monthRaw, dayRaw] = String(value || '').split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(value)
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function formatDateLabel(value: string, locale = 'en-US') {
  const parsed = parseDateInput(value)
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(parsed)
}

export function daysBetweenIso(from: string, to: string) {
  const start = parseDateInput(from)
  const end = parseDateInput(to)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1
  return Math.max(1, diffDays)
}
