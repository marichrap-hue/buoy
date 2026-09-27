import Matter from 'matter-js'
import { useEffect, useRef, useState } from 'react'

import type { GiftSearch } from '../data/searches'

/**
 * Поле бульбашок — фізика «у воді»:
 *  - у спокої бульбашки лежать на дні купкою (м'яка гравітація, рух гаситься
 *    водою — ніяких стрибків і відскоків);
 *  - при відкритті «вилуплюються» з-під кнопки «+» одна за одною: з'являються
 *    маленькими, ростуть до свого розміру (~0,6 с) і осідають на дно
 *    (рішення дизайнерки 27.09.2026); нова бульбашка з листа — так само,
 *    купка при цьому не перебудовується;
 *  - струс телефона — вони спливають угору, кожна зі своєю силою і
 *    погойдуванням (як у збовтаній склянці), а щойно трусити перестали —
 *    так само плавно осідають назад, уже іншим порядком;
 *  - бульбашки не накладаються: рушій м'яко розштовхує їх при дотику;
 *  - перетягування: бульбашка йде за пальцем 1:1, при відпусканні зберігає
 *    швидкість.
 *
 * Бриф, MOTION RULES: струс дублюється кнопкою (WCAG 2.5.4); при
 * prefers-reduced-motion — статична розкладка одразу.
 * Рушій (Matter.js) лише рахує координати; малює React.
 */

const W = 393
const WALL = 80
const STEP = 1000 / 60
/**
 * Позиції між переходами (27.09.2026): вкладку перемкнули й повернулись —
 * бульбашки лежать, де лежали, без вилуплення і звуку. Живе поки сторінка
 * відкрита; нові бульбашки (яких тут немає) вилуплюються як зазвичай.
 */
const REMEMBERED = new Map<string, { x: number; y: number }>()
/** Гранична швидкість у спокої/осіданні, px за крок — повільно, як у воді. */
const WATER_SPEED = 7
/** Гранична швидкість спливання при струсі. */
const RISE_SPEED = 9
/** Скільки триває спливання після одного струсу, мс. Повторний струс продовжує. */
const RISE_MS = 2600
/** Здригання непрочитаної: цикл 3,2 с, тремтить перші ~1,1 с і затихає (27.09.2026). */
const AGITATE_CYCLE = 3200
const AGITATE_MS = 1100
/** Радіус «яйця» при вилупленні і час росту до повного розміру. */
const HATCH_R = 6
const GROW_MS = 600

export interface Placed<T> {
  item: T
  size: number
  x: number
  y: number
  dragging: boolean
}

interface Props<T extends { id: string }> {
  items: T[]
  sizeOf: (item: T) => number
  height: number
  /** Звідки вилуплюються бульбашки (координати поля) — під кнопкою «+». */
  spawnAt: { x: number; y: number }
  /** Лічильник: кожна зміна — нове струшування. */
  shakeTick: number
  reducedMotion: boolean
  /** Тап по бульбашці (не перетягування). */
  onTap: (item: T) => void
  /** Які бульбашки «непрочитані»: м'яко здригаються (у фізиці — сусіди відштовхують). */
  isAgitated?: (item: T) => boolean
  /** Бульбашка вилупилась (для звуку «пух»); size — цільовий діаметр. */
  onHatch?: (item: T, size: number) => void
  children: (p: Placed<T>) => React.ReactNode
}

type Drag = {
  id: string
  pointerId: number
  startX: number
  startY: number
  moved: boolean
  last: { x: number; y: number; t: number }
  vel: { x: number; y: number }
}

export function BubbleField<T extends { id: string }>({ items, sizeOf, height, spawnAt, shakeTick, reducedMotion, onTap, isAgitated, onHatch, children }: Props<T>) {
  const [placed, setPlaced] = useState<Placed<T>[]>([])
  const fieldRef = useRef<HTMLDivElement>(null)
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map())
  const dragRef = useRef<Drag | null>(null)
  /** До якого моменту (performance.now) бульбашки спливають після струсу. */
  const riseUntilRef = useRef(0)
  /** Індивідуальна «плавучість» кожної бульбашки при струсі, 0.7–1.3. */
  const buoyancyRef = useRef<Map<string, number>>(new Map())
  /** Поточний набір і функція досипання нових бульбашок у живий світ. */
  const itemsRef = useRef(items)
  itemsRef.current = items
  const syncRef = useRef<() => void>(() => {})
  const onTapRef = useRef(onTap)
  onTapRef.current = onTap
  const isAgitatedRef = useRef(isAgitated)
  isAgitatedRef.current = isAgitated
  const onHatchRef = useRef(onHatch)
  onHatchRef.current = onHatch

  useEffect(() => {
    // Більше ітерацій розв'язання колізій: інакше під постійним тиском «вниз»
    // кола входять одне в одне на кілька px (рішення 27.09.2026: не перекриваються).
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 }, positionIterations: 24, velocityIterations: 12 })
    const world = engine.world
    const cx = W / 2
    const cy = height / 2

    // Стіни — щоб бульбашки не виходили за поле (при струсі).
    Matter.Composite.add(world, [
      Matter.Bodies.rectangle(cx, -WALL / 2, W * 2, WALL, { isStatic: true }),
      Matter.Bodies.rectangle(cx, height + WALL / 2, W * 2, WALL, { isStatic: true }),
      Matter.Bodies.rectangle(-WALL / 2, cy, WALL, height * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W + WALL / 2, cy, WALL, height * 3, { isStatic: true }),
    ])

    const bodies = new Map<string, Matter.Body>()
    bodiesRef.current = bodies
    /** Ріст після вилуплення: id → момент народження (performance.now). */
    const born = new Map<string, number>()
    const spawnTimers: number[] = []

    const hatch = (item: T, delay: number) => {
      const size = sizeOf(item)
      const remembered = REMEMBERED.get(item.id)
      // Reduced motion або вже бачена — одразу повний розмір, без анімації.
      const instant = reducedMotion || !!remembered
      const r0 = instant ? size / 2 : HATCH_R
      const startX = remembered ? remembered.x : spawnAt.x + (Math.random() - 0.5) * 6
      const startY = remembered ? remembered.y : spawnAt.y
      const body = Matter.Bodies.circle(startX, startY, r0, {
        restitution: 0,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0.06, // «вода»: рух гаситься м'яко
        density: 0.0012,
        inertia: Infinity,
        slop: 0.01,
      })
      body.label = String(size) // цільовий діаметр — для росту
      bodies.set(item.id, body)
      buoyancyRef.current.set(item.id, 0.7 + Math.random() * 0.6)
      const add = () => {
        Matter.Composite.add(world, body)
        born.set(item.id, performance.now())
        if (remembered) return // повернення на вкладку: ні звуку, ні поштовху
        onHatchRef.current?.(item, size)
        // Легкий поштовх від «+» у бік поля — щоб не стояли стовпчиком.
        Matter.Body.setVelocity(body, { x: 1.5 + Math.random() * 2, y: 1 + Math.random() })
      }
      if (instant || delay === 0) add()
      else spawnTimers.push(window.setTimeout(add, delay))
    }

    // Стартовий набір — одна за одною (~180 мс), щоб не вилуплювались строєм.
    let n = 0
    itemsRef.current.forEach((item) => hatch(item, reducedMotion || REMEMBERED.has(item.id) ? 0 : n++ * 180))

    // Досипання нових / прибирання зниклих без перебудови купки.
    syncRef.current = () => {
      const ids = new Set(itemsRef.current.map((it) => it.id))
      itemsRef.current.forEach((item) => {
        if (!bodies.has(item.id)) hatch(item, 0)
      })
      for (const [id, b] of bodies) {
        if (!ids.has(id)) {
          Matter.Composite.remove(world, b)
          bodies.delete(id)
        }
      }
    }

    if (import.meta.env.DEV) (window as unknown as { __buoy?: unknown }).__buoy = { engine, bodies, separate: () => separate() }

    const read = () =>
      setPlaced(
        itemsRef.current
          .filter((item) => born.has(item.id))
          .map((item) => {
            const b = bodies.get(item.id)!
            return { item, size: (b.circleRadius ?? 0) * 2, x: b.position.x, y: b.position.y, dragging: dragRef.current?.id === item.id }
          }),
      )

    const t0 = performance.now()
    const applyForces = (now: number) => {
      const draggedId = dragRef.current?.id
      const rising = now < riseUntilRef.current
      const t = (now - t0) / 1000
      for (const [id, b] of bodies) {
        if (id === draggedId) continue
        if (rising) {
          // Спливання: сила вгору у кожної своя; ближче до верху вона слабшає,
          // щоб бульбашки зависли в товщі, а не прилипли до стелі.
          const buoy = buoyancyRef.current.get(id) ?? 1
          const depth = Math.min(Math.max((b.position.y - height * 0.2) / (height * 0.5), 0.15), 1)
          // Трясіння: погойдування + випадкові поштовхи вбік — у повітрі
          // бульбашки перемішуються і після зупинки лягають інакше.
          const jolt = Math.random() < 0.06 ? (Math.random() - 0.5) * 0.006 * b.mass : 0
          Matter.Body.applyForce(b, b.position, {
            x: Math.sin(t * 3.1 + b.id * 1.7) * 0.0006 * b.mass + jolt,
            y: -0.0012 * buoy * depth * b.mass + Math.sin(t * 4.3 + b.id) * 0.00025 * b.mass,
          })
          continue
        }
        // Спокій: м'яка гравітація («вода» гасить рух) + ледь помітне
        // стягування до середини по x, щоб купка лежала посередині.
        let ax = 0
        let ay = 0
        const item = itemsRef.current.find((it) => it.id === id)
        if (item && !reducedMotion && isAgitatedRef.current?.(item)) {
          // Здригання: швидкі затухаючі коливання, у кожної свій зсув фази.
          const phase = (b.id * 517) % AGITATE_CYCLE
          const tc = (now - t0 + phase) % AGITATE_CYCLE
          if (tc < AGITATE_MS) {
            const env = Math.exp(-tc / 350)
            ax = Math.sin((tc / 1000) * Math.PI * 2 * 6) * env * 0.0022 * b.mass
            ay = Math.cos((tc / 1000) * Math.PI * 2 * 5) * env * 0.0009 * b.mass
          }
        }
        Matter.Body.applyForce(b, b.position, {
          x: (cx - b.position.x) * 0.0000006 * b.mass + Math.sin(t * 0.8 + b.id) * 0.00003 * b.mass + ax,
          y: 0.0003 * b.mass + ay,
        })
      }
    }

    const grow = (now: number) => {
      for (const [id, b] of bodies) {
        const t0 = born.get(id)
        if (t0 === undefined) continue
        const target = Number(b.label) / 2
        const r = b.circleRadius ?? target
        if (r >= target - 0.01) continue
        // Ease-out: швидко на старті, м'яко до повного розміру.
        const p = Math.min((now - t0) / GROW_MS, 1)
        const want = HATCH_R + (target - HATCH_R) * (1 - (1 - p) * (1 - p))
        const f = Math.min(want, target) / r
        if (f > 1) Matter.Body.scale(b, f, f)
      }
    }

    // Гарантія «не перекриваються»: після кроку рушія пари, що ввійшли одна
    // в одну (Matter лишає кілька px під постійним тиском вниз), розсуваються
    // по нормалі — легша далі, важча менше. Перетягувана — на місці.
    const separate = () => {
      const list = [...bodies.values()]
      const draggedId = dragRef.current?.id
      // Кілька проходів: розсунута пара може наштовхнути на третю.
      for (let pass = 0; pass < 6; pass++)
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i]
          const b = list[j]
          const dx = b.position.x - a.position.x
          const dy = b.position.y - a.position.y
          const d = Math.hypot(dx, dy) || 0.001
          const overlap = (a.circleRadius ?? 0) + (b.circleRadius ?? 0) - d
          if (overlap <= 0.2) continue
          const nx = dx / d
          const ny = dy / d
          const aFixed = dragRef.current && a.label === draggedId
          const bFixed = dragRef.current && b.label === draggedId
          const wa = aFixed ? 0 : bFixed ? 1 : b.mass / (a.mass + b.mass)
          const wb = 1 - wa
          if (!aFixed) Matter.Body.setPosition(a, { x: a.position.x - nx * overlap * wa, y: a.position.y - ny * overlap * wa })
          if (!bFixed) Matter.Body.setPosition(b, { x: b.position.x + nx * overlap * wb, y: b.position.y + ny * overlap * wb })
        }
      }
      // Стіни: не випхати за край поля.
      for (const b of list) {
        const r = b.circleRadius ?? 0
        const x = Math.min(Math.max(b.position.x, r), W - r)
        const y = Math.min(b.position.y, height - r)
        if (x !== b.position.x || y !== b.position.y) Matter.Body.setPosition(b, { x, y })
      }
    }

    const step = (now: number) => {
      grow(now)
      applyForces(now)
      Matter.Engine.update(engine, STEP)
      separate()
      for (const b of bodies.values()) {
        const v = b.velocity
        const speed = Math.hypot(v.x, v.y)
        const cap = now < riseUntilRef.current ? RISE_SPEED : WATER_SPEED
        if (speed > cap) Matter.Body.setVelocity(b, { x: (v.x / speed) * cap, y: (v.y / speed) * cap })
      }
      read()
    }

    if (reducedMotion) {
      for (let i = 0; i < 600; i++) step(t0 + i * STEP)
      return () => Matter.Engine.clear(engine)
    }

    let raf = 0
    let last = performance.now()
    let acc = 0
    const tick = (now: number) => {
      acc += Math.min(now - last, STEP * (document.hidden ? 120 : 5))
      last = now
      while (acc >= STEP) {
        step(now)
        acc -= STEP
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const timer = window.setInterval(() => {
      if (document.hidden) tick(performance.now())
    }, STEP)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(timer)
      spawnTimers.forEach((t) => window.clearTimeout(t))
      for (const [id, b] of bodies) if (born.has(id)) REMEMBERED.set(id, { x: b.position.x, y: b.position.y })
      Matter.Engine.clear(engine)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- світ будується один раз; набір досипається через syncRef
  }, [height, reducedMotion])

  // Зміна набору (новий пошук з листа) — досипати, не перебудовуючи купку.
  useEffect(() => {
    syncRef.current()
  }, [items])

  // Струс — бульбашки спливають на RISE_MS; повторний струс під час
  // спливання продовжує його (телефон трусять далі). Перестали — гравітація
  // сама осаджує їх назад.
  useEffect(() => {
    if (shakeTick === 0 || reducedMotion) return
    riseUntilRef.current = performance.now() + RISE_MS
    // Нова «плавучість» на кожен струс — купка збереться іншим порядком.
    for (const id of bodiesRef.current.keys()) buoyancyRef.current.set(id, 0.7 + Math.random() * 0.6)
  }, [shakeTick, reducedMotion])

  // Перетягування: 1:1 за вказівником; на відпусканні — швидкість жесту.
  const toField = (e: React.PointerEvent) => {
    const r = fieldRef.current!.getBoundingClientRect()
    const scale = r.width / W
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }
  }
  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    if (reducedMotion) return
    const p = toField(e)
    dragRef.current = { id, pointerId: e.pointerId, startX: p.x, startY: p.y, moved: false, last: { ...p, t: performance.now() }, vel: { x: 0, y: 0 } }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const b = bodiesRef.current.get(id)
    if (b) Matter.Body.setVelocity(b, { x: 0, y: 0 })
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const p = toField(e)
    if (Math.hypot(p.x - d.startX, p.y - d.startY) > 6) d.moved = true
    const b = bodiesRef.current.get(d.id)
    if (b) {
      const now = performance.now()
      const dt = Math.max(now - d.last.t, 1)
      d.vel = { x: ((p.x - d.last.x) / dt) * STEP, y: ((p.y - d.last.y) / dt) * STEP }
      d.last = { ...p, t: now }
      Matter.Body.setPosition(b, { x: Math.min(Math.max(p.x, 0), W), y: Math.min(Math.max(p.y, 0), height) })
      Matter.Body.setVelocity(b, { x: 0, y: 0 })
    }
  }
  const onPointerUp = (item: T) => (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const b = bodiesRef.current.get(d.id)
    dragRef.current = null
    if (!d.moved) {
      onTapRef.current(item)
      return
    }
    if (b) Matter.Body.setVelocity(b, { x: d.vel.x * 0.9, y: d.vel.y * 0.9 })
  }

  return (
    <div ref={fieldRef} className="relative shrink-0 touch-none overflow-hidden" style={{ height }}>
      {placed.map((p) => (
        <div
          key={p.item.id}
          className="absolute left-0 top-0"
          onPointerDown={onPointerDown(p.item.id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp(p.item)}
          onPointerCancel={() => {
            dragRef.current = null
          }}
        >
          {children(p)}
        </div>
      ))}
    </div>
  )
}

/** Датчик руху телефона → струшування. Повертає true, коли датчик доступний. */
export function useShake(onShake: () => void, enabled: boolean) {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return
    let last = 0
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a) return
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2)
      const now = Date.now()
      if (mag > 22 && now - last > 900) {
        last = now
        onShake()
      }
    }
    window.addEventListener('devicemotion', handler)
    setAvailable(true)
    return () => window.removeEventListener('devicemotion', handler)
  }, [onShake, enabled])
  return available
}

export type { GiftSearch }
