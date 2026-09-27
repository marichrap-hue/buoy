import { useCallback, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useShake } from './components/BubbleField'
import { useReducedMotion } from './components/useReducedMotion'
import { PhoneFrame } from './components/PhoneFrame'
import { TabBar } from './components/TabBar'
import { ConversationScreen } from './screens/Conversation'
import { PeopleScreen } from './screens/People'
import { PersonScreen } from './screens/Person'
import { SearchesScreen } from './screens/Searches'
import { ShortlistScreen } from './screens/Shortlist'
import { splashSeen, SplashScreen } from './screens/Splash'

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
        </div>
      </div>
    </HashRouter>
  )
}

/** Розмова — повноекранна, без таббару (вайрфрейм: замість нього поле відповіді). */
function Shell({ shakeTick }: { shakeTick: number }) {
  const { pathname, search: query } = useLocation()
  const fullScreen = pathname.startsWith('/search/') || pathname === '/search' || pathname.startsWith('/person') || pathname === '/splash'
  // Кожне завантаження сторінки — сплеш (тап на ньому дає дозвіл на звук).
  const seen = splashSeen()
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/searches" element={seen ? <SearchesScreen shakeTick={shakeTick} /> : <Navigate to="/splash" replace />} />
          {/* key за ?id — інший пошук = новий екран зі своєю перепискою */}
          <Route path="/search" element={<ConversationScreen key={query} />} />
          <Route path="/people" element={<PeopleScreen />} />
          <Route path="/person" element={<PersonScreen key={query} />} />
          <Route path="/shortlist" element={<ShortlistScreen />} />
          <Route path="*" element={<Navigate to={seen ? '/searches' : '/splash'} replace />} />
        </Routes>
      </div>
      {!fullScreen && <TabBar />}
    </>
  )
}
