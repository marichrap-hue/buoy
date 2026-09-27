import { faCheck, faChevronDown, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { Chip, PrimaryButton } from '../components/ui'
import type { PersonEvent } from '../data/people'
import type { GiftSearch } from '../data/searches'
import { addEvent, addSearch, ensurePerson, useStore } from '../lib/store'

/**
 * Лист «New search» — відкривається з «+» на Searches (рішення 27.09.2026):
 *  1. Who is it for — чипи з Your people або «Someone new» (ім'я вільним вводом).
 *  2. What's the occasion — дропдаун із подій цієї людини; «Add an event» —
 *     пункт у дропдауні, а форма — окремий лист поверх (iOS: Calendar «Add
 *     Calendar», Reminders). Після «Add» подія в профілі людини і вибрана.
 *  3. When — дата підставляється з події, можна змінити.
 * Бюджет тут не питаємо — його з'ясує асистент у розмові.
 */
export function CreateSearchSheet({ onClose }: { onClose: () => void }) {
  const { people } = useStore()
  const navigate = useNavigate()
  const [person, setPerson] = useState('')
  const [custom, setCustom] = useState('')
  const [event, setEvent] = useState<PersonEvent | null>(null)
  const [date, setDate] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)

  const who = person === '__new' ? custom.trim() : person
  const known = people.find((p) => p.name === who)
  const ready = who !== '' && event !== null && date !== ''

  const pickPerson = (name: string) => {
    setPerson(name)
    setEvent(null)
    setDate('')
  }
  const pickEvent = (ev: PersonEvent) => {
    setEvent(ev)
    setDate(ev.date)
  }
  // Нова подія: людина ще може не існувати (Someone new) — тоді створюємо її тут.
  const createEvent = (ev: PersonEvent) => {
    const p = ensurePerson(who)
    addEvent(p.id, ev)
    pickEvent(ev)
  }

  const start = () => {
    if (!ready || !event) return
    const d = new Date(date)
    const daysLeft = Math.max(0, Math.round((d.getTime() - Date.now()) / 86400000))
    const s: GiftSearch = {
      id: `${who}-${event.title}-${date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      person: who,
      emoji: '',
      occasion: event.title,
      daysLeft,
      budget: '',
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      state: 'calm',
    }
    addSearch(s)
    navigate(`/search/?id=${s.id}`)
  }

  // Портал на весь екран телефона — затемнення накриває і статус-бар.
  return createPortal(
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      {/* Затемнення — тап закриває лист */}
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      {/* Фіксована висота — дровер не стрибає ні від «Someone new», ні від випадашки (27.09.2026). */}
      <div className="relative flex h-[600px] flex-col rounded-t-[30px] bg-white px-[15px] pb-[35px] pt-[10px]">
        <div className="mx-auto mb-[10px] h-[5px] w-[35px] rounded-full bg-ink/15" />
        <div className="flex items-center justify-between pb-[15px]">
          <h2 className="text-[22px] font-extrabold text-ink">New search</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-[32px] w-[32px] place-items-center rounded-full bg-lavender text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-[20px]">
          <Field label="Who is it for">
            <div className="flex flex-wrap gap-[5px]">
              {people.map((p) => (
                <button key={p.id} type="button" onClick={() => pickPerson(p.name)}>
                  <Chip active={person === p.name}>{p.name}</Chip>
                </button>
              ))}
              {person === '__new' ? (
                // Чип стає полем тієї ж висоти — рядок не росте.
                <input
                  autoFocus
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Their name"
                  className="h-[26px] w-[140px] rounded-full bg-white px-[10px] text-[13px] font-semibold text-ink outline-none ring-2 ring-periwinkle placeholder:text-muted"
                />
              ) : (
                <button type="button" onClick={() => pickPerson('__new')}>
                  <Chip>Someone new</Chip>
                </button>
              )}
            </div>
          </Field>

          <Field label="What's the occasion">
            <OccasionSelect
              disabled={who === ''}
              events={known?.events ?? []}
              value={event}
              onPick={pickEvent}
              onAdd={() => setAddingEvent(true)}
            />
          </Field>

          <Field label="When">
            <Input type="date" value={date} onChange={setDate} />
          </Field>
        </div>

        <div className="mt-auto pt-[20px]">
          <PrimaryButton onClick={start} disabled={!ready}>
            Start a search
          </PrimaryButton>
        </div>
      </div>
      {addingEvent && (
        <NewEventSheet
          person={who}
          onClose={() => setAddingEvent(false)}
          onCreate={(ev) => {
            createEvent(ev)
            setAddingEvent(false)
          }}
        />
      )}
    </div>,
    document.getElementById('phone-screen')!,
  )
}

/** Лист «New event» поверх «New search»: назва, дата, Once / Every year. */
function NewEventSheet({ person, onClose, onCreate }: { person: string; onClose: () => void; onCreate: (e: PersonEvent) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(true)
  const ready = title.trim() !== '' && date !== ''
  const submit = () => {
    if (!ready) return
    onCreate({ id: `${title}-${date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: title.trim(), date, recurring })
  }
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative flex h-[420px] flex-col rounded-t-[30px] bg-white px-[15px] pb-[35px] pt-[10px]">
        <div className="mx-auto mb-[10px] h-[5px] w-[35px] rounded-full bg-ink/15" />
        <div className="flex items-center justify-between pb-[15px]">
          <h2 className="text-[22px] font-extrabold text-ink">New event for {person}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-[32px] w-[32px] place-items-center rounded-full bg-lavender text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>
        <div className="flex flex-col gap-[20px]">
          <Field label="What is it">
            <Input value={title} onChange={setTitle} placeholder="Birthday, St. Nicholas Day, anniversary" autoFocus />
          </Field>
          <Field label="When">
            <Input type="date" value={date} onChange={setDate} />
          </Field>
          <div className="flex gap-[5px]">
            <button type="button" onClick={() => setRecurring(false)}>
              <Chip active={!recurring}>Once</Chip>
            </button>
            <button type="button" onClick={() => setRecurring(true)}>
              <Chip active={recurring}>Every year</Chip>
            </button>
          </div>
        </div>
        <div className="mt-auto pt-[20px]">
          <PrimaryButton onClick={submit} disabled={!ready}>
            Add event
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

/** Дропдаун подій людини з пунктом «Add an event» у самому списку. */
function OccasionSelect({
  disabled,
  events,
  value,
  onPick,
  onAdd,
}: {
  disabled: boolean
  events: PersonEvent[]
  value: PersonEvent | null
  onPick: (e: PersonEvent) => void
  onAdd: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[50px] w-full items-center justify-between rounded-full bg-lavender px-[20px] text-[16px] font-medium text-ink disabled:opacity-40"
      >
        <span className={value ? '' : 'text-muted'}>{value ? value.title : disabled ? 'Choose a person first' : 'Choose an event'}</span>
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 14 }} className={open ? 'rotate-180' : ''} />
      </button>

      {open && (
        // Накладка поверх полів нижче, не в потоці — дровер не міняє висоту (27.09.2026).
        <div className="absolute inset-x-0 top-full z-20 mt-[5px] overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_rgba(23,20,54,0.14)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onAdd()
            }}
            className="flex h-[50px] w-full items-center gap-[10px] px-[20px] text-[16px] font-bold text-[#5B56E0] hover:bg-lavender"
          >
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} />
            Add an event
          </button>
          <div className="max-h-[200px] overflow-y-auto [scrollbar-width:none]">
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onPick(e)
                  setOpen(false)
                }}
                className="flex h-[50px] w-full items-center justify-between px-[20px] text-left text-[16px] text-ink hover:bg-lavender"
              >
                <span className="font-medium">{e.title}</span>
                <span className="flex items-center gap-[10px] text-[13px] text-muted">
                  {fmt(e.date)}
                  {e.recurring && ' · yearly'}
                  {value?.id === e.id && <FontAwesomeIcon icon={faCheck} className="text-[#5B56E0]" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[15px] font-bold text-ink">{label}</span>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'date'
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-[50px] w-full rounded-full bg-white px-[20px] text-[16px] font-medium text-ink outline-none ring-1 ring-ink/10 placeholder:text-muted focus:ring-2 focus:ring-periwinkle"
    />
  )
}
