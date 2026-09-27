import { useSyncExternalStore } from 'react'

import { PEOPLE, type Person, type PersonEvent } from '../data/people'
import { type GiftSearch, SEARCHES } from '../data/searches'

/**
 * Стан прототипу в пам'яті (без бекенду): факти людей і шортліст. Потрібен,
 * щоб сценарій брифу був видимим — прийняли факт у розмові → лічильник на
 * картці людини виріс; зберегли ідею → вона в Shortlist.
 */
export interface Idea {
  id: string
  title: string
  price: string
  note: string
  /** Посилання на пропозицію на сторонньому сайті (магазин, майстерня). */
  url: string
  /** Пошук, з якого збережено (людина + привід — бриф SCREEN 5). */
  searchId: string
  person: string
  occasion: string
}

interface State {
  people: Person[]
  searches: GiftSearch[]
  shortlist: Idea[]
}

let state: State = { people: PEOPLE, searches: SEARCHES, shortlist: [] }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => state)
}

export function addFact(personId: string, fact: string) {
  state = {
    ...state,
    people: state.people.map((p) => (p.id === personId ? { ...p, facts: [fact, ...p.facts] } : p)),
  }
  emit()
}

export function saveIdea(idea: Idea) {
  if (state.shortlist.some((i) => i.id === idea.id)) return
  state = { ...state, shortlist: [idea, ...state.shortlist] }
  emit()
}

export function removeIdea(id: string) {
  state = { ...state, shortlist: state.shortlist.filter((i) => i.id !== id) }
  emit()
}

export const personIdFor = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-')

/** Людина за іменем; нової ще немає — створюється порожня (без фактів). */
export function ensurePerson(name: string): Person {
  const found = state.people.find((p) => p.name === name)
  if (found) return found
  const p: Person = { id: personIdFor(name), name, emoji: '', interests: [], events: [], facts: [], gifts: 0 }
  state = { ...state, people: [...state.people, p] }
  emit()
  return p
}

/** Подія людини — з профілю або з дропдауна «What's the occasion». */
export function addEvent(personId: string, ev: PersonEvent) {
  state = { ...state, people: state.people.map((p) => (p.id === personId ? { ...p, events: [...p.events, ev] } : p)) }
  emit()
}

/** Новий пошук з листа «+»: людина (наявна або нова), подія, дата. */
export function addSearch(s: GiftSearch) {
  ensurePerson(s.person)
  state = { ...state, searches: [...state.searches, s] }
  emit()
}

/** Правка параметрів пошуку з листа «···» у розмові. */
export function updateSearch(id: string, patch: Partial<Pick<GiftSearch, 'occasion' | 'date' | 'daysLeft' | 'budget'>>) {
  state = { ...state, searches: state.searches.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
  emit()
}

export function removeSearch(id: string) {
  state = { ...state, searches: state.searches.filter((s) => s.id !== id) }
  emit()
}

/**
 * «I bought this»: пошук закривається (зникає з домашньої), подарунок іде
 * в історію людини (лічильник gifts), ідея — з шортліста.
 */
export function markBought(searchId: string, ideaId: string) {
  const search = state.searches.find((s) => s.id === searchId)
  if (!search) return
  state = {
    ...state,
    searches: state.searches.filter((s) => s.id !== searchId),
    shortlist: state.shortlist.filter((i) => i.id !== ideaId),
    people: state.people.map((p) => (p.name === search.person ? { ...p, gifts: p.gifts + 1 } : p)),
  }
  emit()
}

/** Розмову відкрили — нове повідомлення побачене. */
export function markRead(id: string) {
  if (!state.searches.some((s) => s.id === id && s.unread)) return
  state = { ...state, searches: state.searches.map((s) => (s.id === id ? { ...s, unread: false } : s)) }
  emit()
}
