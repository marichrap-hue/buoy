import { type ReactNode, useState } from 'react'

/**
 * Сторінка з великим заголовком за iOS 26:
 *  - контент скролиться ПІД заголовком, а не обрізається під ним;
 *  - верхній край — «soft scroll edge effect» (Liquid Glass): контент під
 *    шапкою поступово розмивається й розчиняється, без жорсткої лінії;
 *  - великий заголовок (34/800) при скролі тане, замість нього в зоні
 *    навбару з'являється малий (17/800) по центру;
 *  - `floating` — круглий «+» під заголовком, плаває поверх контенту;
 *  - `right` — елемент праворуч від заголовка (перемикач виду), не тане.
 * Джерела: WWDC25 «Build a UIKit app with the new design», HIG Navigation bars.
 */
const TITLE_H = 53 // рядок великого заголовка
const FLOAT_H = 75 // рядок під «+»: 50 кнопка + 25 до першої картки (27.09.2026)

export function ScrollPage({
  title,
  right,
  floating,
  scroll = true,
  children,
}: {
  title: string
  right?: ReactNode
  floating?: ReactNode
  /** false — контент фіксований (поле бульбашок), без скролу й краю. */
  scroll?: boolean
  children: ReactNode
}) {
  const [y, setY] = useState(0)
  const large = 1 - Math.min(y / 40, 1)
  const small = Math.min(Math.max((y - 20) / 30, 0), 1)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        onScroll={(e) => setY(e.currentTarget.scrollTop)}
        className={`absolute inset-0 px-[15px] [scrollbar-width:none] ${scroll ? 'overflow-y-auto pb-[110px]' : 'overflow-hidden'}`}
        style={{ paddingTop: TITLE_H + (floating ? FLOAT_H : 0) }}
      >
        {children}
      </div>

      {/* Scroll edge effect: прогресивний блюр + м'який тон фону, лише коли є що ховати. */}
      {/* Починається від самого верху екрана (−54 — статус-бар), інакше на його межі видно смугу. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[-54px] h-[175px] backdrop-blur-xl"
        style={{
          opacity: small,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          background: 'linear-gradient(to bottom, rgba(179,174,242,0.85) 45%, rgba(179,174,242,0) 100%)',
        }}
      />

      {/* Малий заголовок — у зоні навбару, з'являється при скролі. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex h-[44px] items-center justify-center text-[17px] font-extrabold text-ink"
        style={{ opacity: small }}
      >
        {title}
      </div>

      {/* Великий заголовок — тане й ледь піднімається при скролі. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center px-[15px] pb-[5px] pt-[5px]"
        style={{ opacity: large, transform: `translateY(${-Math.min(y, 40) * 0.35}px)` }}
      >
        <h1 className="text-[34px] font-extrabold leading-[41px] tracking-[-0.02em] text-ink">{title}</h1>
      </div>

      {right && <div className="absolute right-[15px] top-[11px] z-10">{right}</div>}
      {floating && <div className="absolute left-[15px] top-[58px] z-10">{floating}</div>}
    </div>
  )
}
