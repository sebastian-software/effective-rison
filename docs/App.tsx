import { useEffect, useMemo, useState } from 'react'
import layout from './styles/Layout.module.css'
import ui from './styles/Primitives.module.css'
import { encode, decode, compressToUrl, decompressFromUrl, compressForStorage, decompressFromStorage } from '@effective/rison'
import { Controls } from './components/Controls'
import { PresetButtons } from './components/PresetButtons'
import { Panel } from './components/Panel'
import { ConvertedPanel } from './components/ConvertedPanel'
import { RestoredPanel } from './components/RestoredPanel'
import { usePresets } from './hooks/usePresets'
import { useCompressionMeta } from './hooks/useCompressionMeta'

type Mode = 'auto' | 'deflate' | 'none'
type StorageEncoding = 'base32768' | 'base64'

function sortKeysDeep<T>(v: T): T {
  if (Array.isArray(v)) return v.map(sortKeysDeep) as any
  if (v && typeof v === 'object') {
    const out: Record<string, any> = {}
    Object.keys(v as any)
      .sort()
      .forEach((k) => {
        out[k] = sortKeysDeep((v as any)[k])
      })
    return out as any
  }
  return v
}

function stringifySorted(v: unknown): string {
  return JSON.stringify(sortKeysDeep(v), null, 2)
}

export default function App() {
  const [mode, setMode] = useState<Mode>('auto')
  const [storageEncoding, setStorageEncoding] = useState<StorageEncoding>('base32768')
  const [source, setSource] = useState<string>('')

  const [convertedUrl, setConvertedUrl] = useState('')
  const [restoredUrl, setRestoredUrl] = useState('')
  const [storageToken, setStorageToken] = useState('')
  const [storageRestored, setStorageRestored] = useState('')
  const [sourceWarn, setSourceWarn] = useState('')
  const [sourceChars, setSourceChars] = useState<number>(0)
  const [urlMeta, setUrlMeta] = useState('Characters: 0 • Compression: 0%')
  const [storageMeta, setStorageMeta] = useState('Characters: 0 • Compression: 0%')
  const [urlOk, setUrlOk] = useState<boolean | null>(null)
  const [storageOk, setStorageOk] = useState<boolean | null>(null)

  const { load } = usePresets()
  const { metaFrom } = useCompressionMeta()

  // Default to Short preset
  useEffect(() => {
    ;(async () => {
      setSource(await load('short'))
    })()
  }, [])

  // Compute outputs
  useEffect(() => {
    let canceled = false
    ;(async () => {
      const raw = source.trim()
      let value: any
      try {
        value = JSON.parse(raw)
        setSourceWarn('')
      } catch {
        try {
          // fallback to eval-ish for convenience
          // eslint-disable-next-line no-new-func
          value = Function(`"use strict";return (${raw})`)()
          setSourceWarn('Baseline requires strict JSON input')
        } catch (e: any) {
          setConvertedUrl(String(e?.message || e))
          setRestoredUrl('')
          setStorageToken('')
          setStorageRestored('')
          setUrlOk(null)
          setStorageOk(null)
          return
        }
      }

      const r = encode(value)
      setSourceChars(source.length)
      let nextConvertedUrl = ''
      let nextRestoredUrl = ''
      let nextStorageToken = ''
      let nextStorageRestored = ''

      if (mode === 'none') {
        nextConvertedUrl = r
        nextRestoredUrl = stringifySorted(decode(r))
      } else {
        const token = await compressToUrl(value, { mode })
        nextConvertedUrl = token
        const back = await decompressFromUrl(token)
        nextRestoredUrl = stringifySorted(back)
      }

      if (mode === 'none') {
        nextStorageToken = r
        nextStorageRestored = stringifySorted(decode(r))
      } else {
        const token = await compressForStorage(value, { mode, encoding: storageEncoding })
        nextStorageToken = token
        const back = await decompressFromStorage(token, { encoding: storageEncoding })
        nextStorageRestored = stringifySorted(back)
      }

      if (canceled) return

      setConvertedUrl(nextConvertedUrl)
      setRestoredUrl(nextRestoredUrl)
      setStorageToken(nextStorageToken)
      setStorageRestored(nextStorageRestored)

      // metas: compare against minified JSON
      setUrlMeta(metaFrom(source, nextConvertedUrl))
      setStorageMeta(metaFrom(source, nextStorageToken))

      // equality markers
      try {
        const src = stringifySorted(JSON.parse(source))
        setUrlOk(nextRestoredUrl === src)
        setStorageOk(nextStorageRestored === src)
      } catch {
        setUrlOk(null)
        setStorageOk(null)
      }
    })()
    return () => {
      canceled = true
    }
  }, [source, mode, storageEncoding])

  const SourceControls = useMemo(
    () => <PresetButtons onLoad={(json) => setSource(json)} />,
    []
  )

  const Status = ({ ok }: { ok: boolean | null }) => (
    <span className={`${styles.status} ${ok == null ? '' : ok ? styles.ok : styles.bad}`}>{ok == null ? '—' : ok ? '✓' : '✗'}</span>
  )

  return (
    <div className={layout.page}>
      <header className={layout.header}>
        <h1>@effective/rison Demo</h1>
        <p>Live encoding/decoding — Source → Converted → Restored</p>
        <Controls mode={mode} onMode={setMode} storageEncoding={storageEncoding} onStorageEncoding={setStorageEncoding} />
        <p>
          Repo: <a href="https://github.com/sebastian-software/effective-rison" target="_blank" rel="noreferrer">sebastian-software/effective-rison</a>
        </p>
      </header>

      <main className={layout.grid}>
        <Panel
          className={layout.source}
          title={<label className={ui.title} htmlFor="source">Source JSON</label>}
          right={<span>Characters: {sourceChars}</span>}
        >
          {SourceControls}
          <textarea id="source" className={ui.textarea} value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false} wrap="off" />
        </Panel>

        <ConvertedPanel id="convertedUrl" title="Converted (URL)" value={convertedUrl} meta={urlMeta} />
        <RestoredPanel id="restoredUrl" title="Restored (URL)" value={restoredUrl} ok={urlOk} />

        <ConvertedPanel id="storageToken" title="Converted (Storage)" value={storageToken} meta={storageMeta} />
        <RestoredPanel id="storageRestored" title="Restored (Storage)" value={storageRestored} ok={storageOk} />
      </main>

      <footer className={layout.header}>
        <small style={{ color: 'var(--muted)' }}>TypeScript-first, ESM-only. © Sebastian Software GmbH.</small>
      </footer>
    </div>
  )
}
