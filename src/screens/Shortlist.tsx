import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { ScrollPage } from '../components/ScrollPage'
import { Card } from '../components/ui'
import { removeIdea, useStore } from '../lib/store'

/**
 * Shortlist — збережені ідеї, кожна прив'язана до людини й приводу (бриф SCREEN 5).
 * Поки екран не задизайнено — «Coming soon» по центру (рішення 27.09.2026);
 * список ідей нижче лишається для сценарію «Save → у Shortlist».
 */
export function ShortlistScreen() {
  const { shortlist } = useStore()
  return (
    <ScrollPage title="Shortlist">
      <div>
        {shortlist.length === 0 ? (
          // Центр видимої зони: екран 852 − шапка 107 − таббар 83.
          <div className="flex h-[662px] items-center justify-center">
            <span className="text-[22px] font-extrabold text-ink">Coming soon</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {shortlist.map((i) => (
              <Card key={i.id}>
                <div className="flex items-start justify-between gap-[10px]">
                  <div>
                    <div className="text-[13px] font-semibold text-muted">
                      {i.person} · {i.occasion}
                    </div>
                    <div className="pt-[5px] text-[17px] font-extrabold text-ink">{i.title}</div>
                    <div className="pt-[5px] text-[14px] text-ink">
                      {i.price} · {i.note}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeIdea(i.id)}
                    className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-lavender text-ink"
                  >
                    <FontAwesomeIcon icon={faXmark} style={{ fontSize: 14 }} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollPage>
  )
}
