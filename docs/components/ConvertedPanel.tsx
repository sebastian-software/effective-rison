import { useState } from 'react'
import ui from './ConvertedPanel.module.css'
import { Panel } from './Panel'

export function ConvertedPanel({ id, title, value, meta }: { id: string; title: React.ReactNode; value: string; meta: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // swallow
    }
  }

  return (
    <Panel
      title={<label className={ui.title} htmlFor={id}>{title}</label>}
      right={<><span>{meta}</span><button className={ui.copyButton} onClick={copy}>{copied ? <span className={ui.copied}>Copied</span> : 'Copy'}</button></>}
    >
      <textarea id={id} className={`${ui.textarea} ${ui.converted} ${ui.readonly}`} readOnly wrap="soft" value={value} />
    </Panel>
  )
}
