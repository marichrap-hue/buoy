import { daysLeftLabel, type GiftSearch, STATE_LABEL } from '../data/searches'
import { BubbleField } from './BubbleField'
import { pop } from '../lib/sound'
import { useReducedMotion } from './useReducedMotion'

/**
 * Бульбашки — вигляд за макетом Figma «Search» (owZrt0j6ze4x3gigQgsgY6, вузол
 * 5026:88): кольоровий круг зі світлішим розмитим еліпсом усередині (м'яке
 * сяйво в центрі), ім'я 16/700 і «N days left» 15/400 чорнилом #080533.
 * Ні приводу, ні пілюлі стану — лише ім'я і час.
 *  - РОЗМІР = час до дати (ближче — більша), бриф.
 *  - КОЛІР = людина: всі пошуки для мами — одного кольору, для сестри —
 *    іншого (рішення дизайнерки 27.09.2026). Відтінки з палітри брифу,
 *    пари «основа / сяйво в центрі»; текст лежить на сяйві, тому контраст
 *    чорнила рахується від нього (≥ 4.5:1).
 * Рух — BubbleField (гравітація, спливання при струсі).
 */

const PALETTE: { base: string; glow: string }[] = [
  { base: '#807CF7', glow: '#B4B2F4' }, // periwinkle
  { base: '#BED2FB', glow: '#E6EEFE' }, // sky
  { base: '#DEC5FB', glow: '#F1E8FE' }, // лілова з градієнта фону
  { base: '#999AE2', glow: '#CACAF1' }, // з градієнта фону
  { base: '#A4A2ED', glow: '#D6D5F7' }, // periwinkle light
  { base: '#9695B6', glow: '#CFCEDE' }, // muted
]

/** Діаметр: 3 дні → 180, 3 місяці → 92. */
function sizeFor(days: number) {
  const t = Math.min(Math.max(days, 0), 100) / 100
  return Math.round(180 - t * 88)
}

export function Bubbles({
  searches,
  height,
  spawnAt,
  shakeTick,
  onOpen,
}: {
  searches: GiftSearch[]
  height: number
  spawnAt: { x: number; y: number }
  /** Лічильник струшувань: датчик телефона або прототипна кнопка під мокапом. */
  shakeTick: number
  onOpen: (s: GiftSearch) => void
}) {
  const reducedMotion = useReducedMotion()
  // Люди в порядку першої появи — індекс дає колір; нова людина отримує наступний.
  const people = [...new Set(searches.map((s) => s.person))]

  return (
    <div className="relative" style={{ height }}>
      <BubbleField
        items={searches}
        sizeOf={(s) => sizeFor(s.daysLeft)}
        height={height}
        spawnAt={spawnAt}
        shakeTick={shakeTick}
        reducedMotion={reducedMotion}
        onTap={onOpen}
        isAgitated={(s) => !!s.unread}
        onHatch={(_, size) => pop(size)}
      >
        {({ item: s, size, x, y, dragging }) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${s.person}, ${s.occasion}, ${daysLeftLabel(s.daysLeft)}, ${STATE_LABEL[s.state](s)}`}
            className="absolute left-0 top-0 flex cursor-grab items-center justify-center rounded-full text-center will-change-transform"
            style={{
              width: size,
              height: size,
              // Без обертання: текст у бульбашці завжди рівний (inertia: Infinity у рушії).
              // Під пальцем — трохи більша, як піднята над водою.
              transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${dragging ? 1.06 : 1})`,
              transition: 'scale 120ms',
              ...bubbleStyle(people.indexOf(s.person)),
            }}
          >
            <BubbleContent s={s} size={size} />
            {/* Непрочитане: обводка всередині краю (не вилазить на сусідів), плавно з'являється і гасне;
                здригання — у фізиці (BubbleField), тому бульбашки не перекриваються. */}
            {s.unread && (
              <span
                aria-hidden
                className="buoy-unread-ring pointer-events-none absolute inset-0 rounded-full"
                // Обводка — periwinkle #807CF7 з палітри, не білий (27.09.2026); м'яке сяйво того ж тону всередину.
                style={{ boxShadow: 'inset 0 0 0 3px #807CF7, inset 0 0 16px 3px rgba(128,124,247,0.45)', animation: 'buoy-ring 3.2s ease-in-out infinite' }}
              />
            )}
          </button>
        )}
      </BubbleField>
    </div>
  )
}

function bubbleStyle(personIndex: number): React.CSSProperties {
  const c = PALETTE[personIndex % PALETTE.length]
  // Розмитий еліпс ~77% діаметра з макета → радіальний градієнт: сяйво в
  // центрі, основа до краю.
  return { background: `radial-gradient(circle at 50% 50%, ${c.glow} 0%, ${c.glow} 22%, ${c.base} 72%)` }
}

function BubbleContent({ s, size }: { s: GiftSearch; size: number }) {
  const small = size < 120
  const tiny = size < 70
  return (
    <span className="flex flex-col items-center gap-[4px] whitespace-nowrap text-[#080533]">
      <span className="text-[16px] font-bold leading-[21px]">{s.person}</span>
      {/* Подія — в бульбашці (рішення 27.09.2026): у малих не вміщається. */}
      {!small && <span className="max-w-[150px] truncate text-[13px] leading-[17px] text-[#080533]/75">{s.occasion}</span>}
      {!tiny && <span className={small ? 'text-[13px] leading-[17px]' : 'text-[15px] leading-[20px]'}>{daysLeftLabel(s.daysLeft)}</span>}
    </span>
  )
}
