import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useToast } from '../lib/toast'

/** Капсула-тост знизу, над полем відповіді / таб-баром; поверх усього, тапи крізь неї проходять. */
export function ToastHost() {
  const t = useToast()
  if (!t) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[110px] z-40 flex justify-center">
      <div
        key={t.id}
        role="status"
        className="flex items-center gap-[10px] rounded-full border border-white/70 bg-white/70 px-[20px] py-[10px] text-[15px] font-bold text-ink shadow-[0_10px_30px_rgba(23,20,54,0.18)] backdrop-blur-xl"
        style={{ animation: 'buoy-toast 2s ease-out both' }}
      >
        {t.icon && <FontAwesomeIcon icon={t.icon} style={{ fontSize: 15 }} className="text-[#5B56E0]" />}
        {t.text}
      </div>
    </div>
  )
}
