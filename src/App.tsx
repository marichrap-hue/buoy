import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useShake } from './components/BubbleField'
import { useReducedMotion } from './components/useReducedMotion'
import { pop, soundState } from './lib/sound'
import { PhoneFrame } from './components/PhoneFrame'
import { TabBar } from './components/TabBar'
import { ConversationScreen } from './screens/Conversation'
import { PeopleScreen } from './screens/People'
import { PersonScreen } from './screens/Person'
import { SearchesScreen } from './screens/Searches'
import { ShortlistScreen } from './screens/Shortlist'

// HashRouter — щоб переходи працювали на статичному GitHub Pages без налаштувань сервера.
export default function App() {
  // Струшування: на телефоні — датчик руху; у браузері — кнопка під мокапом
  // (дублер за WCAG 2.5.4; поза екраном застосунку — рішення дизайнерки 26.09.2026).
  const reducedMotion = useReducedMotion()
  const [shakeTick, setShakeTick] = useState(0)
  const shake = useCallback(() => setShakeTick((t) => t + 1), [])
  useShake(shake, !reducedMotion)

  return (
    <HashRouter>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <PhoneFrame>
            <Shell shakeTick={shakeTick} />
          </PhoneFrame>
        </div>
        {/* Прототипна кнопка струсу — під телефоном, поза застосунком. */}
        <div className="flex shrink-0 items-center justify-center gap-[16px] pb-[14px]">
          <button
            type="button"
            onClick={shake}
            disabled={reducedMotion}
            className="rounded-full bg-white/70 px-[14px] py-[7px] text-[13px] font-semibold text-ink hover:bg-white disabled:opacity-40"
          >
            Shake phone
          </button>
          <SoundCheck />
        </div>
      </div>
    </HashRouter>
  )
}

/** Розмова — повноекранна, без таббару (вайрфрейм: замість нього поле відповіді). */
function Shell({ shakeTick }: { shakeTick: number }) {
  const { pathname, search: query } = useLocation()
  const fullScreen = pathname.startsWith('/search/') || pathname === '/search' || pathname.startsWith('/person')
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/searches" element={<SearchesScreen shakeTick={shakeTick} />} />
          {/* key за ?id — інший пошук = новий екран зі своєю перепискою */}
          <Route path="/search" element={<ConversationScreen key={query} />} />
          <Route path="/people" element={<PeopleScreen />} />
          <Route path="/person" element={<PersonScreen key={query} />} />
          <Route path="/shortlist" element={<ShortlistScreen />} />
          <Route path="*" element={<Navigate to="/searches" replace />} />
        </Routes>
      </div>
      {!fullScreen && <TabBar />}
    </>
  )
}

/**
 * Прототипний індикатор звуку під телефоном (27.09.2026): показує, чи браузер
 * уже дозволив аудіо (після першого дотику), і кнопка «Test sound» грає «пух»
 * гарантовано з жесту користувача.
 */
function SoundCheck() {
  const [state, setState] = useState(soundState())
  useEffect(() => {
    const t = window.setInterval(() => setState(soundState()), 500)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-[10px] text-[13px] text-ink">
      <span className="opacity-60">Sound: {state === 'on' ? 'on' : state === 'none' ? 'unsupported' : 'waiting for a tap'}</span>
      <button
        type="button"
        onClick={() => pop(120)}
        className="rounded-full bg-white/70 px-[14px] py-[7px] font-semibold hover:bg-white"
      >
        Test sound
      </button>
    </div>
  )
}
