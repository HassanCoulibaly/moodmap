import { MOODS } from '../constants'

export default function MoodCount({ pins }) {
  const counts = {}
  MOODS.forEach(m => counts[m.label] = 0)
  pins.forEach(p => { if (counts[p.mood] !== undefined) counts[p.mood]++ })
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {MOODS.map(m => (
        <div key={m.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>{m.emoji}</span>
          <div style={{ flex:1, height:8, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              width:`${pins.length ? (counts[m.label]/pins.length)*100 : 0}%`,
              height:'100%', background:m.color, borderRadius:4, transition:'width 0.5s'
            }}/>
          </div>
          <span style={{ fontSize:12, color:'#666', minWidth:16 }}>{counts[m.label]}</span>
        </div>
      ))}
    </div>
  )
}
