import { useState } from 'react'
import { CRISIS_ACTIONS } from '../constants'

export default function CrisisPanel({ onDeactivate, onResolution, resolutionActive }) {
  const [confirmed, setConfirmed] = useState(new Set())

  function confirm(i) {
    setConfirmed(prev => new Set([...prev, i]))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Flashing alert banner */}
      <div className="crisis-banner" style={{
        background:'linear-gradient(135deg, #7f0000, #b71c1c)',
        color:'white', borderRadius:12, padding:'14px 16px',
      }}>
        <div style={{ fontWeight:800, fontSize:13, letterSpacing:0.3, marginBottom:5, display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:18 }}>⚠️</span> ELEVATED STRESS DETECTED
        </div>
        <div style={{ fontSize:12, opacity:0.92, lineHeight:1.6 }}>
          67% of campus reporting negative emotions in the last 30 minutes
        </div>
      </div>

      {/* Recommended actions */}
      <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #ffcdd2' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#b71c1c', letterSpacing:0.8, marginBottom:10 }}>
          RECOMMENDED IMMEDIATE ACTIONS
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {CRISIS_ACTIONS.map((action, i) => (
            <div
              key={i}
              className="crisis-action"
              style={{
                background:'#fff5f5', borderRadius:10, padding:'10px 12px',
                border:'1px solid #ffcdd2',
                animationDelay:`${i * 90}ms`
              }}
            >
              <div style={{ fontSize:12, color:'#333', marginBottom:8, display:'flex', alignItems:'flex-start', gap:7, lineHeight:1.5 }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{action.icon}</span>
                <span>{action.label}</span>
              </div>
              {confirmed.has(i) ? (
                <div className="sent-row" style={{ fontSize:11 }}>
                  <span className="sent-check" style={{ width:20, height:20, fontSize:11 }}>✓</span>
                  {action.confirm}
                </div>
              ) : (
                <button
                  className="crisis-confirm-btn"
                  onClick={() => confirm(i)}
                  style={{ background:'#b71c1c' }}
                >
                  Confirm Action
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resolution mode */}
      <button
        onClick={onResolution}
        disabled={resolutionActive}
        style={{
          width:'100%', padding:'12px 0', borderRadius:10, border:'none',
          background: resolutionActive
            ? 'linear-gradient(135deg, #388e3c, #66bb6a)'
            : 'linear-gradient(135deg, #1b5e20, #2e7d32)',
          color:'white', fontWeight:700, fontSize:13,
          cursor: resolutionActive ? 'default' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8
        }}
      >
        {resolutionActive ? (
          <span className="resolution-label">🌿 Resolution in Progress…</span>
        ) : (
          '🌿 Activate Resolution Mode'
        )}
      </button>

      {/* Deactivate */}
      <button
        onClick={onDeactivate}
        style={{
          width:'100%', padding:'9px 0', borderRadius:10,
          border:'1px solid #ddd', background:'white',
          fontSize:12, color:'#636363', cursor:'pointer',
          transition:'background 0.15s'
        }}
      >
        ✕ Deactivate Crisis Mode
      </button>
    </div>
  )
}
