export function usePresets() {
  async function load(name: 'short' | 'medium' | 'long'): Promise<string> {
    const m = await import(`../data/${name}.json`)
    return JSON.stringify(m.default, null, 2)
  }
  return { load }
}

