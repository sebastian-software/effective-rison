import { useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { encode, decode, compressToUrl, decompressFromUrl, compressForStorage, decompressFromStorage } from '@effective/rison'

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
  const [urlMeta, setUrlMeta] = useState('Characters: 0 • Compression: 0%')
  const [storageMeta, setStorageMeta] = useState('Characters: 0 • Compression: 0%')
  const [urlOk, setUrlOk] = useState<boolean | null>(null)
  const [storageOk, setStorageOk] = useState<boolean | null>(null)

  // Default to Short preset
  useEffect(() => {
    ;(async () => {
      const m = await import('./data/short.json')
      setSource(JSON.stringify(m.default, null, 2))
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
      try {
        const obj = JSON.parse(source)
        const minJson = JSON.stringify(obj)
        const baseLen = minJson.length
        const convLen = nextConvertedUrl.length
        const storageLen = nextStorageToken.length
        const eff = baseLen > 0 ? Math.round(((baseLen - convLen) / baseLen) * 100) : 0
        const effS = baseLen > 0 ? Math.round(((baseLen - storageLen) / baseLen) * 100) : 0
        setUrlMeta(`Characters: ${convLen} • Compression: ${baseLen > 0 ? `${eff}%` : 'n/a'}`)
        setStorageMeta(`Characters: ${storageLen} • Compression: ${baseLen > 0 ? `${effS}%` : 'n/a'}`)
      } catch {
        setUrlMeta(`Characters: ${nextConvertedUrl.length} • Compression: n/a`)
        setStorageMeta(`Characters: ${nextStorageToken.length} • Compression: n/a`)
      }

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
    () => (
      <div className={styles.buttons}>
        <button
          className={styles.button}
          onClick={async () => {
            const m = await import('./data/short.json')
            setSource(JSON.stringify(m.default, null, 2))
          }}
        >
          Short
        </button>
        <button
          className={styles.button}
          onClick={async () => {
            const m = await import('./data/medium.json')
            setSource(JSON.stringify(m.default, null, 2))
          }}
        >
          Medium
        </button>
        <button
          className={styles.button}
          onClick={async () => {
            const m = await import('./data/long.json')
            setSource(JSON.stringify(m.default, null, 2))
          }}
        >
          Long
        </button>
      </div>
    ), []
  )

  const Status = ({ ok }: { ok: boolean | null }) => (
    <span className={`${styles.status} ${ok == null ? '' : ok ? styles.ok : styles.bad}`}>{ok == null ? '—' : ok ? '✓' : '✗'}</span>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>@effective/rison Demo</h1>
        <p>Live encoding/decoding — Source → Converted → Restored</p>
        <div className={styles.controls} role="radiogroup" aria-label="Compression mode">
          <span className={styles.controlsLabel}>Compression:</span>
          <label><input type="radio" name="mode" value="auto" checked={mode === 'auto'} onChange={() => setMode('auto')} /> auto</label>
          <label><input type="radio" name="mode" value="deflate" checked={mode === 'deflate'} onChange={() => setMode('deflate')} /> deflate</label>
          <label><input type="radio" name="mode" value="none" checked={mode === 'none'} onChange={() => setMode('none')} /> none</label>
        </div>
        <div className={styles.controls} role="radiogroup" aria-label="Storage encoding">
          <span className={styles.controlsLabel}>Storage encoding:</span>
          <label><input type="radio" name="storageEncoding" value="base32768" checked={storageEncoding === 'base32768'} onChange={() => setStorageEncoding('base32768')} /> base32768</label>
          <label><input type="radio" name="storageEncoding" value="base64" checked={storageEncoding === 'base64'} onChange={() => setStorageEncoding('base64')} /> base64</label>
        </div>
        <p>
          Repo: <a href="https://github.com/sebastian-software/effective-rison" target="_blank" rel="noreferrer">sebastian-software/effective-rison</a>
        </p>
      </header>

      <main className={styles.grid}>
        <section className={`${styles.card} ${styles.source}`}>
          <div className={styles.labelRow}>
            <label className={styles.title} htmlFor="source">Source (editable)</label>
            <div className={styles.metaInline}>
              <span>{/* reserved for future */}</span>
              <span>{sourceWarn}</span>
            </div>
          </div>
          {SourceControls}
          <textarea id="source" className={styles.textarea} value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false} wrap="off" />
        </section>

        <section className={`${styles.card} ${styles.convUrl}`}>
          <div className={styles.labelRow}>
            <label className={styles.title} htmlFor="convertedUrl">Converted (URL)</label>
            <div className={styles.metaInline}><span>{urlMeta}</span></div>
          </div>
          <textarea id="convertedUrl" className={`${styles.textarea} ${styles.converted} ${styles.readonly}`} readOnly wrap="soft" value={convertedUrl} />
        </section>

        <section className={`${styles.card} ${styles.restUrl}`}>
          <div className={styles.labelRow}>
            <div className={styles.statusWrap}>
              <label className={styles.title} htmlFor="restoredUrl">Restored (URL)</label>
              <Status ok={urlOk} />
            </div>
          </div>
          <textarea id="restoredUrl" className={`${styles.textarea} ${styles.readonly}`} readOnly wrap="off" value={restoredUrl} />
        </section>

        <section className={`${styles.card} ${styles.convStorage}`}>
          <div className={styles.labelRow}>
            <label className={styles.title} htmlFor="storageToken">Converted (Storage)</label>
            <div className={styles.metaInline}><span>{storageMeta}</span></div>
          </div>
          <textarea id="storageToken" className={`${styles.textarea} ${styles.converted} ${styles.readonly}`} readOnly wrap="soft" value={storageToken} />
        </section>

        <section className={`${styles.card} ${styles.restStorage}`}>
          <div className={styles.labelRow}>
            <div className={styles.statusWrap}>
              <label className={styles.title} htmlFor="storageRestored">Restored (Storage)</label>
              <Status ok={storageOk} />
            </div>
          </div>
          <textarea id="storageRestored" className={`${styles.textarea} ${styles.readonly}`} readOnly wrap="off" value={storageRestored} />
        </section>
      </main>

      <footer className={styles.header}>
        <small style={{ color: 'var(--muted)' }}>TypeScript-first, ESM-only. © Sebastian Software GmbH.</small>
      </footer>
    </div>
  )
}
