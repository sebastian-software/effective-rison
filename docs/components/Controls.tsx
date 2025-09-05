import ui from '../styles/Primitives.module.css'

export function Controls({
  mode,
  onMode,
  storageEncoding,
  onStorageEncoding
}: {
  mode: 'auto' | 'deflate' | 'none'
  onMode: (m: 'auto' | 'deflate' | 'none') => void
  storageEncoding: 'base32768' | 'base64'
  onStorageEncoding: (e: 'base32768' | 'base64') => void
}) {
  return (
    <>
      <div className={ui.controls} role="radiogroup" aria-label="Compression mode">
        <span className={ui.controlsLabel}>Compression:</span>
        <label><input type="radio" name="mode" value="auto" checked={mode === 'auto'} onChange={() => onMode('auto')} /> auto</label>
        <label><input type="radio" name="mode" value="deflate" checked={mode === 'deflate'} onChange={() => onMode('deflate')} /> deflate</label>
        <label><input type="radio" name="mode" value="none" checked={mode === 'none'} onChange={() => onMode('none')} /> none</label>
      </div>
      <div className={ui.controls} role="radiogroup" aria-label="Storage encoding">
        <span className={ui.controlsLabel}>Storage encoding:</span>
        <label><input type="radio" name="storageEncoding" value="base32768" checked={storageEncoding === 'base32768'} onChange={() => onStorageEncoding('base32768')} /> base32768</label>
        <label><input type="radio" name="storageEncoding" value="base64" checked={storageEncoding === 'base64'} onChange={() => onStorageEncoding('base64')} /> base64</label>
      </div>
    </>
  )
}
