export default function MoodJournal({ userPins, streak, journalSummary, loadingJournal }) {
  return (
    <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontWeight:600, fontSize:13, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
          <span>📓</span> My Mood Today
        </div>
        {streak.count >= 2 && (
          <div style={{ fontSize:11, color:'#FF9800', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
            <span className="streak-fire">🔥</span> {streak.count} day streak
          </div>
        )}
      </div>

      {userPins.length === 0 ? (
        <div style={{ fontSize:12, color:'#767676', textAlign:'center', padding:'8px 0', lineHeight:1.7 }}>
          Click the map to drop your first mood pin today
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {userPins.map(p => (
              <div key={p.id} className="journal-entry"
                style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background:p.color, boxShadow:`0 0 0 3px ${p.color}2a`
                }}/>
                <div style={{ fontSize:11, color:'#767676', minWidth:58, flexShrink:0 }}>{p.time}</div>
                <div style={{ fontSize:12, color:'#333' }}>
                  {p.emoji} <strong>{p.mood}</strong> near {p.area}
                </div>
              </div>
            ))}
          </div>

          {/* AI personal summary */}
          {userPins.length >= 2 && (
            <div style={{ borderTop:'1px solid #f0f0f0', marginTop:12, paddingTop:12 }}>
              {loadingJournal ? (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11, color:'#767676' }}>reflecting on your day…</span>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              ) : journalSummary ? (
                <div className="journal-summary">{journalSummary}</div>
              ) : null}
            </div>
          )}

          {/* Streak message */}
          <div style={{ marginTop:12, fontSize:11, lineHeight:1.6 }}>
            {streak.count === 1 ? (
              <span style={{ color:'#636363' }}>✨ First check-in today — great start!</span>
            ) : streak.count >= 2 ? (
              <span style={{ color:'#FF9800', display:'flex', alignItems:'center', gap:4 }}>
                <span className="streak-fire">🔥</span>
                You've checked in {streak.count} days in a row — self-awareness is a superpower.
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
