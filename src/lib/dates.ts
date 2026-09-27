import type { PersonEvent } from '../data/people'

/** Днів від сьогодні до ISO-дати (від'ємне — минула). */
export function daysUntil(iso: string, now = new Date()): number {
  const d = new Date(iso)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

/** Найближче настання події: щорічна після дати переноситься на наступний рік. */
export function nextOccurrence(ev: PersonEvent, now = new Date()): string {
  if (!ev.recurring || daysUntil(ev.date, now) >= 0) return ev.date
  const d = new Date(ev.date)
  const next = new Date(d)
  next.setFullYear(now.getFullYear())
  if (daysUntil(next.toISOString().slice(0, 10), now) < 0) next.setFullYear(now.getFullYear() + 1)
  return next.toISOString().slice(0, 10)
}

/** Найближча майбутня подія людини (або null, якщо подій немає / всі минули). */
export function nextEvent(events: PersonEvent[], now = new Date()): { ev: PersonEvent; days: number } | null {
  let best: { ev: PersonEvent; days: number } | null = null
  for (const ev of events) {
    const days = daysUntil(nextOccurrence(ev, now), now)
    if (days < 0) continue
    if (!best || days < best.days) best = { ev, days }
  }
  return best
}

/** «today» / «tomorrow» / «in 5 days» / «in 3 weeks» / «in 2 months». */
export function inLabel(days: number): string {
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 14) return `in ${days} days`
  if (days < 60) return `in ${Math.round(days / 7)} weeks`
  return `in ${Math.round(days / 30)} months`
}
