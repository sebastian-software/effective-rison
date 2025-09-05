import ui from '../styles/Primitives.module.css'

export function Status({ ok }: { ok: boolean | null }) {
  return (
    <span className={`${ui.status} ${ok == null ? '' : ok ? ui.ok : ui.bad}`}>
      {ok == null ? '—' : ok ? '✓' : '✗'}
    </span>
  )
}
