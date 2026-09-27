import { useNavigate } from 'react-router-dom'

import { unlockSound } from '../lib/sound'

/**
 * Сплеш при відкритті (27.09.2026): назва, слоган; знак — після затвердження. Тап будь-де →
 * Searches. Тап тут — той самий «перший дотик», якого браузер/iOS вимагає для
 * звуку, тож вилуплення бульбашок далі йде вже з «пухом».
 * Показується при КОЖНОМУ завантаженні сторінки (прапорець у пам'яті, не в
 * sessionStorage): після перезавантаження браузер знову вимагає дотику для
 * звуку, тож без сплешу бульбашки вилуплювались би тихо (27.09.2026).
 */
let seenThisLoad = false
export const splashSeen = () => seenThisLoad

export function SplashScreen() {
  const navigate = useNavigate()
  const go = () => {
    unlockSound()
    seenThisLoad = true
    navigate('/searches', { replace: true })
  }
  return (
    <button type="button" onClick={go} className="flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center text-ink">
      {/* Знак додамо, коли дизайнерка затвердить буйок (не рятувальний круг). */}
      <div className="text-[44px] font-extrabold leading-[50px] tracking-[-0.02em]">Buoy</div>
      <div className="pt-[10px] text-[16px] font-semibold text-ink/80">We won't let you drown in the search for gifts.</div>
      <div className="absolute bottom-[80px] text-[13px] font-semibold text-ink/50">Tap to begin</div>
    </button>
  )
}
