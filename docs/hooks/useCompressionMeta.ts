export function useCompressionMeta() {
  function metaFrom(source: string, converted: string): string {
    try {
      const obj = JSON.parse(source)
      const minJson = JSON.stringify(obj)
      const baseLen = minJson.length
      const convLen = converted.length
      const eff = baseLen > 0 ? Math.round(((baseLen - convLen) / baseLen) * 100) : 0
      return `Characters: ${convLen} • Compression: ${baseLen > 0 ? `${eff}%` : 'n/a'}`
    } catch {
      return `Characters: ${converted.length} • Compression: n/a`
    }
  }
  return { metaFrom }
}

