import { useState, useEffect, useRef } from 'react'
import './App.css'
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getAIInsights, getAIComfort, getAIChat, getJournalSummary } from './api'

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getTodayStr() { return new Date().toISOString().split('T')[0] }

function initJournalPins() {
  const today = getTodayStr()
  if (localStorage.getItem('moodmap_journal_date') !== today) {
    localStorage.setItem('moodmap_journal_date', today)
    localStorage.setItem('moodmap_journal_pins', '[]')
    localStorage.removeItem('moodmap_journal_summary')
    return []
  }
  try { return JSON.parse(localStorage.getItem('moodmap_journal_pins') || '[]') }
  catch { return [] }
}

function initStreak() {
  return {
    count: parseInt(localStorage.getItem('moodmap_streak_count') || '0'),
    last:  localStorage.getItem('moodmap_streak_last') || ''
  }
}

function bumpStreak() {
  const today = getTodayStr()
  const { count, last } = initStreak()
  if (last === today) return { count, last }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const newCount = last === yStr ? count + 1 : 1
  localStorage.setItem('moodmap_streak_count', String(newCount))
  localStorage.setItem('moodmap_streak_last', today)
  return { count: newCount, last: today }
}
function loadRecoveryStories() {
  try { return JSON.parse(localStorage.getItem('moodmap_recovery_stories') || '[]') }
  catch { return [] }
}
function saveRecoveryStories(s) {
  localStorage.setItem('moodmap_recovery_stories', JSON.stringify(s))
}
// ─────────────────────────────────────────────────────────────────────────────

const MOODS = [
  { label: 'Happy',    emoji: '😊', color: '#4CAF50' },
  { label: 'Excited',  emoji: '🤩', color: '#FF9800' },
  { label: 'Anxious',  emoji: '😰', color: '#9C27B0' },
  { label: 'Stressed', emoji: '😤', color: '#F44336' },
  { label: 'Sad',      emoji: '😔', color: '#2196F3' },
]

const GSU_CENTER = [33.7490, -84.3880]

const SEED_PINS = [
  {id:1,  lat:33.7502, lng:-84.3871, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:02 AM'},
  {id:2,  lat:33.7498, lng:-84.3878, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:05 AM'},
  {id:3,  lat:33.7501, lng:-84.3865, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:08 AM'},
  {id:4,  lat:33.7489, lng:-84.3882, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:10 AM'},
  {id:5,  lat:33.7485, lng:-84.3890, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:12 AM'},
  {id:6,  lat:33.7493, lng:-84.3876, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:15 AM'},
  {id:7,  lat:33.7478, lng:-84.3885, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:18 AM'},
  {id:8,  lat:33.7506, lng:-84.3868, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:20 AM'},
  {id:9,  lat:33.7511, lng:-84.3874, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:22 AM'},
  {id:10, lat:33.7487, lng:-84.3891, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:25 AM'},
  {id:11, lat:33.7496, lng:-84.3863, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:28 AM'},
  {id:12, lat:33.7503, lng:-84.3880, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:30 AM'},
  {id:13, lat:33.7481, lng:-84.3872, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:33 AM'},
  {id:14, lat:33.7509, lng:-84.3861, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:35 AM'},
  {id:15, lat:33.7474, lng:-84.3888, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:38 AM'},
  {id:16, lat:33.7518, lng:-84.3877, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:40 AM'},
  {id:17, lat:33.7490, lng:-84.3856, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:42 AM'},
  {id:18, lat:33.7483, lng:-84.3895, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:45 AM'},
  {id:19, lat:33.7507, lng:-84.3883, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:48 AM'},
  {id:20, lat:33.7476, lng:-84.3869, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:50 AM'},
  {id:21, lat:33.7499, lng:-84.3858, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:52 AM'},
  {id:22, lat:33.7486, lng:-84.3875, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:55 AM'},
  {id:23, lat:33.7513, lng:-84.3890, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:58 AM'},
  {id:24, lat:33.7470, lng:-84.3880, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:02 AM'},
  {id:25, lat:33.7494, lng:-84.3870, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:05 AM'},
  {id:26, lat:33.7505, lng:-84.3862, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:08 AM'},
  {id:27, lat:33.7480, lng:-84.3893, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:10 AM'},
  {id:28, lat:33.7516, lng:-84.3871, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:12 AM'},
  {id:29, lat:33.7491, lng:-84.3887, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:15 AM'},
  {id:30, lat:33.7473, lng:-84.3864, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:18 AM'},
  {id:31, lat:33.7508, lng:-84.3876, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:20 AM'},
  {id:32, lat:33.7484, lng:-84.3859, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:22 AM'},
  {id:33, lat:33.7497, lng:-84.3892, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:25 AM'},
  {id:34, lat:33.7512, lng:-84.3866, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:28 AM'},
  {id:35, lat:33.7477, lng:-84.3878, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:30 AM'},
  {id:36, lat:33.7502, lng:-84.3855, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:32 AM'},
  {id:37, lat:33.7469, lng:-84.3885, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:35 AM'},
  {id:38, lat:33.7520, lng:-84.3882, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:38 AM'},
  {id:39, lat:33.7488, lng:-84.3867, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:40 AM'},
  {id:40, lat:33.7495, lng:-84.3896, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:42 AM'},
]

function PinDropper({ onDrop, skipRef }) {
  useMapEvents({
    click(e) {
      if (skipRef.current) { skipRef.current = false; return }
      onDrop(e.latlng)
    }
  })
  return null
}

function MoodCount({ pins }) {
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

const POSITIVE_MOODS = ['Happy', 'Excited']
const MOOD_SCORE = { Happy: 5, Excited: 4, Sad: 2, Anxious: 2, Stressed: 1 }

// ── Emergency detection — 3 levels ───────────────────────────────────────────
// L1: Emotional distress — warm support, no alarm
const L1_WORDS = [
  'scared', 'worried', 'nervous', 'anxious', 'afraid',
  'uncomfortable', 'unsafe feeling', 'uneasy', 'freaked out',
]
// L2: Specific external threat — soft yellow check-in
const L2_WORDS = [
  'following me', 'someone is watching', 'feel threatened', 'this person',
  'he wont leave', "he won't leave", 'im being', "i'm being",
  'being watched', 'someone following', 'wont leave me alone',
  "won't leave me alone", 'making me uncomfortable', 'keeps following',
]
// L3: Explicit physical emergency — full red screen
const L3_WORDS = [
  'help me', 'attack', 'attacked', 'he hit', 'she hit', 'im being attacked',
  "i'm being attacked", 'call police', 'call 911', 'emergency', '911',
  'weapon', 'knife', 'gun', 'bleeding', 'i cant get away', "i can't get away",
  'he wont let me leave', "he won't let me leave", 'going to hurt',
  'going to kill', 'rape', 'kidnap', 'chasing me', 'please help',
  'cant breathe', "can't breathe",
]

function detectLevel(text) {
  const lower = text.toLowerCase().trim()
  // L3 checked first — most specific wins
  if (L3_WORDS.some(kw => lower.includes(kw))) return 3
  if (L2_WORDS.some(kw => lower.includes(kw))) return 2
  if (L1_WORDS.some(kw => lower.includes(kw))) return 1
  return 0
}
// ─────────────────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
}

function getArea(lat) {
  if (lat >= 33.750 && lat <= 33.752) return 'GSU Library'
  if (lat >= 33.748 && lat < 33.750) return 'Student Center'
  if (lat >= 33.746 && lat < 33.748) return 'Classroom South'
  return 'Five Points'
}

function CompanionPanel({ mood, color, onClose, onFeelBetter, extras = {},
  onEmergency, onSafeConfirmed, onMakeHappyPlace, happyPlaces = [], onShowHappyPlace }) {
  const [comfort, setComfort] = useState(null)
  const [typing, setTyping] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatTyping, setChatTyping] = useState(false)
  // 0=none, 1=L1 emotional, 2=L2 soft threat, 3=L3 full emergency
  const [emergencyLevel, setEmergencyLevel] = useState(0)
  const [helpNowQuestion, setHelpNowQuestion] = useState(false)
  const msgTimestampsRef = useRef([])
  const [happyPlaceDecided, setHappyPlaceDecided] = useState(false)
  const [madeHappyPlace, setMadeHappyPlace] = useState(false)
  const [listening, setListening] = useState(false)
  const [readAloud, setReadAloud] = useState(false)
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const isPositive = POSITIVE_MOODS.includes(mood)
  const activeHappyPlaces = happyPlaces.filter(p => !p.expired)
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    getAIComfort(mood, extras).then(data => {
      setComfort(data)
      setTyping(false)
    }).catch(() => {
      setComfort({
        message: "I'm here with you. Whatever you're feeling right now is valid.",
        action: "Take three slow, deep breaths.",
        joke: "Why do we tell actors to 'break a leg?' Because every play has a cast 😄",
        reminder: "You showed up today. That already takes courage.",
        musicVibes: null,
        recoveryPrompt: null
      })
      setTyping(false)
    })
  }, [mood])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setChatInput(transcript)
    }
    rec.onend = () => { setListening(false); recognitionRef.current = null }
    rec.onerror = () => { setListening(false); recognitionRef.current = null }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function speakText(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.92
    utter.pitch = 1.05
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const warm = voices.find(v =>
        v.lang.startsWith('en') &&
        /samantha|karen|moira|zira|female|victoria/i.test(v.name)
      ) || voices.find(v => v.lang.startsWith('en')) || null
      if (warm) utter.voice = warm
      window.speechSynthesis.speak(utter)
    }
    // Voices may not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length > 0) setVoice()
    else { window.speechSynthesis.onvoiceschanged = setVoice }
  }

  async function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatHistory(h => [...h, { from: 'user', text: msg }])

    // ── Track message timestamps for escalation (3+ in 60s) ──────────────
    const now = Date.now()
    msgTimestampsRef.current = [...msgTimestampsRef.current, now]
      .filter(t => now - t < 60000)
    const recentCount = msgTimestampsRef.current.length

    // ── Detect level of this specific message ─────────────────────────────
    const msgLevel = detectLevel(msg)

    // ── Apply escalation: 3+ rapid msgs while already L1/L2 bumps level ──
    let effectiveLevel = msgLevel
    setEmergencyLevel(prev => {
      if (recentCount >= 3 && prev >= 1) {
        effectiveLevel = Math.min(3, Math.max(msgLevel, prev + 1))
      } else {
        effectiveLevel = Math.max(msgLevel, prev)
      }
      return effectiveLevel
    })

    // ── L3: Full emergency ─────────────────────────────────────────────────
    if (effectiveLevel >= 3) {
      onEmergency?.()
      setChatHistory(h => [...h, {
        from: 'ai',
        text: "This sounds serious. Your safety comes first. Please call 911 or Campus Police immediately. If you cannot call, text 911 in Georgia. Stay in a lit public area. I am here with you.",
        lvl: 3
      }])
      return
    }

    // ── L2: Soft safety check ──────────────────────────────────────────────
    if (effectiveLevel === 2) {
      setChatHistory(h => [...h, {
        from: 'ai',
        text: "I want to make sure you're okay. Are you in a safe place right now? If you feel physically threatened at any point, please don't hesitate to call Campus Police or 911.",
        lvl: 2
      }])
      return
    }

    // ── L1 or 0: AI responds normally ─────────────────────────────────────
    setChatTyping(true)
    try {
      const { reply } = await getAIChat(mood, msg)
      setChatHistory(h => [...h, { from: 'ai', text: reply, lvl: effectiveLevel }])
      if (readAloud) speakText(reply)
    } catch {
      const fallback = "I'm still here. Tell me more."
      setChatHistory(h => [...h, { from: 'ai', text: fallback, lvl: effectiveLevel }])
      if (readAloud) speakText(fallback)
    }
    setChatTyping(false)
  }

  function handleSafe() {
    setEmergencyLevel(0)
    setHelpNowQuestion(false)
    onSafeConfirmed?.()
    setChatHistory(h => [...h, {
      from: 'ai',
      text: "I'm so glad you're safe. Would you like to keep talking? I'm here.",
      lvl: 0
    }])
  }

  const bg = isPositive ? '#f0fdf4' : '#fff8f8'
  const border = `2px solid ${color}33`

  return (
    <div className="companion-panel" style={{ borderTop: `4px solid ${color}` }}>

      {/* ── L3: Full-screen emergency overlay ────────────────────── */}
      {emergencyLevel >= 3 && (
        <div className="emergency-overlay">
          <div className="emergency-box">
            <div className="emergency-title">🚨 ARE YOU IN IMMEDIATE DANGER?</div>
            <div className="emergency-btns">
              <a href="tel:911" className="emergency-btn emergency-btn-911">
                📞 CALL 911
              </a>
              <a href="tel:+14044135717" className="emergency-btn emergency-btn-police">
                📞 CALL GSU CAMPUS POLICE
              </a>
              <button className="emergency-btn emergency-btn-safe" onClick={handleSafe}>
                ✓ I AM SAFE — False Alarm
              </button>
            </div>
            <div className="emergency-location-note">
              Your location has been flagged on the map.<br />
              Stay in a visible public area if possible.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>{isPositive ? '🌟' : '🤗'}</span>
          <span style={{ fontWeight:700, fontSize:14, color:'#222' }}>
            {isPositive ? 'Your vibe is amazing!' : 'Hey, I got you.'}
          </span>
        </div>
        <button onClick={onClose} style={{
          background:'none', border:'none', fontSize:18,
          cursor:'pointer', color:'#aaa', lineHeight:1
        }}>✕</button>
      </div>

      {typing ? (
        <div style={{ display:'flex', gap:5, padding:'10px 0', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#888' }}>typing</span>
          <div className="typing-dots">
            <span style={{ background: color }} /><span style={{ background: color }} /><span style={{ background: color }} />
          </div>
        </div>
      ) : comfort && (
        <>
          {/* Message */}
          <div style={{ background: bg, border, borderRadius:12, padding:12, marginBottom:10, fontSize:13, lineHeight:1.7, color:'#333' }}>
            {comfort.message}
          </div>

          {/* Joke / fun fact */}
          <div style={{ background:'#fffbea', border:'1px solid #fde68a', borderRadius:10, padding:10, marginBottom:10, fontSize:12, color:'#78350f', lineHeight:1.6 }}>
            💡 {comfort.joke}
          </div>

          {/* Action */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:16, marginTop:1 }}>🎯</span>
            <div style={{ fontSize:13, color:'#444', lineHeight:1.6 }}>
              <strong>Right now:</strong> {comfort.action}
            </div>
          </div>

          {/* Reminder */}
          <div style={{
            borderLeft: `3px solid ${color}`, paddingLeft:10,
            fontSize:12, color:'#555', fontStyle:'italic', lineHeight:1.6, marginBottom:10
          }}>
            {comfort.reminder}
          </div>

          {/* Music vibes */}
          {comfort.musicVibes && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>🎵</span>
              <div style={{ fontSize:12, color:'#444', lineHeight:1.6 }}>
                <strong>Right now:</strong> {comfort.musicVibes}
              </div>
            </div>
          )}

          {/* Recovery / reflection prompt */}
          {comfort.recoveryPrompt && (
            <div style={{
              background:'#f8f4ff', borderRadius:10, padding:'9px 12px',
              fontSize:12, color:'#7c3aed', lineHeight:1.6, marginBottom:14,
              fontStyle:'italic'
            }}>
              💭 {comfort.recoveryPrompt}
            </div>
          )}

          {/* Buttons */}
          {isPositive ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={onClose} style={{
                width:'100%', padding:'10px 0', borderRadius:10, border:'none',
                background: color, color:'white', fontWeight:700, fontSize:13, cursor:'pointer'
              }}>
                Keep spreading good vibes ✨
              </button>

              {/* Happy Place prompt */}
              {!happyPlaceDecided && (
                <div className="happy-place-prompt">
                  <div style={{ fontSize:13, fontWeight:700, color:'#854d0e', marginBottom:3 }}>
                    ✨ Make this a Happy Place?
                  </div>
                  <div style={{ fontSize:11, color:'#92400e', marginBottom:10, lineHeight:1.5 }}>
                    Invite others who are struggling to come find your good energy here.
                  </div>
                  <div style={{ display:'flex', gap:7 }}>
                    <button
                      onClick={() => { setHappyPlaceDecided(true); setMadeHappyPlace(true); onMakeHappyPlace?.() }}
                      style={{
                        flex:2, padding:'9px 0', borderRadius:9, border:'none',
                        background:'#d97706', color:'white',
                        fontWeight:700, fontSize:12, cursor:'pointer'
                      }}
                    >
                      Yes, open this spot 🌟
                    </button>
                    <button
                      onClick={() => setHappyPlaceDecided(true)}
                      style={{
                        flex:1, padding:'9px 0', borderRadius:9,
                        border:'1px solid #e0c97f', background:'transparent',
                        fontSize:11, color:'#92400e', cursor:'pointer'
                      }}
                    >
                      Keep private
                    </button>
                  </div>
                </div>
              )}
              {madeHappyPlace && (
                <div style={{
                  background:'#fef3c7', borderRadius:10, padding:'10px 12px',
                  fontSize:12, color:'#78350f', lineHeight:1.6,
                  border:'1px solid #fde68a', textAlign:'center'
                }}>
                  🌟 Happy Place created! Others can now see your spot and join your energy.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Nearby Happy Places — shown to struggling users */}
              {activeHappyPlaces.length > 0 && (
                <div className="nearby-happy-places">
                  <div style={{ fontSize:12, fontWeight:700, color:'#1e3a5f', marginBottom:4 }}>
                    You don't have to be alone right now.
                  </div>
                  <div style={{ fontSize:11, color:'#374151', lineHeight:1.6, marginBottom:8 }}>
                    There are Happy Places nearby where people are gathered and welcoming company.
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {activeHappyPlaces.slice(0, 3).map(place => (
                      <div key={place.id} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        gap:8, background:'#fffbeb', borderRadius:8,
                        padding:'7px 10px', border:'1px solid #fde68a'
                      }}>
                        <span style={{ fontSize:12, color:'#78350f' }}>
                          😊 <strong>near {place.area}</strong> — {place.count} {place.count === 1 ? 'person' : 'people'}
                        </span>
                        <button
                          onClick={() => onShowHappyPlace?.(place)}
                          style={{
                            background:'#d97706', color:'white',
                            border:'none', borderRadius:8,
                            padding:'4px 10px', fontSize:10,
                            fontWeight:700, cursor:'pointer', flexShrink:0
                          }}
                        >
                          Show me
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showChat && (
                <button onClick={() => setShowChat(true)} style={{
                  width:'100%', padding:'10px 0', borderRadius:10, border:`2px solid ${color}`,
                  background:'white', color: color, fontWeight:700, fontSize:13, cursor:'pointer'
                }}>
                  💬 Talk to me
                </button>
              )}
              <button onClick={onFeelBetter} style={{
                width:'100%', padding:'10px 0', borderRadius:10, border:'none',
                background: color, color:'white', fontWeight:700, fontSize:13, cursor:'pointer'
              }}>
                I feel a bit better 💛
              </button>
            </div>
          )}

          {/* Chat */}
          {showChat && (
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>

              {/* Header row — privacy note + read-aloud toggle */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:11, color:'#888' }}>
                  Anonymous — nothing is saved 🔒
                </div>
                <button
                  onClick={() => { if (readAloud) window.speechSynthesis?.cancel(); setReadAloud(r => !r) }}
                  title={readAloud ? 'Turn off read aloud' : 'Read AI replies aloud'}
                  style={{
                    background: readAloud ? `${color}18` : 'transparent',
                    border: `1.5px solid ${readAloud ? color : '#ddd'}`,
                    borderRadius:20, padding:'3px 10px',
                    fontSize:12, cursor:'pointer',
                    color: readAloud ? color : '#aaa',
                    display:'flex', alignItems:'center', gap:4,
                    transition:'all 0.2s'
                  }}
                >
                  {readAloud ? '🔊' : '🔇'} <span style={{ fontSize:10 }}>{readAloud ? 'On' : 'Off'}</span>
                </button>
              </div>

              {/* ── L2: Yellow safety banner ───────────────────────────── */}
              {emergencyLevel === 2 && (
                <div className="emergency-l2-banner">
                  📞 If you need help: <strong>Campus Police 404-413-5717</strong>
                </div>
              )}

              {/* Message bubbles */}
              <div style={{
                maxHeight:180, overflowY:'auto', display:'flex',
                flexDirection:'column', gap:6, padding:'4px 0'
              }}>
                {chatHistory.length === 0 && (
                  <div style={{ fontSize:12, color:'#aaa', textAlign:'center', padding:'8px 0' }}>
                    Tell me what's on your mind...
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                      background: m.from === 'user' ? color : '#f0f0f0',
                      color: m.from === 'user' ? 'white' : '#333',
                      borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding:'8px 12px', fontSize:12, lineHeight:1.6,
                      maxWidth:'85%'
                    }}>
                      {m.text}
                    </div>
                    {/* L1: subtle help link under every AI message */}
                    {m.from === 'ai' && emergencyLevel >= 1 && (
                      <button
                        className="emergency-tap-link"
                        onClick={() => { setEmergencyLevel(3); onEmergency?.() }}
                      >
                        Need emergency help? Tap here
                      </button>
                    )}
                  </div>
                ))}
                {chatTyping && (
                  <div style={{ alignSelf:'flex-start', background:'#f0f0f0', borderRadius:'14px 14px 14px 4px', padding:'8px 12px', display:'flex', gap:4, alignItems:'center' }}>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* ── L2: "I need help now" button / confirm question ────── */}
              {emergencyLevel === 2 && !helpNowQuestion && (
                <button
                  className="help-now-btn"
                  onClick={() => setHelpNowQuestion(true)}
                >
                  I need help now
                </button>
              )}
              {emergencyLevel === 2 && helpNowQuestion && (
                <div className="help-now-question">
                  <div style={{ fontSize:12, fontWeight:600, color:'#7c2d12', marginBottom:8, lineHeight:1.5 }}>
                    Are you in immediate physical danger right now?
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      className="help-now-yes"
                      onClick={() => { setEmergencyLevel(3); setHelpNowQuestion(false); onEmergency?.() }}
                    >
                      YES, I need help
                    </button>
                    <button
                      className="help-now-no"
                      onClick={() => {
                        setHelpNowQuestion(false)
                        setChatHistory(h => [...h, {
                          from: 'ai',
                          text: "I'm here with you. Tell me what's happening and we'll figure this out together.",
                          lvl: 1
                        }])
                      }}
                    >
                      No, I'm okay
                    </button>
                  </div>
                </div>
              )}

              {/* Input row */}
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder={listening ? 'Listening...' : 'Type how you feel...'}
                  style={{
                    flex:1, padding:'8px 12px', borderRadius:20,
                    border:`1.5px solid ${listening ? '#ef4444' : color + '55'}`,
                    fontSize:12, outline:'none', fontFamily:'inherit',
                    transition:'border-color 0.2s'
                  }}
                />
                {speechSupported && (
                  <div className="mic-btn-wrapper">
                    <button
                      className={`mic-btn${listening ? ' mic-listening' : ''}`}
                      onClick={() => listening ? stopListening() : startListening()}
                      title="Tap to speak — we'll listen"
                      aria-label={listening ? 'Stop listening' : 'Start voice input'}
                    >
                      🎤
                    </button>
                  </div>
                )}
                <button onClick={sendChat} style={{
                  background: color, color:'white', border:'none',
                  borderRadius:20, padding:'8px 14px', fontSize:12,
                  cursor:'pointer', fontWeight:600, flexShrink:0
                }}>Send</button>
              </div>

              {/* Listening status label */}
              {listening && (
                <div className="listening-label">
                  <span className="listening-dot" />
                  Listening… tap mic to stop
                </div>
              )}

              {/* ── Permanent safety footer ────────────────────────────── */}
              <div className="chat-safety-footer">
                Campus Police: 404-413-5717&nbsp;&nbsp;|&nbsp;&nbsp;Crisis Text Line: Text HOME to 741741
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const KNOWN_AREAS = ['GSU Library', 'Student Center', 'Classroom South', 'Five Points']

const ALERT_CONFIG = {
  Anxious: {
    color: '#9C27B0', bg: '#f3e5f5', border: '#ce93d8',
    label: 'ANXIETY CLUSTER ALERT',
    message: loc =>
      `Anxiety cluster detected near ${loc}. Recommended: Deploy a peer support ambassador to this area. Consider sending a campus-wide breathing exercise notification.`,
    buttonLabel: '🌬️ Send Campus Wellness Tip',
    notification: 'Deep breath: Inhale 4 counts, hold 4, exhale 4. You\'ve got this. — GSU Wellness Team',
  },
  Stressed: {
    color: '#F44336', bg: '#ffebee', border: '#ef9a9a',
    label: 'HIGH STRESS ZONE ALERT',
    message: loc =>
      `High stress zone near ${loc}. Peak stress detected — possibly exam or deadline related. Recommended: Open the quiet study room, extend library hours, send a motivational message.`,
    buttonLabel: '💪 Send Encouragement',
    notification: 'You\'re closer than you think. Keep going. — GSU Cares Team',
  },
  Sad: {
    color: '#2196F3', bg: '#e3f2fd', border: '#90caf9',
    label: 'LOW MOOD CLUSTER ALERT',
    message: loc =>
      `Low mood cluster detected near ${loc}. Students may need connection. Recommended: Activate the buddy system — pair lonely students with peer mentors.`,
    buttonLabel: '🤝 Activate Buddy System',
    notification: 'Hey, you matter. A peer mentor will check in with you today. — GSU Connects',
  },
  Happy: {
    color: '#4CAF50', bg: '#e8f5e9', border: '#a5d6a7',
    label: 'POSITIVE ENERGY DETECTED',
    message: loc =>
      `Positive energy radiating from ${loc}! Great time to host a spontaneous community event or social activity here.`,
    buttonLabel: '🎉 Share the Joy',
    notification: 'Good vibes detected near the Student Center — come join the energy! — GSU Community',
  },
  Excited: {
    color: '#FF9800', bg: '#fff3e0', border: '#ffcc80',
    label: 'HIGH ENERGY DETECTED',
    message: loc =>
      `Positive energy radiating from ${loc}! Great time to host a spontaneous community event or social activity here.`,
    buttonLabel: '🎉 Share the Joy',
    notification: 'Good vibes detected near the Student Center — come join the energy! — GSU Community',
  },
}

function CounselorAlert({ vibe, hotspot }) {
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

const STORY_PLACEHOLDERS = [
  'I went for a walk outside...',
  'I called my mom...',
  'I listened to my favourite song...',
  'I took a 10 min break and stretched...',
  'I got a coffee and watched the world go by...',
  'I talked to a friend about it...',
]

function UpdateMoodPanel({ pin, onClose, onUpdate }) {
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
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa' }}>✕</button>
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
              resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box'
            }}
          />
          <div style={{ fontSize:11, color:'#bbb', margin:'6px 0 12px' }}>
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
                fontSize:12, color:'#888', cursor:'pointer'
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

function RecoveryFeed({ stories, onHeart }) {
  function timeAgo(ts) {
    const min = Math.floor((Date.now() - ts) / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min} min ago`
    return `${Math.floor(min / 60)} hr ago`
  }
  return (
    <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
        <span>💫</span> Recovery Stories from Campus
      </div>
      {stories.length === 0 ? (
        <div style={{ fontSize:12, color:'#bbb', textAlign:'center', padding:'12px 0', lineHeight:1.7 }}>
          Update one of your mood pins to share your recovery journey anonymously — inspire others
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {stories.slice(0, 5).map(s => (
            <div key={s.id} className="story-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:17 }}>{s.fromEmoji} → {s.toEmoji}</span>
                <span style={{ fontSize:10, color:'#ccc' }}>{timeAgo(s.timestamp)}</span>
              </div>
              <div style={{ fontSize:11, color:'#aaa', marginBottom:5 }}>Near {s.area}</div>
              <div style={{ fontSize:12, color:'#555', lineHeight:1.7, fontStyle:'italic', marginBottom:8 }}>
                "{s.story}"
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button className="heart-btn" onClick={() => onHeart(s.id)}>❤️</button>
                <span style={{ fontSize:11, color:'#aaa' }}>
                  {s.hearts > 0
                    ? `This helped ${s.hearts} ${s.hearts === 1 ? 'person' : 'people'} today`
                    : 'Be the first to find this helpful'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CRISIS_ACTIONS = [
  {
    icon: '🏥',
    label: 'Open emergency counseling walk-ins',
    confirm: 'Walk-in center notified — opening immediately',
  },
  {
    icon: '📢',
    label: 'Send campus-wide wellness notification',
    confirm: 'Notification queued for 2,847 student devices',
  },
  {
    icon: '🤝',
    label: 'Deploy peer support team to hotspot zones',
    confirm: 'Team dispatched — ETA 4 minutes',
  },
]

function CrisisPanel({ onDeactivate, onResolution, resolutionActive }) {
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
          fontSize:12, color:'#888', cursor:'pointer',
          transition:'background 0.15s'
        }}
      >
        ✕ Deactivate Crisis Mode
      </button>
    </div>
  )
}

function MoodJournal({ userPins, streak, journalSummary, loadingJournal }) {
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
        <div style={{ fontSize:12, color:'#bbb', textAlign:'center', padding:'8px 0', lineHeight:1.7 }}>
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
                <div style={{ fontSize:11, color:'#aaa', minWidth:58, flexShrink:0 }}>{p.time}</div>
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
                  <span style={{ fontSize:11, color:'#aaa' }}>reflecting on your day…</span>
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
              <span style={{ color:'#888' }}>✨ First check-in today — great start!</span>
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

const WAVE_PINS = [
  { lat: 33.7515, lng: -84.3872 },
  { lat: 33.7512, lng: -84.3861 },
  { lat: 33.7508, lng: -84.3880 },
  { lat: 33.7497, lng: -84.3875 },
  { lat: 33.7493, lng: -84.3862 },
  { lat: 33.7489, lng: -84.3888 },
  { lat: 33.7484, lng: -84.3870 },
  { lat: 33.7479, lng: -84.3879 },
  { lat: 33.7473, lng: -84.3864 },
  { lat: 33.7468, lng: -84.3883 },
]

// Secret Ctrl+Shift+S demo pins — Library South cluster
const SECRET_STRESS_PINS = [
  { lat: 33.7511, lng: -84.3869 },
  { lat: 33.7514, lng: -84.3876 },
  { lat: 33.7508, lng: -84.3863 },
  { lat: 33.7516, lng: -84.3871 },
  { lat: 33.7505, lng: -84.3878 },
  { lat: 33.7519, lng: -84.3865 },
  { lat: 33.7502, lng: -84.3874 },
  { lat: 33.7513, lng: -84.3882 },
]

export default function App() {
  const [pins, setPins] = useState(SEED_PINS)
  const [pending, setPending] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wavePinIds, setWavePinIds] = useState(new Set())
  const [newPinIds, setNewPinIds] = useState(new Set())
  const [waving, setWaving] = useState(false)
  const [companion, setCompanion] = useState(null) // { pinId, mood, color }
  const [lastUpdated, setLastUpdated] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [activityFeed, setActivityFeed] = useState([])
  const [recentCount, setRecentCount] = useState(0)
  const [crisisMode, setCrisisMode] = useState(false)
  const [crisisPinIds, setCrisisPinIds] = useState(new Set())
  const [resolutionMode, setResolutionMode] = useState(false)
  const [resolvedPinIds, setResolvedPinIds] = useState(new Set())
  const [userPins, setUserPins] = useState(() => initJournalPins())
  const [streak, setStreak] = useState(() => initStreak())
  const [journalSummary, setJournalSummary] = useState(() => localStorage.getItem('moodmap_journal_summary') || '')
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [updateTarget, setUpdateTarget] = useState(null)
  const [recoveryStories, setRecoveryStories] = useState(() => loadRecoveryStories())
  const [showResetBtn, setShowResetBtn] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetFlash, setResetFlash] = useState(false)
  const [sosPinIds, setSosPinIds] = useState(new Set())
  const [emergencyAlert, setEmergencyAlert] = useState(null) // { area }
  const [happyPlaces, setHappyPlaces] = useState([])
  const [happyPlaceIds, setHappyPlaceIds] = useState(new Set())
  const [joinToast, setJoinToast] = useState(null) // warm message text
  const timerRef = useRef(null)
  const mapRef = useRef(null)
  const recentTimerRef = useRef(null)
  const clickedPinRef = useRef(false)
  const secretStressRef = useRef(null)  // stable ref for keyboard handler closure

  useEffect(() => {
    if (!lastUpdated) return
    setSecondsAgo(0)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [lastUpdated])

  // Floating counter — recount every 30s or when pins change
  useEffect(() => {
    function countRecent() {
      const cutoff = Date.now() - 5 * 60 * 1000
      setRecentCount(pins.filter(p => p.timestamp && p.timestamp >= cutoff).length)
    }
    countRecent()
    clearInterval(recentTimerRef.current)
    recentTimerRef.current = setInterval(countRecent, 30000)
    return () => clearInterval(recentTimerRef.current)
  }, [pins])

  // Persist user journal pins to localStorage
  useEffect(() => {
    localStorage.setItem('moodmap_journal_pins', JSON.stringify(userPins))
  }, [userPins])

  // Happy Place expiry — remove spots with no joins in the last 30 minutes
  useEffect(() => {
    const iv = setInterval(() => {
      const cutoff = Date.now() - 30 * 60 * 1000
      setHappyPlaces(prev => {
        const expired = prev.filter(p => p.lastJoinAt < cutoff)
        if (expired.length > 0) {
          setHappyPlaceIds(ids => {
            const n = new Set(ids)
            expired.forEach(p => n.delete(p.id))
            return n
          })
          return prev.filter(p => p.lastJoinAt >= cutoff)
        }
        return prev
      })
    }, 60_000)
    return () => clearInterval(iv)
  }, [])

  // Secret keyboard shortcuts — Ctrl+Shift+R (reset) and Ctrl+Shift+S (stress cluster)
  useEffect(() => {
    function onKey(e) {
      if (!e.ctrlKey || !e.shiftKey) return
      if (e.key === 'R') {
        e.preventDefault()
        setShowResetBtn(prev => !prev)
        setShowResetConfirm(false)
      }
      if (e.key === 'S') {
        e.preventDefault()
        secretStressRef.current?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleReset() {
    setPins(SEED_PINS)
    setInsights(null)
    setLastUpdated(null)
    setSecondsAgo(0)
    setWavePinIds(new Set())
    setNewPinIds(new Set())
    setCrisisMode(false)
    setCrisisPinIds(new Set())
    setResolutionMode(false)
    setResolvedPinIds(new Set())
    setActivityFeed([])
    setRecentCount(0)
    setUpdateTarget(null)
    setCompanion(null)
    setPending(null)
    setRecoveryStories([])
    saveRecoveryStories([])
    setShowResetConfirm(false)
    setShowResetBtn(false)
    setSosPinIds(new Set())
    setEmergencyAlert(null)
    setHappyPlaces([])
    setHappyPlaceIds(new Set())
    setJoinToast(null)
    setResetFlash(true)
    setTimeout(() => setResetFlash(false), 2400)
  }

  function handleMakeHappyPlace(pinId) {
    const pin = pins.find(p => p.id === pinId)
    if (!pin) return
    const place = {
      id: pinId,
      lat: pin.lat, lng: pin.lng,
      area: getArea(pin.lat),
      mood: pin.mood, color: pin.color, emoji: pin.emoji,
      count: 1,
      createdAt: Date.now(),
      lastJoinAt: Date.now()
    }
    setHappyPlaces(prev => [place, ...prev])
    setHappyPlaceIds(prev => new Set([...prev, pinId]))
  }

  function handleJoinHappyPlace(placeId) {
    setHappyPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, count: p.count + 1, lastJoinAt: Date.now() } : p
    ))
    setJoinToast("You're heading somewhere good. The people there don't know you're coming — just show up, sit nearby, absorb the good energy. You don't have to say anything. 🌟")
    setTimeout(() => setJoinToast(null), 7000)
  }

  function handleShowHappyPlace(place) {
    mapRef.current?.flyTo([place.lat, place.lng], 17, { duration: 1.5 })
  }

  async function handleSecretStressWave() {
    if (waving || loading) return
    for (let i = 0; i < SECRET_STRESS_PINS.length; i++) {
      await new Promise(r => setTimeout(r, 250))
      const id = Date.now() + i
      const pin = {
        id,
        lat: SECRET_STRESS_PINS[i].lat,
        lng: SECRET_STRESS_PINS[i].lng,
        mood: 'Stressed', color: '#F44336', emoji: '😤',
        time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
        timestamp: Date.now()
      }
      const area = getArea(SECRET_STRESS_PINS[i].lat)
      setPins(prev => [...prev, pin])
      setNewPinIds(prev => new Set([...prev, id]))
      setActivityFeed(prev => [{ id, emoji:'😤', mood:'Stressed', area }, ...prev].slice(0, 5))
      setTimeout(() => setNewPinIds(prev => { const n = new Set(prev); n.delete(id); return n }), 1900)
    }
  }

  // Keep secretStressRef current on every render
  secretStressRef.current = handleSecretStressWave

  async function generateJournal(pins) {
    setLoadingJournal(true)
    try {
      const { summary } = await getJournalSummary(pins)
      setJournalSummary(summary)
      localStorage.setItem('moodmap_journal_summary', summary)
    } catch { /* fail silently */ }
    setLoadingJournal(false)
  }

  function handlePinUpdate(pinId, newMood, story) {
    const origPin = pins.find(p => p.id === pinId)
    if (!origPin) return

    setPins(prev => prev.map(p => p.id === pinId ? {
      ...p,
      mood: newMood.label, color: newMood.color, emoji: newMood.emoji,
      hasStory: !!story,
      story: story || null,
      fromMood: p.mood, fromEmoji: p.emoji
    } : p))

    // Pulse on update
    setNewPinIds(prev => new Set([...prev, pinId]))
    setTimeout(() => setNewPinIds(prev => { const n = new Set(prev); n.delete(pinId); return n }), 1900)

    // Update journal entry
    setUserPins(prev => prev.map(p => p.id === pinId
      ? { ...p, mood: newMood.label, color: newMood.color, emoji: newMood.emoji }
      : p))

    // Add to recovery feed
    if (story) {
      const newStory = {
        id: Date.now(),
        fromMood: origPin.mood, fromEmoji: origPin.emoji,
        toMood: newMood.label,  toEmoji: newMood.emoji,
        area: getArea(origPin.lat),
        story, timestamp: Date.now(), hearts: 0
      }
      setRecoveryStories(prev => {
        const updated = [newStory, ...prev].slice(0, 20)
        saveRecoveryStories(updated)
        return updated
      })
    }
    setUpdateTarget(null)
  }

  function handleHeartStory(storyId) {
    setRecoveryStories(prev => {
      const updated = prev.map(s => s.id === storyId ? { ...s, hearts: s.hearts + 1 } : s)
      saveRecoveryStories(updated)
      return updated
    })
  }

  function activateCrisisMode() {
    const ids = new Set(
      pins.filter(p => p.mood === 'Stressed' || p.mood === 'Anxious').map(p => p.id)
    )
    setCrisisPinIds(ids)
    setCrisisMode(true)
  }

  function deactivateCrisisMode() {
    setCrisisMode(false)
    setCrisisPinIds(new Set())
    setResolutionMode(false)
    setResolvedPinIds(new Set())
  }

  async function activateResolutionMode() {
    if (resolutionMode) return
    setResolutionMode(true)
    const shuffled = [...pins.map(p => p.id)].sort(() => Math.random() - 0.5)
    for (const id of shuffled) {
      await new Promise(r => setTimeout(r, 55))
      setResolvedPinIds(prev => new Set([...prev, id]))
    }
  }

  async function handleAnalyse(currentPins) {
    setLoading(true)
    try {
      const result = await getAIInsights(currentPins ?? pins)
      setInsights(result)
      setLastUpdated(Date.now())
    } catch(e) {
      setInsights({
        hotspot: 'Could not reach AI — check your API key in .env',
        dominant: '?',
        alert: e.message,
        vibe: '?'
      })
    }
    setLoading(false)
  }

  async function simulateStressWave() {
    if (waving || loading) return
    setWaving(true)
    setInsights(null)

    const newIds = []
    const addedPins = []

    for (let i = 0; i < WAVE_PINS.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      const id = Date.now() + i
      const pin = {
        id,
        lat: WAVE_PINS[i].lat,
        lng: WAVE_PINS[i].lng,
        mood: 'Stressed',
        color: '#F44336',
        emoji: '😤',
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
      }
      newIds.push(id)
      addedPins.push(pin)
      const area = getArea(WAVE_PINS[i].lat)
      setPins(prev => [...prev, pin])
      setWavePinIds(prev => new Set([...prev, id]))
      setNewPinIds(prev => new Set([...prev, id]))
      setActivityFeed(prev => [{ id, emoji: '😤', mood: 'Stressed', area }, ...prev].slice(0, 5))
      setTimeout(() => setNewPinIds(prev => { const n = new Set(prev); n.delete(id); return n }), 1900)
    }

    setWaving(false)

    // Clear wave pulse animation after 2s then trigger insights
    setTimeout(() => setWavePinIds(new Set()), 2000)
    await handleAnalyse([...SEED_PINS, ...addedPins])
  }

  function handleMapClick(latlng) { setPending(latlng) }

  function handleMoodSelect(mood) {
    if (!pending) return
    const id = Date.now()
    const area = getArea(pending.lat)
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setPins(prev => [...prev, {
      id, lat: pending.lat, lng: pending.lng,
      mood: mood.label, color: mood.color, emoji: mood.emoji,
      time, timestamp: Date.now()
    }])
    setNewPinIds(prev => new Set([...prev, id]))
    setTimeout(() => setNewPinIds(prev => { const n = new Set(prev); n.delete(id); return n }), 1900)
    setActivityFeed(prev => [{ id, emoji: mood.emoji, mood: mood.label, area }, ...prev].slice(0, 5))

    // Journal: bump streak on first pin of the day, then update pins + maybe generate summary
    const journalEntry = { id, time, mood: mood.label, emoji: mood.emoji, color: mood.color, area }
    const newUserPins = [...userPins, journalEntry]
    if (userPins.length === 0) setStreak(bumpStreak())
    setUserPins(newUserPins)
    if (newUserPins.length >= 2) generateJournal(newUserPins)

    setPending(null)
    setCompanion({
      pinId: id, mood: mood.label, color: mood.color,
      extras: {
        timeOfDay: getTimeOfDay(),
        pinNumber: newUserPins.length,
        randomSeed: Math.floor(Math.random() * 1000) + 1
      }
    })
  }

  function handleFeelBetter() {
    if (!companion) return
    // Lighten the pin color to show improvement
    setPins(prev => prev.map(p =>
      p.id === companion.pinId ? { ...p, color: p.color + '99' } : p
    ))
    setCompanion(null)
  }

  const vibeColors = {
    Happy:'#4CAF50', Excited:'#FF9800',
    Anxious:'#9C27B0', Stressed:'#F44336', Sad:'#2196F3'
  }

  // Fast lookup: which pin IDs belong to this user
  const userPinIds = new Set(userPins.map(p => p.id))

  // Map background tint — dominant mood drives subtle color overlay
  const moodTotals = {}
  MOODS.forEach(m => { moodTotals[m.label] = 0 })
  pins.forEach(p => { if (moodTotals[p.mood] !== undefined) moodTotals[p.mood]++ })
  const dominantMood = pins.length
    ? Object.entries(moodTotals).sort((a, b) => b[1] - a[1])[0][0]
    : null
  const mapOverlayColor =
    crisisMode && !resolutionMode ? 'rgba(183,28,28,0.09)' :
    resolutionMode                ? 'rgba(76,175,80,0.07)' :
    dominantMood === 'Stressed'   ? 'rgba(244,67,54,0.05)' :
    dominantMood === 'Happy'      ? 'rgba(76,175,80,0.05)' : 'transparent'

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{
        background:'#1a1a2e', color:'white', padding:'10px 20px',
        display:'flex', alignItems:'center', gap:12, flexShrink:0
      }}>
        <span style={{ fontSize:22 }}>🗺️</span>
        <div>
          <div style={{ fontWeight:700, fontSize:20, letterSpacing:'-0.5px', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>MoodMap</div>
          <div style={{ fontSize:12, opacity:0.6, fontWeight:400, letterSpacing:'0.02em' }}>Anonymous community emotional pulse</div>
        </div>
        <div style={{
          marginLeft:'auto', background:'rgba(255,255,255,0.1)',
          borderRadius:20, padding:'4px 14px', fontSize:13
        }}>
          {pins.length} mood pins live
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Map */}
        <div style={{ flex:1, position:'relative' }}>
          <MapContainer
            ref={mapRef}
            center={GSU_CENTER}
            zoom={16}
            style={{ width:'100%', height:'100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            <PinDropper onDrop={handleMapClick} skipRef={clickedPinRef} />
            {pins.map(pin => {
              const isResolved   = resolvedPinIds.has(pin.id)
              const isSOS        = sosPinIds.has(pin.id)
              const isHappyPlace = !isSOS && happyPlaceIds.has(pin.id)
              const isCrisis     = !isResolved && !isSOS && !isHappyPlace && crisisPinIds.has(pin.id)
              const isWave       = !isResolved && !isSOS && !isHappyPlace && !isCrisis && wavePinIds.has(pin.id)
              const isNew        = !isResolved && !isSOS && !isHappyPlace && !isCrisis && !isWave && newPinIds.has(pin.id)
              const isUserPin    = userPinIds.has(pin.id)
              const hasStory     = !!pin.hasStory
              const hpData       = isHappyPlace ? happyPlaces.find(p => p.id === pin.id) : null
              return (
                <CircleMarker
                  key={pin.id}
                  center={[pin.lat, pin.lng]}
                  radius={isSOS ? 18 : isHappyPlace ? 17 : isWave ? 16 : isCrisis ? 14 : hasStory ? 15 : 13}
                  fillColor={
                    isSOS        ? '#FF0000' :
                    isHappyPlace ? '#FFC107' :
                    isResolved   ? '#81C784' : pin.color
                  }
                  color={
                    isSOS                  ? '#FF0000' :
                    isHappyPlace           ? '#FF8F00' :
                    isResolved             ? '#4CAF50' :
                    (isCrisis || isWave)   ? '#FF0000' :
                    hasStory               ? '#FFD700' : 'white'
                  }
                  weight={isSOS ? 4 : isHappyPlace ? 4 : (isCrisis || isWave) ? 3 : hasStory ? 4 : 2}
                  fillOpacity={isResolved ? 0.65 : 0.9}
                  className={
                    isSOS        ? 'sos-pin'        :
                    isHappyPlace ? 'happy-place-pin' :
                    isResolved   ? 'resolved-pin'   :
                    isCrisis     ? 'crisis-pin'     :
                    isWave       ? 'wave-pin'        :
                    hasStory     ? 'story-pin'      :
                    isNew        ? 'pin-new'        : ''
                  }
                  eventHandlers={isUserPin ? {
                    click: () => {
                      clickedPinRef.current = true
                      setPending(null)
                      setUpdateTarget(pin)
                    }
                  } : {}}
                >
                  {isHappyPlace ? (
                    <Popup>
                      <div style={{ maxWidth:200, fontFamily:'inherit' }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'#d97706', marginBottom:5 }}>
                          ✨ Happy Place — open to visitors
                        </div>
                        <div style={{ fontSize:12, color:'#555', marginBottom:8, lineHeight:1.5 }}>
                          {hpData?.count ?? 1} {(hpData?.count ?? 1) === 1 ? 'person' : 'people'} here, welcoming company
                        </div>
                        <button
                          onClick={() => { clickedPinRef.current = true; handleJoinHappyPlace(pin.id) }}
                          style={{
                            width:'100%', padding:'7px 0',
                            background:'#d97706', color:'white',
                            border:'none', borderRadius:8,
                            fontSize:12, fontWeight:700, cursor:'pointer'
                          }}
                        >
                          Join this vibe 🌟
                        </button>
                      </div>
                    </Popup>
                  ) : !isUserPin && (
                    <Popup>
                      {hasStory ? (
                        <div style={{ maxWidth: 200 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {pin.fromEmoji} {pin.fromMood} → {pin.emoji} {pin.mood}
                          </div>
                          <div style={{ fontSize: 12, fontStyle: 'italic', color: '#555', lineHeight: 1.5 }}>
                            "{pin.story}"
                          </div>
                        </div>
                      ) : (
                        `${pin.emoji} ${pin.mood} — ${pin.time}`
                      )}
                    </Popup>
                  )}
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Subtle background tint overlay based on dominant mood */}
          <div className="map-tint-overlay" style={{ background: mapOverlayColor }} />

          {/* Floating live counter */}
          <div className="live-counter" style={crisisMode && !resolutionMode ? {
            background:'rgba(183,28,28,0.9)', boxShadow:'0 2px 16px rgba(183,28,28,0.5)'
          } : resolutionMode ? {
            background:'rgba(46,125,50,0.88)'
          } : {}}>
            {crisisMode && !resolutionMode
              ? '⚠️ Crisis mode active — monitoring all zones'
              : resolutionMode
              ? '🌿 Resolution in progress…'
              : recentCount === 0
              ? 'No new drops in the last 5 min'
              : `${recentCount} ${recentCount === 1 ? 'person' : 'people'} dropped their mood in the last 5 min`}
          </div>

          {/* Companion panel */}
          {companion && (
            <div style={{
              position:'absolute', top:0, right:0, bottom:0,
              width:320, zIndex:1000, overflowY:'auto'
            }}>
              <CompanionPanel
                mood={companion.mood}
                color={companion.color}
                extras={companion.extras || {}}
                onClose={() => setCompanion(null)}
                onFeelBetter={handleFeelBetter}
                onEmergency={() => {
                  if (companion.pinId) setSosPinIds(prev => new Set([...prev, companion.pinId]))
                  const pin = pins.find(p => p.id === companion.pinId)
                  const area = pin ? getArea(pin.lat) : 'campus'
                  setEmergencyAlert({ area })
                }}
                onSafeConfirmed={() => {
                  if (companion.pinId) setSosPinIds(prev => { const n = new Set(prev); n.delete(companion.pinId); return n })
                  setEmergencyAlert(null)
                }}
                onMakeHappyPlace={() => handleMakeHappyPlace(companion.pinId)}
                happyPlaces={happyPlaces}
                onShowHappyPlace={handleShowHappyPlace}
              />
            </div>
          )}

          {/* Update mood panel — appears when user clicks their own pin */}
          {updateTarget && (
            <div style={{
              position:'absolute', bottom:24, left:'50%',
              transform:'translateX(-50%)', zIndex:1000, width:340
            }}>
              <UpdateMoodPanel
                pin={updateTarget}
                onClose={() => setUpdateTarget(null)}
                onUpdate={handlePinUpdate}
              />
            </div>
          )}

          {/* Mood picker */}
          {pending && (
            <div style={{
              position:'absolute', bottom:30, left:'50%',
              transform:'translateX(-50%)', zIndex:1000,
              background:'white', borderRadius:16, padding:'16px 20px',
              boxShadow:'0 4px 24px rgba(0,0,0,0.18)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:10
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#333' }}>
                How are you feeling here?
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {MOODS.map(mood => (
                  <button key={mood.label} onClick={() => handleMoodSelect(mood)} style={{
                    background: mood.color+'22',
                    border:`2px solid ${mood.color}`,
                    borderRadius:12, padding:'10px 12px',
                    cursor:'pointer', display:'flex',
                    flexDirection:'column', alignItems:'center', gap:4
                  }}>
                    <span style={{ fontSize:22 }}>{mood.emoji}</span>
                    <span style={{ fontSize:11, color:'#444' }}>{mood.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPending(null)}
                style={{ fontSize:12, color:'#999', background:'none', border:'none', cursor:'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          width:300, background:'#f8f9fa',
          borderLeft:'1px solid #e0e0e0',
          display:'flex', flexDirection:'column',
          overflow:'auto', padding:16, gap:16
        }}>

          {/* ── Emergency counselor alert ──────────────────────── */}
          {emergencyAlert && (
            <div className="emergency-counselor-banner">
              <div style={{ fontWeight:800, fontSize:13, letterSpacing:0.3, marginBottom:6, display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:18 }}>🆘</span> POSSIBLE EMERGENCY
              </div>
              <div style={{ fontSize:12, opacity:0.93, lineHeight:1.65, marginBottom:12 }}>
                Student near <strong>{emergencyAlert.area}</strong> may need immediate assistance. Emergency keywords detected in companion chat.
              </div>
              <a
                href="tel:+14044135717"
                style={{
                  display:'block', width:'100%', padding:'10px 0',
                  borderRadius:10, background:'white',
                  color:'#b71c1c', fontWeight:800, fontSize:13,
                  textAlign:'center', textDecoration:'none',
                  boxSizing:'border-box'
                }}
              >
                📞 Alert Campus Police
              </a>
              <button
                onClick={() => setEmergencyAlert(null)}
                style={{
                  marginTop:8, width:'100%', padding:'7px 0',
                  borderRadius:10, border:'1px solid rgba(255,255,255,0.3)',
                  background:'transparent', color:'rgba(255,255,255,0.7)',
                  fontSize:11, cursor:'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'#333' }}>
              Live mood breakdown
            </div>
            <MoodCount pins={pins} />
          </div>

          {/* Live activity feed */}
          <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#4CAF50', display:'inline-block', boxShadow:'0 0 0 2px #4CAF5044' }} />
              Live activity
            </div>
            {activityFeed.length === 0 ? (
              <div style={{ fontSize:12, color:'#bbb', textAlign:'center', padding:'8px 0' }}>
                Drop a mood on the map…
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5, overflow:'hidden' }}>
                {activityFeed.map(entry => (
                  <div key={entry.id} className="activity-entry" style={{
                    fontSize:12, color:'#444', padding:'7px 10px',
                    background:'#f8f9fa', borderRadius:8, lineHeight:1.5
                  }}>
                    {entry.emoji} Someone near <strong>{entry.area}</strong> is feeling {entry.mood}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Happy Places Now ───────────────────────────────── */}
          {happyPlaces.length > 0 && (
            <div style={{ background:'#fffbeb', borderRadius:12, padding:14, border:'1px solid #fde68a' }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'#78350f', display:'flex', alignItems:'center', gap:6 }}>
                <span className="happy-place-sidebar-glow">✨</span> Happy Places Now
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {happyPlaces.map(place => (
                  <div key={place.id} style={{
                    background:'white', borderRadius:10, padding:'10px 12px',
                    border:'1px solid #fde68a', display:'flex',
                    alignItems:'center', justifyContent:'space-between', gap:8
                  }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:2 }}>
                        {place.emoji} near {place.area}
                      </div>
                      <div style={{ fontSize:11, color:'#b45309' }}>
                        {place.count} {place.count === 1 ? 'person' : 'people'} — welcoming company
                      </div>
                    </div>
                    <button
                      onClick={() => handleShowHappyPlace(place)}
                      style={{
                        background:'#d97706', color:'white',
                        border:'none', borderRadius:8,
                        padding:'5px 10px', fontSize:10,
                        fontWeight:700, cursor:'pointer', flexShrink:0
                      }}
                    >
                      Find it
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Campus Crisis Mode ─────────────────────────────── */}
          {crisisMode ? (
            <CrisisPanel
              onDeactivate={deactivateCrisisMode}
              onResolution={activateResolutionMode}
              resolutionActive={resolutionMode}
            />
          ) : (
            <button
              className="crisis-toggle-btn"
              onClick={activateCrisisMode}
              style={{
                background:'linear-gradient(135deg, #7f0000, #b71c1c)',
                color:'white', border:'none', borderRadius:10,
                padding:'13px 0', fontWeight:700, fontSize:13,
                cursor:'pointer', width:'100%',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8
              }}
            >
              <span style={{ fontSize:17 }}>🚨</span>
              Activate Campus Crisis Mode
            </button>
          )}

          <button
            onClick={() => handleAnalyse()}
            disabled={loading || waving}
            style={{
              background: (loading || waving) ? '#ccc' : '#1a1a2e',
              color:'white', border:'none', borderRadius:10,
              padding:'12px 0', fontWeight:600, fontSize:14,
              cursor: (loading || waving) ? 'not-allowed' : 'pointer', width:'100%'
            }}
          >
            {loading ? '🤖 Analysing...' : '✨ Get AI Insights'}
          </button>

          <button
            onClick={simulateStressWave}
            disabled={loading || waving}
            style={{
              background: (loading || waving) ? '#ccc' : '#b71c1c',
              color:'white', border:'none', borderRadius:10,
              padding:'12px 0', fontWeight:600, fontSize:14,
              cursor: (loading || waving) ? 'not-allowed' : 'pointer', width:'100%',
              transition: 'background 0.2s'
            }}
          >
            {waving ? '🌊 Spreading...' : loading ? '🤖 Analysing...' : '🚨 Simulate Stress Wave'}
          </button>

          {lastUpdated && (
            <div style={{ fontSize:11, color:'#888', textAlign:'center' }}>
              Last updated: {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
            </div>
          )}

          {insights && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

              <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
                <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>CAMPUS VIBE RIGHT NOW</div>
                <div style={{
                  fontSize:22, fontWeight:700,
                  color: vibeColors[insights.vibe] || '#333'
                }}>
                  {insights.vibe}
                </div>
              </div>

              <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
                <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>HOTSPOT DETECTED</div>
                <div style={{ fontSize:13, color:'#333', lineHeight:1.5 }}>
                  {insights.hotspot}
                </div>
              </div>

              <CounselorAlert vibe={insights.vibe} hotspot={insights.hotspot} />

            </div>
          )}

          <RecoveryFeed stories={recoveryStories} onHeart={handleHeartStory} />

          <MoodJournal
            userPins={userPins}
            streak={streak}
            journalSummary={journalSummary}
            loadingJournal={loadingJournal}
          />

          <div style={{
            background:'#e8f5e9', borderRadius:12, padding:14,
            fontSize:12, color:'#2e7d32', lineHeight:1.6
          }}>
            <strong>How to use:</strong><br/>
            Click anywhere on the map to drop your mood anonymously. Hit "Get AI Insights" to see what the campus is feeling.
          </div>

        </div>
      </div>

      {/* ── Secret demo controls (Ctrl+Shift+R to show/hide) ─────────────── */}
      {showResetBtn && !showResetConfirm && (
        <button
          className="reset-btn"
          onClick={() => setShowResetConfirm(true)}
        >
          🔄 Reset Demo
        </button>
      )}

      {showResetConfirm && (
        <div className="reset-confirm">
          <div style={{ fontSize:13, color:'#333', lineHeight:1.65, marginBottom:14 }}>
            Reset map to 40 seed pins? This clears all live pins added during demo.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={handleReset}
              style={{
                flex:1, padding:'9px 0', borderRadius:9, border:'none',
                background:'#b71c1c', color:'white',
                fontWeight:700, fontSize:12, cursor:'pointer'
              }}
            >
              Yes, Reset
            </button>
            <button
              onClick={() => { setShowResetConfirm(false); setShowResetBtn(false) }}
              style={{
                flex:1, padding:'9px 0', borderRadius:9,
                border:'1px solid #ddd', background:'white',
                fontSize:12, color:'#888', cursor:'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {resetFlash && <div className="demo-flash">✅ Demo reset!</div>}

      {/* Join Happy Place warm message toast */}
      {joinToast && (
        <div className="join-toast">
          <div style={{ fontSize:16, marginBottom:6 }}>🌟</div>
          <div style={{ fontSize:13, lineHeight:1.7 }}>{joinToast}</div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}
    </div>
  )
}