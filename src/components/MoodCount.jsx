import { MOODS } from '../constants'
import './MoodCount.css'

export default function MoodCount({ pins }) {
  const counts = {}
  MOODS.forEach(m => counts[m.label] = 0)
  pins.forEach(p => { if (counts[p.mood] !== undefined) counts[p.mood]++ })

  return (
    <div className="mood-count-list">
      {MOODS.map(m => (
        <div key={m.label} className="mood-count-row">
          <span className="mood-count-emoji" aria-hidden="true">{m.emoji}</span>
          <div className="mood-count-track">
            <div
              className="mood-count-fill"
              style={{
                width: `${pins.length ? (counts[m.label] / pins.length) * 100 : 0}%`,
                '--mood-fill': m.color
              }}
            />
          </div>
          <span className="mood-count-number">{counts[m.label]}</span>
        </div>
      ))}
    </div>
  )
}
