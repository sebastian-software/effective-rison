import ui from '../styles/Primitives.module.css'
import { Panel } from './Panel'
import { Status } from './Status'

export function RestoredPanel({ id, title, value, ok }: { id: string; title: string; value: string; ok: boolean | null }) {
  return (
    <Panel
      title={
        <div className={ui.statusWrap}>
          <label className={ui.title} htmlFor={id}>{title}</label>
          <Status ok={ok} />
        </div>
      }
    >
      <textarea id={id} className={`${ui.textarea} ${ui.readonly}`} readOnly wrap="off" value={value} />
    </Panel>
  )
}
