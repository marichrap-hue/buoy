import { useNavigate } from 'react-router-dom'

import { unlockSound } from '../lib/sound'

/**
 * Сплеш при відкритті (27.09.2026): знак-буй, назва, слоган. Тап будь-де →
 * Searches. Тап тут — той самий «перший дотик», якого браузер/iOS вимагає для
 * звуку, тож вилуплення бульбашок далі йде вже з «пухом».
 * Показується раз на сесію (sessionStorage), решта переходів — одразу в застосунок.
 */
export const SPLASH_KEY = 'buoy-splash-seen'

export function SplashScreen() {
  const navigate = useNavigate()
  const go = () => {
    unlockSound()
    try {
      sessionStorage.setItem(SPLASH_KEY, '1')
    } catch {
      /* приватний режим — просто йдемо далі */
    }
    navigate('/searches', { replace: true })
  }
  return (
    <button type="button" onClick={go} className="flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center text-ink">
      <BuoyMark size={156} />
      <div className="pt-[45px] text-[44px] font-extrabold leading-[50px] tracking-[-0.02em]">Buoy</div>
      <div className="pt-[10px] text-[16px] font-semibold text-ink/80">We won't let you sink in gift-keeping.</div>
      <div className="absolute bottom-[80px] text-[13px] font-semibold text-ink/50">Tap to begin</div>
    </button>
  )
}

/** Знак: рятівний круг на хвилі — той самий, що у public/brand/mark.svg. */
export function BuoyMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <linearGradient id="buoy-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8E8BF5" />
          <stop offset="1" stopColor="#5B56E0" />
        </linearGradient>
      </defs>
      <g transform="translate(100 96)">
        <circle r="60" fill="none" stroke="url(#buoy-ring)" strokeWidth="30" />
        <g stroke="#FFFFFF" strokeWidth="30" fill="none" opacity="0.92">
          <path d="M0 -60 A60 60 0 0 1 42 -42" />
          <path d="M60 0 A60 60 0 0 1 42 42" />
          <path d="M0 60 A60 60 0 0 1 -42 42" />
          <path d="M-60 0 A60 60 0 0 1 -42 -42" />
        </g>
        <path d="M-100 48 C -62 30, -32 66, 0 48 S 62 30, 100 48" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" opacity="0.95" />
        <path d="M-100 48 C -62 30, -32 66, 0 48 S 62 30, 100 48" fill="none" stroke="#807CF7" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
