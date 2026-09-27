import { useSyncExternalStore } from 'react'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

/**
 * Тости — короткі підтвердження дій («Saved to Shortlist»). Один за раз,
 * зверху екрана телефона, зникає сам за 2 с. Дизайн — базовий, «лопання»
 * при появі; фінальний вигляд ще узгоджується (27.09.2026).
 */
export interface Toast {
  id: number
  text: string
  icon?: IconDefinition
}

let current: Toast | null = null
let seq = 0
let timer = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useToast() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

export function toast(text: string, icon?: IconDefinition) {
  window.clearTimeout(timer)
  current = { id: ++seq, text, icon }
  emit()
  timer = window.setTimeout(() => {
    current = null
    emit()
  }, 2000)
}
