import { faCircleNodes, faList, faUser, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { Bubbles } from '../components/Bubbles'
import { ScrollPage } from '../components/ScrollPage'
import { useReducedMotion } from '../components/useReducedMotion'
import { Card, PlusButton } from '../components/ui'
import { daysLeftLabel, type GiftSearch, STATE_LABEL } from '../data/searches'
import { useStore } from '../lib/store'
import { CreateSearchSheet } from './CreateSearchSheet'

// Висота поля бульбашок: екран 852 − статус-бар 54 − заголовок 53 − рядок «+» 75 − таббар 83.
const FIELD_HEIGHT = 852 - 54 - 53 - 75 - 83
// Кнопка «+»: центр (15 + 25, 30) у рядку над полем → у координатах поля y = −30;
// вилуплюються трохи нижче краю, щоб не застрягати у верхній стіні.
const SPAWN_AT = { x: 40, y: 12 }

/**
 * Searches — домашня: бульбашки (або список — той самий набір), «+» під
 * заголовком відкриває лист створення пошуку (рішення 27.09.2026; лого
 * прибрано з робочого екрана). При prefers-reduced-motion стартовий вид —
 * список (бриф, MOTION RULES).
 */
export function SearchesScreen({ shakeTick }: { shakeTick: number }) {
  const reducedMotion = useReducedMotion()
  const { searches } = useStore()
  const [view, setView] = useState<'bubbles' | 'list'>(reducedMotion ? 'list' : 'bubbles')
  const [creating, setCreating] = useState(false)
  const [account, setAccount] = useState(false)
  const navigate = useNavigate()
  const open = (s: GiftSearch) => navigate(`/search/?id=${s.id}`)

  return (
    <ScrollPage
      title="Searches"
      right={
        <div className="flex items-center gap-[10px]">
          <ViewToggle view={view} onChange={setView} />
          {/* Аватар = вхід у налаштування користувача (iOS: App Store, Music — кружечок біля великого заголовка). */}
          <button
            type="button"
            aria-label="Account"
            onClick={() => setAccount(true)}
            className="grid h-[36px] w-[36px] place-items-center rounded-full bg-[#5B56E0] text-white active:opacity-80"
          >
            <FontAwesomeIcon icon={faUser} style={{ fontSize: 15 }} />
          </button>
        </div>
      }
      floating={<PlusButton label="New search" onClick={() => setCreating(true)} />}
      scroll={view === 'list'}
    >
      {view === 'bubbles' ? (
        <div className="-mx-[15px]">
          <Bubbles searches={searches} height={FIELD_HEIGHT} spawnAt={SPAWN_AT} shakeTick={shakeTick} onOpen={open} />
        </div>
      ) : (
        <SearchList searches={searches} onOpen={open} />
      )}
      {creating && <CreateSearchSheet onClose={() => setCreating(false)} />}
      {account && <AccountSheet onClose={() => setAccount(false)} />}
    </ScrollPage>
  )
}

function ViewToggle({ view, onChange }: { view: 'bubbles' | 'list'; onChange: (v: 'bubbles' | 'list') => void }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex rounded-full bg-white/50 p-[5px]">
      {(
        [
          { v: 'bubbles', icon: faCircleNodes, label: 'Bubbles' },
          { v: 'list', icon: faList, label: 'List' },
        ] as const
      ).map(({ v, icon, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={view === v}
          aria-label={label}
          onClick={() => onChange(v)}
          className={`grid h-[30px] w-[35px] place-items-center rounded-full ${view === v ? 'bg-white text-[#5B56E0]' : 'text-ink'}`}
        >
          <FontAwesomeIcon icon={icon} style={{ fontSize: 14 }} />
        </button>
      ))}
    </div>
  )
}

/**
 * Список — той самий набір пошуків картками (27.09.2026): без заголовка
 * секції (він один — «Searches»), у картці: ім'я · подія → «3 days left ·
 * 10 May» → стан; бюджет у списку не потрібен (він у розмові). Непрочитане —
 * periwinkle-кільце, як у бульбашок; лічильник ідей уже в тексті стану.
 */
function SearchList({ searches, onOpen }: { searches: GiftSearch[]; onOpen: (s: GiftSearch) => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      {searches.map((s) => (
        <Card key={s.id} onClick={() => onOpen(s)} className={s.unread ? 'ring-2 ring-[#807CF7]' : ''}>
          <div className="text-[17px] font-extrabold leading-[22px] text-ink">
            {s.person} · {s.occasion}
          </div>
          <div className="pt-[5px] text-[15px] font-semibold leading-[20px] text-ink">
            {daysLeftLabel(s.daysLeft)} <span className="font-medium text-muted">· {s.date}</span>
          </div>
          <div className={`pt-[5px] text-[13px] leading-[17px] ${s.unread ? 'font-bold text-[#5B56E0]' : 'text-muted'}`}>{STATE_LABEL[s.state](s)}</div>
        </Card>
      ))}
    </div>
  )
}

/** Лист акаунта / налаштувань — поки заглушка (налаштування — після основного флоу). */
function AccountSheet({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative flex h-[420px] flex-col rounded-t-[30px] bg-white px-[15px] pb-[35px] pt-[10px]">
        <div className="mx-auto mb-[10px] h-[5px] w-[35px] rounded-full bg-ink/15" />
        <div className="flex items-center justify-between pb-[15px]">
          <h2 className="text-[22px] font-extrabold text-ink">Account</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-[32px] w-[32px] place-items-center rounded-full bg-lavender text-ink">
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[22px] font-extrabold text-ink">Coming soon</span>
        </div>
      </div>
    </div>,
    document.getElementById('phone-screen')!,
  )
}
