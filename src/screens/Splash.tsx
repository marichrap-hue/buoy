import { useNavigate } from 'react-router-dom'

import { unlockSound } from '../lib/sound'

/**
 * Сплеш при відкритті (27.09.2026): лобстерний буй на хвилі, назва, слоган. Тап будь-де →
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
      <BuoyMark width={313} />
      <div className="pt-[30px] text-[44px] font-extrabold leading-[50px] tracking-[-0.02em]">Buoy</div>
      <div className="pt-[10px] text-[16px] font-semibold text-ink/80">We won't let you drown in the search for gifts.</div>
      <div className="absolute bottom-[80px] text-[13px] font-semibold text-ink/50">Tap to begin</div>
    </button>
  )
}

/** Знак: лобстерний буй на хвилі — той самий, що у public/brand (затверджено 27.09.2026). */
export function BuoyMark({ width }: { width: number }) {
  return (
    <svg width={width} height={(width * 340) / 400} viewBox="0 30 400 340" aria-hidden>
      <g transform="rotate(12 200 220)">
        <path d="M200 60 C 190 60, 186 68, 186 78 L 186 96 L 214 96 L 214 78 C 214 68, 210 60, 200 60 Z" fill="#171436" opacity="0.85" />
        <rect x="191" y="96" width="18" height="48" rx="4" fill="#5B56E0" />
        <path d="M200 140 C 258 140, 272 190, 272 236 C 272 300, 244 340, 200 340 C 156 340, 128 300, 128 236 C 128 190, 142 140, 200 140 Z" fill="#807CF7" />
        <path d="M129 214 L 271 214 L 272 236 L 128 236 Z" fill="#FFFFFF" />
        <path d="M128 236 L 272 236 L 268 268 L 132 268 Z" fill="#BED2FB" />
        <path d="M132 268 L 268 268 C 262 316, 236 340, 200 340 C 164 340, 138 316, 132 268 Z" fill="#DEC5FB" />
        <rect x="191" y="338" width="18" height="34" rx="6" fill="#5B56E0" />
        <path d="M158 160 C 150 178, 148 196, 150 210" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
      </g>
      <path d="M40 296 C 87 274, 134 318, 200 296 S 313 274, 360 296" fill="none" stroke="#807CF7" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}
