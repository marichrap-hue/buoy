import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBookmark as faBookmarkRegular,
  faUser as faUserRegular,
} from '@fortawesome/free-regular-svg-icons'
import { faBookmark, faMagnifyingGlass, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink } from 'react-router-dom'

/**
 * Таббар за iOS 26 (Liquid Glass), три вкладки з брифу: Searches · Your
 * people · Shortlist. Джерела — HIG «Tab bars» і розбір learnui.design
 * (iOS 26 Design Guidelines):
 *  - не на всю ширину, а плаваюча капсула по центру, відступ 21pt зліва,
 *    справа і знизу (home indicator — окрема зона під нею);
 *  - матеріал Liquid Glass: напівпрозоре скло з блюром, тонка світла кромка
 *    зверху, м'яка тінь — контент під ним ледь проглядає;
 *  - активна вкладка — брендовим кольором, підпис 11pt.
 * Іконки — Font Awesome (рішення 26.09.2026): outline → filled для активної.
 * Контраст: periwinkle #807CF7 на світлому склі ≈ 3.4:1 — для іконки
 * досить (3:1), для підпису 11pt — ні, тому активний підпис — темніший
 * #5B56E0 (≥ 4.5:1), неактивні — чорнило #171436.
 */
const TABS: { to: string; label: string; icon: IconDefinition; activeIcon: IconDefinition }[] = [
  { to: '/searches', label: 'Searches', icon: faMagnifyingGlass, activeIcon: faMagnifyingGlass },
  { to: '/people', label: 'Your people', icon: faUserRegular, activeIcon: faUserGroup },
  { to: '/shortlist', label: 'Shortlist', icon: faBookmarkRegular, activeIcon: faBookmark },
]

export function TabBar() {
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-[20px] pb-[20px]">
      <div
        className="pointer-events-auto flex h-[64px] w-full max-w-[351px] items-center justify-around rounded-full border border-white/70 bg-white/45 px-[5px] backdrop-blur-2xl backdrop-saturate-150"
        style={{ boxShadow: '0 8px 30px rgba(23,20,54,0.14), inset 0 1px 0 rgba(255,255,255,0.9)' }}
      >
        {TABS.map(({ to, label, icon, activeIcon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex h-[52px] w-[104px] flex-col items-center justify-center gap-[5px]"
          >
            {({ isActive }) => (
              <>
                <FontAwesomeIcon
                  icon={isActive ? activeIcon : icon}
                  style={{ fontSize: 20 }}
                  className={isActive ? 'text-periwinkle' : 'text-ink'}
                />
                <span className={`text-[11px] leading-none ${isActive ? 'font-bold text-[#5B56E0]' : 'font-medium text-ink'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
