import { type ReactNode, useEffect, useState } from 'react'

import { LivingBackground } from './LivingBackground'
import { ToastHost } from './Toast'

// Повна висота корпусу: екран 852 + рамка 11×2.
const DEVICE_H = 874
const DEVICE_W = 415

/** Масштаб, щоб телефон цілим вміщався у вікно (панель браузера невелика). */
function useFitScale() {
  const calc = () => Math.min(1, (window.innerHeight - 80) / DEVICE_H, (window.innerWidth - 32) / DEVICE_W)
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const onResize = () => setScale(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

/**
 * Рамка iPhone 15/16 Pro: екран 393 × 852 pt, Dynamic Island, статус-бар,
 * home indicator. Фон екрана — живий градієнт (LivingBackground).
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const scale = useFitScale()
  return (
    <div className="flex h-full items-center justify-center overflow-clip">
      {/* Корпус; зменшується під вікно, пропорції екрана 393 × 852 зберігаються */}
      <div
        className="shrink-0 rounded-[62px] bg-[#1b1a22] p-[11px] shadow-[0_30px_80px_rgba(23,20,54,0.35)]"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        {/* Екран */}
        {/* id — ціль порталу для листів: затемнення має накривати і статус-бар */}
        <div id="phone-screen" className="relative flex h-[852px] w-[393px] flex-col overflow-hidden rounded-[52px]">
          <LivingBackground />
          <StatusBar />
          <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
          <ToastHost />
          {/* Home indicator */}
          <div className="pointer-events-none absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink" />
        </div>
      </div>
    </div>
  )
}

function StatusBar() {
  // z-20 — над scroll-edge-накладкою сторінок, яка починається від верху екрана.
  return (
    <div className="relative z-20 flex h-[54px] shrink-0 items-center justify-between px-[32px] pt-[6px] text-[17px] font-semibold text-ink">
      <span className="w-[54px] text-center">9:41</span>
      {/* Dynamic Island */}
      <div className="absolute left-1/2 top-[11px] h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex w-[70px] items-center justify-end gap-[6px]">
        {/* Сигнал */}
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
        {/* Батарея */}
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
          <rect x="25" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  )
}
