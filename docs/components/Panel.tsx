import { ReactNode } from 'react'
import ui from './Panel.module.css'

export function Panel({
  title,
  right,
  children,
  className
}: {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${ui.card} ${className ?? ''}`}>
      {(title || right) && (
        <div className={ui.labelRow}>
          {title ? <div className={ui.title}>{title}</div> : <div />}
          {right ? <div className={ui.metaInline}>{right}</div> : null}
        </div>
      )}
      {children}
    </section>
  )
}
