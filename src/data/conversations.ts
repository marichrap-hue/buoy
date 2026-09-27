import type { Idea } from '../lib/store'

/**
 * Готові переписки для пошуків з моку — під стан кожного (27.09.2026):
 *  - ideas   → асистент уже запропонував N ідей (стільки ж, скільки в бульбашці);
 *  - waiting → останнє повідомлення — питання асистента без відповіді;
 *  - calm    → короткий старт: що знає, і пропозиція почати збирати.
 * «Mum · Mother's Day» тут немає — це заскриптований сценарій брифу з нуля.
 */
export type SeedMsg = { role: 'assistant' | 'user'; text: string }

export interface ConversationSeed {
  messages: SeedMsg[]
  /** Кнопки-відповіді під останнім питанням. */
  replies?: string[]
  /** Ідеї, які вже запропоновано. */
  ideas?: Idea[]
}

const idea = (id: string, searchId: string, person: string, occasion: string, title: string, price: string, note: string, url: string): Idea => ({
  id,
  searchId,
  person,
  occasion,
  title,
  price,
  note,
  url,
})

export const CONVERSATIONS: Record<string, ConversationSeed> = {
  'dad-just-because': {
    messages: [
      { role: 'assistant', text: "Dad's been rewatching old series and fixing things around the house. Are we going practical, or a bit of fun for his evenings?" },
      { role: 'user', text: 'A bit of fun. He has enough tools.' },
      { role: 'assistant', text: 'Noted — no tools. Four things for his evenings, all under €40.' },
    ],
    ideas: [
      idea('dad-f1-calendar', 'dad-just-because', 'Dad', 'Just because', 'Formula 1 season wall calendar', '€18', 'Every race weekend marked, big enough for the kitchen', 'https://www.formula1.com/en/store'),
      idea('dad-box-set', 'dad-just-because', 'Dad', 'Just because', 'Restored box set of the series he rewatches', '€35', 'The one he keeps going back to, on disc', 'https://www.amazon.co.uk/'),
      idea('dad-stadium-tour', 'dad-just-because', 'Dad', 'Just because', 'Stadium tour of the local club', '€40', 'Behind the scenes, an hour and a half', 'https://www.viator.com/'),
      idea('dad-coffee', 'dad-just-because', 'Dad', 'Just because', 'Dark roast sampler, three origins', '€24', 'Black coffee, no frills — exactly his', 'https://www.pactcoffee.com/'),
    ],
    replies: ['Something else', 'These are good'],
  },
  'partner-anniversary': {
    messages: [
      { role: 'assistant', text: "Last year it was the vinyl. He's been playing padel on Thursdays and says he prefers experiences to things." },
      { role: 'assistant', text: 'Do you want this anniversary to be something you do together, or something he keeps?' },
    ],
    replies: ['Something we do together', 'Something he keeps'],
  },
  'sister-birthday': {
    messages: [
      { role: 'assistant', text: "Sister's birthday is in five weeks. She's doing yoga teacher training and planning a trip to Lisbon. Early, but I can start collecting ideas." },
    ],
    replies: ['Start collecting', 'Not yet'],
  },
  'mum-60th': {
    messages: [
      { role: 'assistant', text: 'A 60th is a big one. Mum keeps every card she gets and loves long letters, so I started there.' },
    ],
    ideas: [idea('mum-photo-book', 'mum-60th', 'Mum', '60th birthday', 'Photo book: sixty moments, with letters from everyone', '€120', 'Linen cover, one page per year, family writes the captions', 'https://www.papier.com/')],
    replies: ['Keep going this way', 'Try something else'],
  },
  'alex-graduation': {
    messages: [
      { role: 'assistant', text: 'Graduation is three months out. Alex wants proper hiking boots and plays board games on Fridays. Early days — I can keep an eye out, or we start now.' },
    ],
    replies: ['Start now', 'Later'],
  },
}
