import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useStore } from '../lib/store'

/**
 * Профіль людини (бриф SCREEN 3) — поки заглушка «Coming soon» (27.09.2026).
 * Шапка як у розмові: «‹» назад на Your people, ім'я по центру.
 */
export function PersonScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { people } = useStore()
  const person = people.find((p) => p.id === params.get('id'))
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[44px] shrink-0 items-center justify-between px-[10px]">
        <button type="button" aria-label="Back" onClick={() => navigate('/people')} className="grid h-[44px] w-[44px] place-items-center text-ink">
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
        </button>
        <div className="text-[17px] font-extrabold text-ink">{person?.name ?? 'Person'}</div>
        <div className="w-[44px]" />
      </div>
      <div className="flex flex-1 items-center justify-center pb-[44px]">
        <span className="text-[22px] font-extrabold text-ink">Coming soon</span>
      </div>
    </div>
  )
}
