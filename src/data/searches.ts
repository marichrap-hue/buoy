/**
 * Пошуки (бриф: одна бульбашка = один ПОШУК, людина + привід).
 * Дані-заглушки: без бекенду. Дати — відносно «сьогодні» прототипу.
 */
export type SearchState = 'ideas' | 'waiting' | 'calm'

export interface GiftSearch {
  id: string
  person: string
  emoji: string
  occasion: string
  /** Днів до дати. */
  daysLeft: number
  budget: string
  /** Дата події, для списку («under €50 · 10 May»). */
  date: string
  state: SearchState
  /** Скільки нових ідей чекає (лише для state 'ideas'). */
  ideas?: number
  /** Є нове повідомлення, яке ще не бачили: бульбашка з обводкою і здриганням. */
  unread?: boolean
}

/** Підписи станів — дослівно з брифу (Voice and copy). */
export const STATE_LABEL: Record<SearchState, (s: GiftSearch) => string> = {
  ideas: (s) => `${s.ideas ?? 0} new ideas`,
  waiting: () => 'Waiting on you',
  calm: () => 'Nothing urgent',
}

/** «in 3 days» / «in 2 weeks» / «in 3 months» — як у вайрфреймі («Через 14 днів»). */
export function daysLeftLabel(days: number): string {
  // Формат з макета Figma: «3 days left».
  if (days <= 0) return 'today'
  if (days === 1) return '1 day left'
  if (days < 14) return `${days} days left`
  if (days < 60) return `${Math.round(days / 7)} weeks left`
  return `${Math.round(days / 30)} months left`
}

export const SEARCHES: GiftSearch[] = [
  { id: 'mum-mothers-day', person: 'Mum', emoji: '🌷', occasion: "Mother's Day", daysLeft: 3, budget: 'under €50', date: '10 May', state: 'ideas', ideas: 3, unread: true },
  { id: 'dad-just-because', person: 'Dad', emoji: '🧢', occasion: 'Just because', daysLeft: 7, budget: 'under €40', date: '14 May', state: 'ideas', ideas: 4, unread: true },
  { id: 'partner-anniversary', person: 'Partner', emoji: '❤️', occasion: 'Anniversary', daysLeft: 14, budget: 'under €120', date: '21 May', state: 'waiting' },
  { id: 'sister-birthday', person: 'Sister', emoji: '✨', occasion: 'Birthday', daysLeft: 35, budget: 'under €60', date: '11 Jun', state: 'calm' },
  { id: 'mum-60th', person: 'Mum', emoji: '🎂', occasion: '60th birthday', daysLeft: 62, budget: 'under €300', date: '8 Jul', state: 'ideas', ideas: 1, unread: true },
  { id: 'alex-graduation', person: 'Alex', emoji: '🎓', occasion: 'Graduation', daysLeft: 95, budget: 'under €80', date: '10 Aug', state: 'calm' },
]
