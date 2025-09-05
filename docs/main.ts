import './styles.css'
import { encode, decode, compressToUrl, decompressFromUrl } from '@effective/rison'

const sourceEl = document.getElementById('source') as HTMLTextAreaElement
const convertedEl = document.getElementById('converted') as HTMLTextAreaElement
const restoredEl = document.getElementById('restored') as HTMLTextAreaElement
const modeRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mode"]'))
const sourceMetaEl = document.getElementById('sourceMeta') as HTMLSpanElement
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
  const srcLen = sourceEl.value.length
  const convLen = convertedEl.value.length
  sourceMetaEl.textContent = `Characters: ${srcLen}`
  // Compare against uncompressed Rison length for a codec-focused metric
  const risonUncompressed = encode(safeEval(sourceEl.value.trim()) as any)
  const baseLen = risonUncompressed.length
  const eff = baseLen > 0 ? Math.round(((baseLen - convLen) / baseLen) * 100) : 0
  // Display positive percent with no sign when effective, negative with '-' when ineffective
  const effStr = eff > 0 ? `${eff}%` : eff < 0 ? `-${Math.abs(eff)}%` : '0%'
  convertedMetaEl.textContent = `Characters: ${convLen} • Compression: ${effStr}`
}

sourceEl.addEventListener('input', () => { void update() })
modeRadios.forEach(r => r.addEventListener('change', () => { void update() }))
void update()
