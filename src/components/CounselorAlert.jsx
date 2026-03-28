import { useState, useEffect } from 'react'
import { ALERT_CONFIG, KNOWN_AREAS } from '../constants'

export default function CounselorAlert({ vibe, hotspot }) {
  const [sent, setSent] = useState(false)

  useEffect(() => { setSent(false) }, [vibe])

  const cfg = ALERT_CONFIG[vibe] || ALERT_CONFIG['Stressed']
  const loc = KNOWN_AREAS.find(a => hotspot?.includes(a)) || 'campus center'

  return (
    <div style={{
      background: cfg.bg, borderRadius: 12, padding: 14,
      border: `1px solid ${cfg.border}`
    }}>
      <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginBottom: 6 }}>
        {cfg.label}
      </div>
      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.65, marginBottom: 12 }}>
        {cfg.message(loc)}
      </div>

      {sent ? (
        <>
          <div className="sent-row">
            <span className="sent-check">✓</span>
            Notification sent to 847 students
          </div>
          <div className="mock-notification">
            📱 {cfg.notification}
          </div>
        </>
      ) : (
        <button
          className="alert-action-btn"
          onClick={() => setSent(true)}
          style={{ background: cfg.color, color: 'white' }}
        >
          {cfg.buttonLabel}
        </button>
      )}
    </div>
  )
}
