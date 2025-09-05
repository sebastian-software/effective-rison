import './styles.css'
import { encode, decode, compressToUrl, decompressFromUrl } from '@effective/rison'

const sourceEl = document.getElementById('source') as HTMLTextAreaElement
const convertedEl = document.getElementById('converted') as HTMLTextAreaElement
const restoredEl = document.getElementById('restored') as HTMLTextAreaElement
const useCompressionEl = document.getElementById('useCompression') as HTMLInputElement
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

function update() {
  const raw = sourceEl.value.trim()
  try {
    const value = safeEval(raw)
    const useCompression = !!useCompressionEl?.checked
    if (useCompression) {
      const compressed = compressToUrl(value as any)
      convertedEl.value = compressed
      const back = decompressFromUrl(compressed)
      restoredEl.value = JSON.stringify(back, null, 2)
    } else {
      const r = encode(value as any)
      convertedEl.value = r
      const back = decode(r)
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
  const percent = srcLen > 0 ? Math.round(((srcLen - convLen) / srcLen) * 100) : 0
  const sign = percent > 0 ? '+' : ''
  convertedMetaEl.textContent = `Characters: ${convLen} • Compression: ${sign}${percent}%`
}

sourceEl.addEventListener('input', update)
useCompressionEl?.addEventListener('change', update)
update()
