import { useEffect, useRef } from 'react'

/**
 * Живий фон екрана — природне переливання, не механічне (рішення дизайнерки
 * 26.09.2026): кілька великих розмитих плям палітри пливуть кожна своєю
 * плавною траєкторією, як фарба у воді.
 *
 * Траєкторія кожної плями — сума повільних синусоїд із некратними періодами
 * (≈ 1,5–5 хв): рух ніде не зупиняється, не має чітких точок розвороту і
 * практично не повторюється. Плями ще й м'яко «дихають» розміром.
 *
 * Кольори — лише близькі лавандово-periwinkle тони, без білого й блакитного,
 * тож переходи ледь помітні; усі тони на 20% світліші за базові (26.09.2026). При prefers-reduced-motion фон стоїть
 * (бриф, MOTION RULES).
 */

interface Blob {
  color: string
  size: number
  /** Центр у px від лівого-верхнього кута екрана 393 × 852. */
  cx: number
  cy: number
  /** Амплітуди (px) і кутові частоти (рад/с) двох коливань по кожній осі. */
  ax: [number, number]
  fx: [number, number]
  ay: [number, number]
  fy: [number, number]
  phase: number
}

// Шість плям на три рівні світлоти, щоб бузковий мав глибину, а не зливався
// в один тон (рішення дизайнерки 26.09.2026): дві світлі, дві середні, дві
// темні. Діапазон — із палітри брифу: #EDE6FD (найсвітліший) … #999AE2 (холодний).
const BLOBS: Blob[] = [
  // світлі
  { color: '#F0E8FE', size: 560, cx: 70, cy: 140, ax: [110, 45], fx: [0.041, 0.097], ay: [90, 40], fy: [0.033, 0.083], phase: 0 },
  { color: '#E8DCFD', size: 500, cx: 300, cy: 560, ax: [90, 55], fx: [0.031, 0.079], ay: [110, 40], fy: [0.045, 0.103], phase: 2.6 },
  // середні
  { color: '#D5C7F9', size: 600, cx: 90, cy: 600, ax: [120, 40], fx: [0.037, 0.089], ay: [100, 55], fy: [0.023, 0.067], phase: 3.1 },
  { color: '#DDCCFA', size: 480, cx: 230, cy: 60, ax: [100, 35], fx: [0.027, 0.113], ay: [70, 50], fy: [0.043, 0.091], phase: 5.9 },
  // темні
  { color: '#A09CE8', size: 540, cx: 340, cy: 330, ax: [90, 50], fx: [0.029, 0.071], ay: [130, 35], fy: [0.047, 0.109], phase: 1.7 },
  { color: '#B19CF2', size: 520, cx: 320, cy: 800, ax: [80, 60], fx: [0.053, 0.101], ay: [90, 45], fy: [0.031, 0.077], phase: 4.4 },
]

/** Загальна швидкість: 1 — ледь помітно, 2,5 — видно, але спокійно. */
const SPEED = 2.5

function place(b: Blob, t0: number) {
  const t = t0 * SPEED
  const x = b.cx + b.ax[0] * Math.sin(t * b.fx[0] + b.phase) + b.ax[1] * Math.sin(t * b.fx[1] + b.phase * 1.3)
  const y = b.cy + b.ay[0] * Math.sin(t * b.fy[0] + b.phase * 0.7) + b.ay[1] * Math.sin(t * b.fy[1] + b.phase * 1.9)
  const s = 1 + 0.12 * Math.sin(t * (b.fx[0] + b.fy[0]) * 0.8 + b.phase)
  return `translate(${x - b.size / 2}px, ${y - b.size / 2}px) scale(${s})`
}

export function LivingBackground() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Старт не з нуля — щоб при кожному відкритті малюнок був інший.
    const t0 = performance.now() / 1000 - Math.random() * 300
    const apply = (t: number) => BLOBS.forEach((b, i) => {
      const el = refs.current[i]
      if (el) el.style.transform = place(b, t)
    })
    apply(performance.now() / 1000 - t0)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const tick = (now: number) => {
      apply(now / 1000 - t0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    // Основа — ніжний вертикальний градієнт за референсом дизайнерки
    // (27.09.2026): зверху насичений periwinkle, донизу плавно у майже білий
    // лавандово-рожевий. Плями зверху лише ледь колишуть його.
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #A9A6F0 0%, #C3BBF5 38%, #E4DAFA 68%, #F5EEFA 100%)' }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="absolute left-0 top-0 rounded-full will-change-transform"
          style={{
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 50% 50%, ${b.color} 0%, ${b.color}00 68%)`,
            filter: 'blur(40px)',
            opacity: 0.55,
          }}
        />
      ))}
    </div>
  )
}
