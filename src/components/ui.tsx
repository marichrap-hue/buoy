import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'

/**
 * Базові поверхні Buoy. Значення — з правленого дизайнеркою фрейму Figma
 * «Buoy / Your people» (5053:7, 27.09.2026): картка #F7F3FF, радіус 30,
 * паддінг 15, тінь 0/6/24 6%; чип #EFE6FF, паддінг 5/10, текст 13 SemiBold
 * чорнилом (дрібний текст → лише чорнило, CONTRAST RULE).
 */
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-[30px] bg-[#F7F3FF] p-[15px] text-left shadow-[0_6px_24px_rgba(23,20,54,0.06)] ${className}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`block w-full ${cls}`}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  )
}

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-[10px] py-[5px] text-[13px] font-semibold leading-none ${
        active ? 'bg-[#5B56E0] text-white' : 'bg-[#EFE6FF] text-ink'
      }`}
    >
      {children}
    </span>
  )
}

/** Первинна кнопка: #5B56E0 з білим (5.45:1) — #807CF7 з білим лише 3.4:1. */
export function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-[#5B56E0] py-[15px] text-[16px] font-bold text-white active:opacity-80 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-[15px] py-[10px] text-[14px] font-bold text-ink shadow-[0_4px_14px_rgba(23,20,54,0.08)] active:opacity-80"
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="px-[5px] pb-[10px] pt-[20px] text-[17px] font-extrabold text-ink">{children}</h2>
}

/**
 * Круглий «+» під заголовком (Searches, Your people). Не перекриває фон —
 * скло, як таб-бар: напівпрозоре, з блюром і світлою кромкою (27.09.2026).
 */
export function PlusButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-[50px] w-[50px] place-items-center rounded-full border border-white/70 bg-white/30 text-ink backdrop-blur-xl active:opacity-70"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 20px rgba(23,20,54,0.08)' }}
    >
      <FontAwesomeIcon icon={faPlus} style={{ fontSize: 20 }} />
    </button>
  )
}

/**
 * Рядок чипів в один рядок: показує стільки, скільки вміщається по ширині,
 * решту згортає в «+N» (рішення 27.09.2026 — не фіксоване «максимум 3»).
 * Міряє реальні ширини після рендера; «+N» теж має вміститись.
 */
export function ChipRow({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(items.length)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const gap = 5
      const width = el.clientWidth
      const chips = [...el.querySelectorAll<HTMLElement>('[data-chip]')].map((c) => c.offsetWidth)
      const moreW = el.querySelector<HTMLElement>('[data-more]')?.offsetWidth ?? 0
      // Усі вміщаються — «+N» не потрібен.
      const total = chips.reduce((a, w) => a + w + gap, -gap)
      if (total <= width) return setVisible(items.length)
      let used = 0
      let n = 0
      for (const w of chips) {
        const next = used + (n ? gap : 0) + w
        if (next + gap + moreW > width) break
        used = next
        n++
      }
      setVisible(Math.max(n, 1))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items])

  const hidden = items.length - visible
  return (
    <div ref={ref} className="relative flex gap-[5px] overflow-hidden">
      {items.map((i, idx) => (
        <span key={i} data-chip className={`shrink-0 whitespace-nowrap ${idx < visible ? '' : 'invisible absolute'}`}>
          <Chip>{i}</Chip>
        </span>
      ))}
      <span data-more className={`shrink-0 whitespace-nowrap ${hidden > 0 ? '' : 'invisible absolute'}`}>
        <Chip>+{Math.max(hidden, 1)}</Chip>
      </span>
    </div>
  )
}
