import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { ScrollPage } from '../components/ScrollPage'
import { Card, ChipRow, PlusButton, PrimaryButton } from '../components/ui'
import type { Person } from '../data/people'
import { inLabel, nextEvent } from '../lib/dates'
import { ensurePerson, useStore } from '../lib/store'

/**
 * Your people (рішення дизайнерки 27.09.2026, після аналізу ієрархії):
 *  - «+» під заголовком — додати людину (той самий патерн, що на Searches);
 *  - картки відсортовані за найближчою подією; без подій — внизу;
 *  - у картці за вагою: ім'я → найближча подія («Birthday · in 5 weeks»,
 *    ближче ніж 2 тижні — синім) → «12 facts» → чипи інтересів в один рядок, скільки вміститься (+N)
 *    → рядок вікторини лише там, де фактів мало (< 5).
 *  - «gifts» у списку немає — історія подарунків живе у профілі.
 * Стилі картки/чипа — з правленого фрейму Figma 5053:7.
 */
const FEW_FACTS = 5
const SOON_DAYS = 14

export function PeopleScreen() {
  const { people } = useStore()
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  // Найближча подія — угорі; без подій — у кінці.
  const sorted = [...people]
    .map((p) => ({ p, next: nextEvent(p.events) }))
    .sort((a, b) => (a.next?.days ?? Infinity) - (b.next?.days ?? Infinity))

  return (
    <ScrollPage title="Your people" floating={<PlusButton label="Add a person" onClick={() => setAdding(true)} />}>
      <div className="flex flex-col gap-[10px]">
        {sorted.map(({ p, next }) => (
          <PersonCard key={p.id} person={p} next={next} onOpen={() => navigate(`/person/?id=${p.id}`)} />
        ))}
      </div>
      {adding && <NewPersonSheet onClose={() => setAdding(false)} />}
    </ScrollPage>
  )
}

function PersonCard({ person: p, next, onOpen }: { person: Person; next: ReturnType<typeof nextEvent>; onOpen: () => void }) {
  const soon = next !== null && next.days <= SOON_DAYS
  // Тап по картці → профіль людини (поки «Coming soon»).
  return (
    <Card onClick={onOpen}>
      <div className="text-[17px] font-extrabold leading-[22px] text-ink">{p.name}</div>
      <div className={`pt-[5px] text-[15px] font-semibold leading-[20px] ${next ? (soon ? 'text-[#5B56E0]' : 'text-ink') : 'text-muted'}`}>
        {next ? `${next.ev.title} · ${inLabel(next.days)}` : 'No dates yet'}
      </div>
      {/* Вторинний рядок: скільки знаємо і скільки приводів заведено (27.09.2026). */}
      <div className="pt-[5px] text-[13px] leading-[17px] text-muted">
        {p.facts.length} {p.facts.length === 1 ? 'fact' : 'facts'} · {p.events.length} {p.events.length === 1 ? 'event' : 'events'}
      </div>
      {p.interests.length > 0 && (
        <div className="pt-[10px]">
          <ChipRow items={p.interests} />
        </div>
      )}
      {p.facts.length < FEW_FACTS && (
        <div className="pt-[10px] text-[13px] font-bold leading-[17px] text-[#5B56E0]">Two questions about {p.name}</div>
      )}
    </Card>
  )
}

/** Лист «New person»: лише ім'я — решта (події, факти) додається у профілі та розмовах. */
function NewPersonSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const ready = name.trim() !== ''
  const submit = () => {
    if (!ready) return
    ensurePerson(name.trim())
    onClose()
  }
  return createPortal(
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative flex h-[320px] flex-col rounded-t-[30px] bg-white px-[15px] pb-[35px] pt-[10px]">
        <div className="mx-auto mb-[10px] h-[5px] w-[35px] rounded-full bg-ink/15" />
        <div className="flex items-center justify-between pb-[15px]">
          <h2 className="text-[22px] font-extrabold text-ink">New person</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-[32px] w-[32px] place-items-center rounded-full bg-lavender text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>
        <div className="flex flex-col gap-[10px]">
          <span className="text-[15px] font-bold text-ink">Who is it</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mum, Dad, Alex…"
            className="h-[50px] w-full rounded-full bg-white px-[20px] text-[16px] font-medium text-ink outline-none ring-1 ring-ink/10 placeholder:text-muted focus:ring-2 focus:ring-periwinkle"
          />
        </div>
        <div className="mt-auto pt-[20px]">
          <PrimaryButton onClick={submit} disabled={!ready}>
            Add
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.getElementById('phone-screen')!,
  )
}
