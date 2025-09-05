import ui from './PresetButtons.module.css'

export function PresetButtons({ onLoad }: { onLoad: (json: string) => void }) {
  return (
    <div className={ui.buttons}>
      <button
        className={ui.button}
        onClick={async () => {
          const m = await import('../data/short.json')
          onLoad(JSON.stringify(m.default, null, 2))
        }}
      >
        Short
      </button>
      <button
        className={ui.button}
        onClick={async () => {
          const m = await import('../data/medium.json')
          onLoad(JSON.stringify(m.default, null, 2))
        }}
      >
        Medium
      </button>
      <button
        className={ui.button}
        onClick={async () => {
          const m = await import('../data/long.json')
          onLoad(JSON.stringify(m.default, null, 2))
        }}
      >
        Long
      </button>
    </div>
  )
}
