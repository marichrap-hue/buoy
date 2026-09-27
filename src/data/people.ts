/**
 * Люди (бриф, SCREEN 2/3): картка = емодзі, ім'я, «12 facts · 2 gifts»,
 * чипи інтересів. Факти накопичуються з розмов (SCREEN 4) — тому список
 * фактів живе у сторі (`lib/store.ts`), тут лише стартові дані.
 */
/** Подія людини: день народження, Миколай, річниця… Щорічна — повторюється. */
export interface PersonEvent {
  id: string
  title: string
  /** ISO-дата найближчого настання (YYYY-MM-DD). */
  date: string
  recurring: boolean
}

export interface Person {
  id: string
  name: string
  emoji: string
  interests: string[]
  events: PersonEvent[]
  /** Що застосунок уже знає — від нових до старих. */
  facts: string[]
  gifts: number
}

export const PEOPLE: Person[] = [
  {
    id: 'mum',
    name: 'Mum',
    emoji: '👩',
    interests: ['Gardening', 'Romance novels', 'Recipes', 'Ceramics'],
    events: [
      { id: 'mum-mothers-day', title: "Mother's Day", date: '2026-10-11', recurring: true },
      { id: 'mum-birthday', title: 'Birthday', date: '2026-12-08', recurring: true },
      { id: 'mum-st-nicholas', title: 'St. Nicholas Day', date: '2026-12-19', recurring: true },
      { id: 'mum-christmas', title: 'Christmas', date: '2026-12-25', recurring: true },
      { id: 'mum-new-year', title: 'New Year', date: '2027-01-01', recurring: true },
      { id: 'mum-womens-day', title: "Women's Day", date: '2027-03-08', recurring: true },
      { id: 'mum-easter', title: 'Easter', date: '2027-05-02', recurring: true },
    ],
    facts: [
      'Likes ceramics, but has enough pots already',
      'Reads a romance novel a week',
      'Grows tomatoes on the balcony',
      'Prefers tea to coffee',
      'Collects recipes from magazines',
      'Dislikes strong perfume',
      'Walks every morning',
      'Wears size M',
      'Favourite colour is green',
      'Allergic to nuts',
      'Loves long letters',
      'Keeps every card she gets',
    ],
    gifts: 2,
  },
  {
    id: 'dad',
    name: 'Dad',
    emoji: '👨',
    interests: ['Cars', 'Sport', 'TV series', 'Sneakers'],
    events: [{ id: 'dad-birthday', title: 'Birthday', date: '2026-11-03', recurring: true }, { id: 'dad-christmas', title: 'Christmas', date: '2026-12-25', recurring: true }],
    facts: ['Watches every Formula 1 race', 'Wears sneakers size 44', 'Rewatches old series', 'Drinks black coffee', 'Hates scarves', 'Fixes things himself', 'Follows the local football club'],
    gifts: 2,
  },
  {
    id: 'partner',
    name: 'Partner',
    emoji: '❤️',
    interests: ['Career', 'Padel', 'Clothes'],
    events: [{ id: 'partner-anniversary', title: 'Anniversary', date: '2026-10-11', recurring: true }, { id: 'partner-birthday', title: 'Birthday', date: '2027-02-14', recurring: true }, { id: 'partner-christmas', title: 'Christmas', date: '2026-12-25', recurring: true }],
    facts: ['Plays padel on Thursdays', 'Wants a better work bag', 'Wears navy, never black', 'Runs cold in the office', 'Likes single-origin coffee', 'Reads about leadership', 'Lost his good umbrella', 'Collects vinyl', 'Prefers experiences to things'],
    gifts: 3,
  },
  {
    id: 'sister',
    name: 'Sister',
    emoji: '👧',
    interests: ['Yoga', 'Travel', 'Skincare'],
    events: [{ id: 'sister-birthday', title: 'Birthday', date: '2026-11-01', recurring: true }, { id: 'sister-housewarming', title: 'Housewarming', date: '2026-10-18', recurring: false }],
    facts: ['Doing yoga teacher training', 'Planning a trip to Lisbon', 'Uses only fragrance-free skincare', 'Moved into a new flat in March', 'Drinks matcha'],
    gifts: 1,
  },
  {
    id: 'alex',
    name: 'Alex',
    emoji: '🎓',
    interests: ['Coding', 'Board games', 'Hiking'],
    events: [{ id: 'alex-graduation', title: 'Graduation', date: '2026-12-31', recurring: false }],
    facts: ['Graduates in June', 'Plays board games on Fridays', 'Wants proper hiking boots'],
    gifts: 0,
  },
]
