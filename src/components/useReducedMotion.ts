import { useMemo } from 'react'

/** Системне «Зменшити рух»: без фізики й струшування (бриф, MOTION RULES). */
export function useReducedMotion() {
  return useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
}
