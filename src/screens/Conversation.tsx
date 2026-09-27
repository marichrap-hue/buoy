import { faArrowUp, faArrowUpRightFromSquare, faBookmark, faCheck, faChevronLeft, faEllipsis, faMicrophone, faPen, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import { CONVERSATIONS } from '../data/conversations'
import { addFact, type Idea, markBought, markRead, removeSearch, saveIdea, updateSearch, useStore } from '../lib/store'
import { toast } from '../lib/toast'

/**
 * Розмова пошуку — серцевина продукту (бриф SCREEN 4). Вайрфрейм — лише
 * нарис; екран зібрано за рішеннями 27.09.2026:
 *  - шапка: «‹» назад, «Mum · Mother's Day», «···» (iOS More — Messages,
 *    Mail) → контекстне меню (UIMenu): «Edit search» → дровер з подією,
 *    датою, бюджетом; «Delete search» (destructive) → попап підтвердження
 *    Cancel / Delete (рішення 27.09.2026);
 *  - чипи контексту: дата · бюджет (коли відомий); подія — в заголовку;
 *  - асистент відкриває тим, що знає, і ставить ОДНЕ питання; відповідати
 *    можна кнопками або текстом у «Reply» — обидва шляхи ведуть далі;
 *  - картка «New thing I learned · Keep it?» у стрічці там, де це зрозуміло;
 *  - ідеї — 2–3 картки: «Save» (у Shortlist) і «I bought this» (закриває
 *    пошук, подарунок — в історію людини);
 *  - таб-бару і струсу тут немає (екран із вводом тексту).
 * Сценарій брифу (5 тапів) заскриптовано для «Mum / Mother's Day»; решта
 * пошуків з моку мають готову переписку під свій стан (data/conversations),
 * нові — відкриття асистента і загальні відповіді.
 */
type Msg = { role: 'assistant' | 'user'; text: string } | { role: 'fact' } | { role: 'ideas' }

const IDEAS: Idea[] = [
  {
    id: 'idea-workshop',
    title: 'Watercolour weekend workshop',
    price: '€45',
    note: 'Small group, materials included',
    url: 'https://www.craftcourses.com/',
    searchId: 'mum-mothers-day',
    person: 'Mum',
    occasion: "Mother's Day",
  },
  {
    id: 'idea-sketchbook',
    title: 'Hand-bound sketchbook',
    price: '€32',
    note: 'Cold-pressed paper, takes wet washes',
    url: 'https://www.etsy.com/',
    searchId: 'mum-mothers-day',
    person: 'Mum',
    occasion: "Mother's Day",
  },
]

export function ConversationScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { people, shortlist, searches } = useStore()
  // Живий пошук зі стору; після «I bought this» він зникає — тоді екран
  // тримає останній знімок, а не перескакує на інший пошук.
  const live = searches.find((s) => s.id === params.get('id'))
  const snapshot = useRef(live)
  if (live) snapshot.current = live
  const search = live ?? snapshot.current
  const person = people.find((p) => p.name === search?.person)
  const scripted = search?.id === 'mum-mothers-day'

  // Кроки сценарію: 0 — відкриття, 1 — після відповіді (факт + питання), 2 — ідеї.
  const [step, setStep] = useState(0)
  const [factState, setFactState] = useState<'open' | 'kept' | 'dismissed'>('open')
  const [draft, setDraft] = useState('')
  /** Куплені ідеї — лишаються в переписці, картка відрізняється; купити можна кілька (27.09.2026). */
  const [boughtIds, setBoughtIds] = useState<string[]>([])
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const seed = search ? CONVERSATIONS[search.id] : undefined
  const [messages, setMessages] = useState<Msg[]>(() =>
    scripted
      ? [{ role: 'assistant', text: 'I already know Mum likes ceramics, plants and watercolour. Would you like something useful for her hobby, or something more personal?' }]
      : seed
        ? [...seed.messages, ...(seed.ideas?.length ? [{ role: 'ideas' } as const] : [])]
        : [
            {
              role: 'assistant',
              text:
                person && person.facts.length
                  ? `Here's what I remember about ${search?.person}: ${person.facts.slice(0, 2).join('; ').toLowerCase()}. What kind of gift are you leaning towards?`
                  : `I don't know ${search?.person ?? 'them'} yet. Tell me one thing about them, or what kind of gift you're leaning towards.`,
            },
          ],
  )
  // Кнопки-відповіді готової переписки — до першої відповіді.
  const [seedReplies, setSeedReplies] = useState<string[] | undefined>(seed?.replies)
  // Ідеї на екрані: сценарій — після кроку 2; готова переписка — одразу.
  const ideas: Idea[] = scripted ? (step >= 2 ? IDEAS : []) : (seed?.ideas ?? [])

  // Відкрили розмову — непрочитане знято (обводка на бульбашці зникає).
  useEffect(() => {
    if (search) markRead(search.id)
  }, [search])

  // Скрол лише стрічки (scrollIntoView тягнув би й сторінку прототипу).
  const feedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, step, factState])

  if (!search) {
    navigate('/searches', { replace: true })
    return null
  }

  const reply = (text: string) => {
    if (scripted && step === 0) {
      setMessages((m) => [
        ...m,
        { role: 'user', text },
        { role: 'assistant', text: "Then I'll look for something small and warm around watercolour — not a plain paint set." },
        { role: 'fact' },
      ])
      setStep(1)
    } else if (scripted && step === 1) {
      setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: "Here are two things she'd actually use." }, { role: 'ideas' }])
      setStep(2)
    } else {
      // Поза сценарієм: одне уточнення у відповідь, щоб розмова не глухла.
      setSeedReplies(undefined)
      setMessages((m) => [
        ...m,
        { role: 'user', text },
        { role: 'assistant', text: 'Got it. One more thing: should this be something to use every day, or something for the occasion itself?' },
      ])
    }
  }
  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    reply(text)
  }
  const keepFact = () => {
    if (person) addFact(person.id, "She's taken up watercolour")
    setFactState('kept')
  }
  const bought = (idea: Idea) => {
    setBoughtIds((ids) => [...ids, idea.id])
    setMessages((m) => [...m, { role: 'assistant', text: `Lovely. After ${search.date} I'll ask how it landed.` }])
    markBought(search.id, idea.id)
  }

  const renderIdeas = () => (
    <div className={`${ASSISTANT_BUBBLE} mr-[25px] flex flex-col gap-[10px] p-[10px]`}>
      {ideas.map((idea) => {
        const saved = shortlist.some((i) => i.id === idea.id)
        const isBought = boughtIds.includes(idea.id)
        return (
          <div
            key={idea.id}
            className={`relative rounded-[20px] p-[15px] ${isBought ? 'bg-[#EFE6FF] ring-2 ring-[#807CF7]' : 'bg-white'}`}
          >
            {/* Куплена: тонована картка з кільцем і позначкою над назвою */}
            {isBought && (
              <div className="flex items-center gap-[5px] pb-[5px] text-[13px] font-bold text-[#5B56E0]">
                <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12 }} />
                Bought · in {search.person}'s gifts
              </div>
            )}
            <a href={idea.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-[10px]">
              <span className="text-[17px] font-extrabold leading-[22px] text-[#5B56E0]">{idea.title}</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: 13 }} className="mt-[5px] shrink-0 text-[#5B56E0]" />
            </a>
            <div className="pt-[5px] text-[14px] text-ink">
              {idea.price} · {idea.note}
            </div>
            {!isBought && (
              <div className="flex items-center gap-[10px] pt-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    saveIdea(idea)
                    toast('Saved to Shortlist', faBookmark)
                  }}
                  disabled={saved}
                  className={`rounded-full px-[15px] py-[10px] text-[14px] font-bold ${saved ? 'bg-[#EFE6FF] text-ink' : 'bg-[#5B56E0] text-white'}`}
                >
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={() => bought(idea)} className="rounded-full bg-[#EFE6FF] px-[15px] py-[10px] text-[14px] font-bold text-ink">
                  I bought this
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Верхній край: стрічка проходить під шапкою і чипами, розмиваючись (soft scroll edge, як на сторінках). Від верху екрана, з-під статус-бара. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[-54px] z-[5] h-[190px] backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          background: 'linear-gradient(to bottom, rgba(179,174,242,0.85) 55%, rgba(179,174,242,0) 100%)',
        }}
      />
      {/* Нижній край: під полем відповіді — той самий ефект знизу вгору. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[130px] backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          background: 'linear-gradient(to top, rgba(232,222,250,0.85) 50%, rgba(232,222,250,0) 100%)',
        }}
      />
      {/* Nav bar */}
      <div className="relative z-10 flex h-[44px] shrink-0 items-center justify-between px-[10px]">
        <button type="button" aria-label="Back" onClick={() => navigate('/searches')} className="grid h-[44px] w-[44px] place-items-center text-ink">
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
        </button>
        <div className="text-[17px] font-extrabold text-ink">
          {search.person} · {search.occasion}
        </div>
        {/* «···» — iOS More: контекстне меню дій над цією розмовою, не користувача. */}
        <div className="relative">
          <button
            type="button"
            aria-label="Search options"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="grid h-[36px] w-[36px] place-items-center rounded-full border border-white/70 bg-white/30 text-ink backdrop-blur-xl"
          >
            <FontAwesomeIcon icon={faEllipsis} style={{ fontSize: 16 }} />
          </button>
          {menu && (
            <ContextMenu
              onClose={() => setMenu(false)}
              items={[
                { label: 'Edit search', icon: faPen, onSelect: () => setEditing(true) },
                { label: 'Delete search', icon: faTrashCan, destructive: true, onSelect: () => setConfirmDelete(true) },
              ]}
            />
          )}
        </div>
      </div>
      {/* Контекст: дата · бюджет (коли відомий). Подія вже в заголовку — не дублюємо (27.09.2026). */}
      <div className="relative z-10 flex shrink-0 gap-[5px] overflow-x-auto px-[15px] py-[10px] [scrollbar-width:none]">
        <Chip>{search.date}</Chip>
        {search.budget && <Chip>{search.budget}</Chip>}
      </div>

      {/* Стрічка */}
      {/* Стрічка — на весь екран під шапкою і полем відповіді (паддінги = їхні висоти). */}
      <div ref={feedRef} className="absolute inset-0 overflow-y-auto px-[15px] pb-[110px] pt-[100px] [scrollbar-width:none]">
        <div className="flex flex-col gap-[15px]">
          {messages.map((m, i) =>
            m.role === 'fact' ? (
              <FactCard key={i} state={factState} count={person?.facts.length ?? 0} onKeep={keepFact} onDismiss={() => setFactState('dismissed')} />
            ) : m.role === 'ideas' ? (
              // Ідеї — теж відповідь асистента: картки всередині його бульбашки, з посиланням на сайт.
              <div key={i}>{renderIdeas()}</div>
            ) : (
              <Bubble key={i} msg={m} />
            ),
          )}

          {scripted && step === 0 && <Replies options={['Something more personal', 'Useful for her hobby']} onPick={reply} />}

          {scripted && step === 1 && (
            <>
              <Bubble msg={{ role: 'assistant', text: 'Which feels closer: a personalised sketchbook, a workshop, or something for her creative corner?' }} />
              <Replies options={['A workshop', 'The sketchbook', 'Her creative corner']} onPick={reply} />
            </>
          )}

          {seedReplies && <Replies options={seedReplies} onPick={reply} />}

        </div>
      </div>

      {/* Поле відповіді: текст → «надіслати» (стрілка вгору, iOS Messages); порожнє → мікрофон. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-[15px] pb-[35px] pt-[10px]">
        <div className="flex h-[52px] items-center rounded-full bg-white/70 pl-[20px] pr-[5px] backdrop-blur-xl">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            placeholder="Reply"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-muted"
          />
          {draft.trim() ? (
            <button type="button" aria-label="Send" onClick={send} className="grid h-[40px] w-[40px] place-items-center rounded-full bg-[#5B56E0] text-white">
              <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 16 }} />
            </button>
          ) : (
            <span className="grid h-[40px] w-[40px] place-items-center text-ink">
              <FontAwesomeIcon icon={faMicrophone} style={{ fontSize: 18 }} />
            </span>
          )}
        </div>
      </div>

      {editing && <EditSearchSheet searchId={search.id} occasion={search.occasion} budget={search.budget} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this search?"
          text={`${search.person} · ${search.occasion}. The conversation and its ideas will be gone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeSearch(search.id)
            navigate('/searches')
          }}
        />
      )}
    </div>
  )
}

/**
 * Бульбашки чату (рішення 27.09.2026): асистент — зліва, скляна (біла 45%
 * з блюром), хвостик зліва; людина — справа, біла, хвостик справа.
 */
const ASSISTANT_BUBBLE = 'mr-[50px] rounded-[20px] rounded-bl-[5px] border border-white/60 bg-white/45 px-[15px] py-[10px] text-[16px] leading-[22px] text-ink backdrop-blur-xl'

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role !== 'assistant' && msg.role !== 'user') return null
  return msg.role === 'assistant' ? (
    <p className={ASSISTANT_BUBBLE}>{msg.text}</p>
  ) : (
    <p className="ml-[50px] self-end rounded-[20px] rounded-br-[5px] bg-white px-[15px] py-[10px] text-[16px] leading-[22px] text-ink">{msg.text}</p>
  )
}

function Replies({ options, onPick }: { options: string[]; onPick: (t: string) => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-[10px]">
      {options.map((o) => (
        <SecondaryButton key={o} onClick={() => onPick(o)}>
          {o}
        </SecondaryButton>
      ))}
    </div>
  )
}

/** Картка нового факту — копі з брифу: «New thing I learned · Keep it?». */
function FactCard({ state, count, onKeep, onDismiss }: { state: 'open' | 'kept' | 'dismissed'; count: number; onKeep: () => void; onDismiss: () => void }) {
  if (state === 'dismissed') return null
  return (
    <div className="rounded-[20px] bg-lavender p-[15px]">
      <div className="flex items-start justify-between gap-[10px]">
        <div>
          <div className="text-[13px] font-semibold text-ink/70">{state === 'kept' ? `Kept · ${count} facts about Mum` : 'New thing I learned'}</div>
          <div className="pt-[5px] text-[16px] font-bold text-ink">She's taken up watercolour</div>
        </div>
        {state === 'open' && (
          <button type="button" aria-label="Dismiss" onClick={onDismiss} className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-white/70 text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        )}
      </div>
      {state === 'open' && (
        <div className="pt-[10px]">
          <button type="button" onClick={onKeep} className="rounded-full bg-[#5B56E0] px-[15px] py-[10px] text-[14px] font-bold text-white">
            Keep it
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Контекстне меню за iOS UIMenu: список під кнопкою «···», пункт = текст +
 * іконка праворуч, destructive — червоним. Тап поза меню закриває.
 */
function ContextMenu({
  items,
  onClose,
}: {
  items: { label: string; icon: typeof faPen; destructive?: boolean; onSelect: () => void }[]
  onClose: () => void
}) {
  return (
    <>
      {createPortal(<button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 z-10" />, document.getElementById('phone-screen')!)}
      <div className="absolute right-0 top-[41px] z-20 w-[220px] overflow-hidden rounded-[20px] bg-white/90 shadow-[0_10px_30px_rgba(23,20,54,0.18)] backdrop-blur-xl">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => {
              onClose()
              it.onSelect()
            }}
            className={`flex h-[50px] w-full items-center justify-between px-[20px] text-[16px] font-semibold active:bg-lavender ${it.destructive ? 'text-[#E5484D]' : 'text-ink'}`}
          >
            {it.label}
            <FontAwesomeIcon icon={it.icon} style={{ fontSize: 15 }} />
          </button>
        ))}
      </div>
    </>
  )
}

/** Попап підтвердження руйнівної дії — Cancel / Delete (iOS alert, у стилі Buoy). */
function ConfirmDialog({
  title,
  text,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  text: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return createPortal(
    <div className="absolute inset-0 z-30 flex items-center justify-center px-[35px]">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-ink/30" />
      <div role="alertdialog" className="relative w-full rounded-[30px] bg-white p-[20px] text-center shadow-[0_20px_60px_rgba(23,20,54,0.25)]">
        <div className="text-[17px] font-extrabold text-ink">{title}</div>
        <p className="pt-[5px] text-[14px] leading-[19px] text-ink/80">{text}</p>
        <div className="flex gap-[10px] pt-[20px]">
          <button type="button" onClick={onCancel} className="h-[45px] flex-1 rounded-full bg-[#EFE6FF] text-[15px] font-bold text-ink">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-[45px] flex-1 rounded-full bg-[#E5484D] text-[15px] font-bold text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('phone-screen')!,
  )
}

/** Дровер «Edit search»: подія, дата, бюджет. Видалення — окремо, через меню й підтвердження. */
function EditSearchSheet({ searchId, occasion, budget, onClose }: { searchId: string; occasion: string; budget: string; onClose: () => void }) {
  const [occ, setOcc] = useState(occasion)
  const [date, setDate] = useState('')
  const [bud, setBud] = useState(budget)
  const save = () => {
    const patch: Parameters<typeof updateSearch>[1] = { occasion: occ.trim() || occasion, budget: bud.trim() }
    if (date) {
      const d = new Date(date)
      patch.date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      patch.daysLeft = Math.max(0, Math.round((d.getTime() - Date.now()) / 86400000))
    }
    updateSearch(searchId, patch)
    onClose()
  }
  const input = 'h-[50px] w-full rounded-full bg-white px-[20px] text-[16px] font-medium text-ink outline-none ring-1 ring-ink/10 placeholder:text-muted focus:ring-2 focus:ring-periwinkle'
  return createPortal(
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative flex h-[480px] flex-col rounded-t-[30px] bg-white px-[15px] pb-[35px] pt-[10px]">
        <div className="mx-auto mb-[10px] h-[5px] w-[35px] rounded-full bg-ink/15" />
        <div className="flex items-center justify-between pb-[15px]">
          <h2 className="text-[22px] font-extrabold text-ink">Edit search</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-[32px] w-[32px] place-items-center rounded-full bg-lavender text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>
        <div className="flex flex-col gap-[20px]">
          <label className="flex flex-col gap-[10px]">
            <span className="text-[15px] font-bold text-ink">Occasion</span>
            <input value={occ} onChange={(e) => setOcc(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-[10px]">
            <span className="text-[15px] font-bold text-ink">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-[10px]">
            <span className="text-[15px] font-bold text-ink">Budget</span>
            <input value={bud} onChange={(e) => setBud(e.target.value)} placeholder="under €50" className={input} />
          </label>
        </div>
        <div className="mt-auto pt-[20px]">
          <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
      </div>
    </div>,
    document.getElementById('phone-screen')!,
  )
}
