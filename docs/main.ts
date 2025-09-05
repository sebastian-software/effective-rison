import './styles.css'
import { encode, decode, compressToUrl, decompressFromUrl } from '@effective/rison'

const sourceEl = document.getElementById('source') as HTMLTextAreaElement
const convertedEl = document.getElementById('converted') as HTMLTextAreaElement
const restoredEl = document.getElementById('restored') as HTMLTextAreaElement
const modeRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mode"]'))
const sourceMetaEl = document.getElementById('sourceMeta') as HTMLSpanElement
const sourceWarnEl = document.getElementById('sourceWarn') as HTMLSpanElement
const convertedMetaEl = document.getElementById('convertedMeta') as HTMLSpanElement

function safeEval(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {}
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict";return (${input})`)()
  } catch {
    return input
  }
}

async function update() {
  const raw = sourceEl.value.trim()
  try {
    const value = safeEval(raw)
    const selected = modeRadios.find(r => r.checked)?.value as 'auto'|'gzip'|'deflate'|'none' | undefined
    const mode = selected ?? 'auto'
    // Compute uncompressed Rison once to avoid whitespace noise from the source JSON
    const r = encode(value as any)
    if (mode === 'none') {
      convertedEl.value = r
      const back = decode(r)
      restoredEl.value = JSON.stringify(back, null, 2)
    } else {
      const compressed = await compressToUrl(value as any, { mode })
      convertedEl.value = compressed
      const back = await decompressFromUrl(compressed)
      restoredEl.value = JSON.stringify(back, null, 2)
    }
    convertedEl.classList.remove('error')
    restoredEl.classList.remove('error')
  } catch (e: any) {
    convertedEl.value = String(e?.message || e)
    restoredEl.value = ''
    convertedEl.classList.add('error')
    restoredEl.classList.add('error')
  }

  // Update meta info (character counts and compression %)
  const convLen = convertedEl.value.length
  // Base length is the uncompressed Rison length; use strict JSON parsing only (ignore whitespace),
  // and if it's not valid JSON, report a baseline warning and skip the metric.
  let baseLen = 0
  try {
    const obj = JSON.parse(sourceEl.value)
    baseLen = encode(obj as any).length
    sourceWarnEl.textContent = ''
  } catch {
    sourceWarnEl.textContent = 'Baseline requires strict JSON input'
  }
  sourceMetaEl.textContent = `Characters: ${baseLen}`
  const effStr = baseLen > 0 ? (() => {
    const eff = Math.round(((baseLen - convLen) / baseLen) * 100)
    return eff > 0 ? `${eff}%` : eff < 0 ? `-${Math.abs(eff)}%` : '0%'
  })() : 'n/a'
  convertedMetaEl.textContent = `Characters: ${convLen} • Compression: ${effStr}`
}

sourceEl.addEventListener('input', () => { void update() })
modeRadios.forEach(r => r.addEventListener('change', () => { void update() }))
void update()
