/**
 * UI-звуки Buoy — синтез у браузері (Web Audio), без файлів.
 * «Пух» лопання бульбашки: короткий синус, що падає по висоті (~90 мс), плюс
 * ледь чутний шумовий «плюсь». Більша бульбашка — нижчий тон.
 *
 * Браузер/iOS дозволяє звук лише після першого дотику: контекст створюється
 * ліниво і «розблоковується» першим pointerdown; до нього виклики мовчать.
 */
let ctx: AudioContext | null = null
let played = 0

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    if (import.meta.env.DEV) (window as unknown as { __sound?: unknown }).__sound = { ctx, pop: () => pop(120), played: () => played }
  }
  return ctx
}

/** Викликати один раз при старті: перший дотик розблоковує звук. */
export function armSound() {
  if (typeof window === 'undefined') return
  const unlock = () => {
    const c = getCtx()
    if (c && c.state === 'suspended') void c.resume()
  }
  // Не знімаємо слухачі: після HMR/сну контекст може знову стати suspended.
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('touchstart', unlock)
  window.addEventListener('keydown', unlock)
}

/** «Пух» — бульбашка лопнула / вилупилась. size — діаметр у px (92…180). */
export function pop(size = 120) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  if (c.state !== 'running') return
  played++
  const t = c.currentTime
  // М'якше (27.09.2026): нижчий старт, повільніше падіння, плавніша атака,
  // довший хвіст і тихіше; шум — глухіший і коротший.
  const f0 = 620 - ((Math.min(Math.max(size, 92), 180) - 92) / 88) * 300
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(f0, t)
  osc.frequency.exponentialRampToValueAtTime(f0 / 3, t + 0.16)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1400
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.018)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
  osc.connect(lp).connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.21)

  // Шумовий «плюсь» — 20 мс, дуже тихо, низька смуга.
  const len = Math.floor(c.sampleRate * 0.02)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = f0
  bp.Q.value = 0.8
  const ng = c.createGain()
  ng.gain.value = 0.05
  src.connect(bp).connect(ng).connect(c.destination)
  src.start(t)
}

// Самореєстрація: модуль перезавантажився (HMR) — слухачі теж. Виклик у main.tsx лишається сумісним.
if (typeof window !== 'undefined') armSound()
