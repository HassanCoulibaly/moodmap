import { useState } from 'react'
import { MOODS, POSITIVE_MOODS, STORY_PLACEHOLDERS } from '../constants'
import { getArea } from '../utils'

export default function UpdateMoodPanel({ pin, onClose, onUpdate }) {
  const [step, setStep] = useState('pick')
  const [newMood, setNewMood] = useState(null)
  const [story, setStory] = useState('')
  const area = getArea(pin.lat)
  const placeholder = STORY_PLACEHOLDERS[pin.id % STORY_PLACEHOLDERS.length]

  function handleMoodPick(mood) {
    const better = POSITIVE_MOODS.includes(mood.label) && !POSITIVE_MOODS.includes(pin.mood)
    if (better) { setNewMood(mood); setStep('celebrate') }
    else onUpdate(pin.id, mood, null)
  }

  return (
    <div className="update-panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'#333' }}>
          {step === 'pick' ? '📍 Update My Mood' : '🎉 Look at that growth!'}
        </div>
        <button onClick={onClose} aria-label="Close update panel" style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#767676', minHeight:44, minWidth:44 }}>✕</button>
      </div>

      {step === 'pick' ? (
        <>
          <div style={{
            fontSize:12, color:'#666', marginBottom:14, padding:'9px 12px',
            background:'#f8f9fa', borderRadius:8, borderLeft:`3px solid ${pin.color}`, lineHeight:1.6
          }}>
            You felt {pin.emoji} <strong>{pin.mood}</strong> at {pin.time} near {area}
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:10 }}>How are you feeling now?</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {MOODS.map(mood => (
              <button key={mood.label} onClick={() => handleMoodPick(mood)} style={{
                flex:'1 0 auto', background: mood.color+'18', border:`2px solid ${mood.color}`,
                borderRadius:10, padding:'8px 6px', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3
              }}>
                <span style={{ fontSize:18 }}>{mood.emoji}</span>
                <span style={{ fontSize:10, color:'#444' }}>{mood.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{
            background:`linear-gradient(135deg, ${pin.color}18, ${newMood.color}18)`,
            borderRadius:12, padding:'14px 14px', marginBottom:14, textAlign:'center'
          }}>
            <div style={{ fontSize:26, marginBottom:6 }}>{pin.emoji} → {newMood.emoji}</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#333' }}>
              You went from {pin.mood} to {newMood.label}!
            </div>
            <div style={{ fontSize:12, color:'#666', marginTop:4, lineHeight:1.5 }}>
              That's incredible — what helped you turn it around?
            </div>
          </div>
          <textarea
            value={story}
            onChange={e => setStory(e.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{
              width:'100%', padding:'10px 12px', borderRadius:10,
              border:'1.5px solid #e0e0e0', fontSize:12, lineHeight:1.6,
              resize:'none', fontFamily:'inherit', boxSizing:'border-box'
            }}
          />
          <div style={{ fontSize:11, color:'#767676', margin:'6px 0 12px' }}>
            Share anonymously · inspires other students · optional
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => onUpdate(pin.id, newMood, story.trim() || null)}
              style={{
                flex:2, padding:'10px 0', borderRadius:10, border:'none',
                background: newMood.color, color:'white',
                fontWeight:700, fontSize:12, cursor:'pointer'
              }}
            >
              {story.trim() ? '✨ Share & Inspire Others' : '✨ Update Mood'}
            </button>
            <button
              onClick={() => onUpdate(pin.id, newMood, null)}
              style={{
                flex:1, padding:'10px 0', borderRadius:10,
                border:'1px solid #ddd', background:'white',
                fontSize:12, color:'#636363', cursor:'pointer'
              }}
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  )
}
