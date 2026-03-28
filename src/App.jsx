import { useState, useEffect, useRef } from 'react'
import './App.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getAIInsights, getJournalSummary } from './api'

// ── Shared modules ──────────────────────────────────────────────────────────
import {
  MOODS, GSU_CENTER, SEED_PINS, WAVE_PINS, SECRET_STRESS_PINS,
} from './constants'
import { getTimeOfDay, getArea } from './utils'
import {
  initJournalPins, initStreak, bumpStreak,
  loadRecoveryStories, saveRecoveryStories,
} from './storage'

// ── Extracted components ────────────────────────────────────────────────────
import PinDropper from './components/PinDropper'
import MoodCount from './components/MoodCount'
import CompanionPanel from './components/CompanionPanel'
import CounselorAlert from './components/CounselorAlert'
import UpdateMoodPanel from './components/UpdateMoodPanel'
import RecoveryFeed from './components/RecoveryFeed'
import CrisisPanel from './components/CrisisPanel'
import MoodJournal from './components/MoodJournal'

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [pins, setPins] = useState(SEED_PINS)
  const [pending, setPending] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [wavePinIds, setWavePinIds] = useState(new Set())
  const [newPinIds, setNewPinIds] = useState(new Set())
  const [waving, setWaving] = useState(false)
  const [companion, setCompanion] = useState(null)
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
  const [emergencyAlert, setEmergencyAlert] = useState(null)
  const [happyPlaces, setHappyPlaces] = useState([])
  const [happyPlaceIds, setHappyPlaceIds] = useState(new Set())
  const [joinToast, setJoinToast] = useState(null)
  const timerRef = useRef(null)
  const mapRef = useRef(null)
  const recentTimerRef = useRef(null)
  const clickedPinRef = useRef(false)
  const secretStressRef = useRef(null)

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!lastUpdated) return
    setSecondsAgo(0)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [lastUpdated])

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

  useEffect(() => {
    localStorage.setItem('moodmap_journal_pins', JSON.stringify(userPins))
  }, [userPins])

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

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  secretStressRef.current = handleSecretStressWave

  async function generateJournal(journalPins) {
    setLoadingJournal(true)
    try {
      const { summary } = await getJournalSummary(journalPins)
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

    setNewPinIds(prev => new Set([...prev, pinId]))
    setTimeout(() => setNewPinIds(prev => { const n = new Set(prev); n.delete(pinId); return n }), 1900)

    setUserPins(prev => prev.map(p => p.id === pinId
      ? { ...p, mood: newMood.label, color: newMood.color, emoji: newMood.emoji }
      : p))

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
    setPins(prev => prev.map(p =>
      p.id === companion.pinId ? { ...p, color: p.color + '99' } : p
    ))
    setCompanion(null)
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const vibeColors = {
    Happy:'#4CAF50', Excited:'#FF9800',
    Anxious:'#9C27B0', Stressed:'#F44336', Sad:'#2196F3'
  }

  const userPinIds = new Set(userPins.map(p => p.id))

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <header className="app-header" style={{
        background:'#1a1a2e', color:'white', padding:'10px 20px',
        display:'flex', alignItems:'center', gap:12, flexShrink:0
      }}>
        <span style={{ fontSize:22 }} role="img" aria-label="Map">🗺️</span>
        <div>
          <div className="app-header-title" style={{ fontWeight:700, fontSize:20, letterSpacing:'-0.5px', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>MoodMap</div>
          <div className="app-header-sub" style={{ fontSize:12, opacity:0.6, fontWeight:400, letterSpacing:'0.02em' }}>Anonymous community emotional pulse</div>
        </div>
        <div className="app-header-badge" style={{
          marginLeft:'auto', background:'rgba(255,255,255,0.1)',
          borderRadius:20, padding:'4px 14px', fontSize:13
        }} aria-live="polite">
          {pins.length} mood pins live
        </div>
      </header>

      <div className="app-layout" style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── Map ──────────────────────────────────────────────────────── */}
        <div className="app-map-area" style={{ flex:1, position:'relative' }}>
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
            <div className="companion-panel-wrapper" style={{
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

          {/* Update mood panel */}
          {updateTarget && (
            <div className="update-panel-wrapper" style={{
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
            <div className="mood-picker" style={{
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
                  <button key={mood.label} className="mood-picker-btn" onClick={() => handleMoodSelect(mood)}
                    aria-label={`Select ${mood.label} mood`}
                    style={{
                      background: mood.color+'22',
                      border:`2px solid ${mood.color}`,
                      borderRadius:12, padding:'10px 12px',
                      cursor:'pointer', display:'flex',
                      flexDirection:'column', alignItems:'center', gap:4,
                      minHeight:44
                    }}>
                    <span style={{ fontSize:22 }} role="img" aria-hidden="true">{mood.emoji}</span>
                    <span style={{ fontSize:11, color:'#444' }}>{mood.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPending(null)}
                aria-label="Cancel mood selection"
                style={{ fontSize:12, color:'#636363', background:'none', border:'none', cursor:'pointer', minHeight:44, padding:'8px 16px' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="app-sidebar" style={{
          width:300, background:'#f8f9fa',
          borderLeft:'1px solid #e0e0e0',
          display:'flex', flexDirection:'column',
          overflow:'auto', padding:16, gap:16
        }}>

          {/* Emergency counselor alert */}
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
                aria-label="Dismiss emergency alert"
                style={{
                  marginTop:8, width:'100%', padding:'7px 0',
                  borderRadius:10, border:'1px solid rgba(255,255,255,0.3)',
                  background:'transparent', color:'rgba(255,255,255,0.7)',
                  fontSize:11, cursor:'pointer', minHeight:44
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
              <div style={{ fontSize:12, color:'#767676', textAlign:'center', padding:'8px 0' }}>
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

          {/* Happy Places Now */}
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

          {/* Campus Crisis Mode */}
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
              aria-label="Activate campus crisis mode"
              style={{
                background:'linear-gradient(135deg, #7f0000, #b71c1c)',
                color:'white', border:'none', borderRadius:10,
                padding:'13px 0', fontWeight:700, fontSize:13,
                cursor:'pointer', width:'100%',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                minHeight:44
              }}
            >
              <span style={{ fontSize:17 }}>🚨</span>
              Activate Campus Crisis Mode
            </button>
          )}

          <button
            onClick={() => handleAnalyse()}
            disabled={loading || waving}
            aria-label="Get AI insights on campus mood"
            style={{
              background: (loading || waving) ? '#ccc' : '#1a1a2e',
              color:'white', border:'none', borderRadius:10,
              padding:'12px 0', fontWeight:600, fontSize:14,
              cursor: (loading || waving) ? 'not-allowed' : 'pointer', width:'100%',
              minHeight:44
            }}
          >
            {loading ? '🤖 Analysing...' : '✨ Get AI Insights'}
          </button>

          <button
            onClick={simulateStressWave}
            disabled={loading || waving}
            aria-label="Simulate a stress wave on the map"
            style={{
              background: (loading || waving) ? '#ccc' : '#b71c1c',
              color:'white', border:'none', borderRadius:10,
              padding:'12px 0', fontWeight:600, fontSize:14,
              cursor: (loading || waving) ? 'not-allowed' : 'pointer', width:'100%',
              transition: 'background 0.2s',
              minHeight:44
            }}
          >
            {waving ? '🌊 Spreading...' : loading ? '🤖 Analysing...' : '🚨 Simulate Stress Wave'}
          </button>

          {lastUpdated && (
            <div style={{ fontSize:11, color:'#636363', textAlign:'center' }}>
              Last updated: {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
            </div>
          )}

          {insights && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
                <div style={{ fontSize:11, color:'#636363', marginBottom:4 }}>CAMPUS VIBE RIGHT NOW</div>
                <div style={{
                  fontSize:22, fontWeight:700,
                  color: vibeColors[insights.vibe] || '#333'
                }}>
                  {insights.vibe}
                </div>
              </div>

              <div style={{ background:'white', borderRadius:12, padding:14, border:'1px solid #eee' }}>
                <div style={{ fontSize:11, color:'#636363', marginBottom:6 }}>HOTSPOT DETECTED</div>
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

        </aside>
      </div>

      {/* ── Secret demo controls (Ctrl+Shift+R to show/hide) ─────────────── */}
      {showResetBtn && !showResetConfirm && (
        <button
          className="reset-btn"
          onClick={() => setShowResetConfirm(true)}
          aria-label="Reset demo"
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
              aria-label="Confirm reset"
              style={{
                flex:1, padding:'9px 0', borderRadius:9, border:'none',
                background:'#b71c1c', color:'white',
                fontWeight:700, fontSize:12, cursor:'pointer', minHeight:44
              }}
            >
              Yes, Reset
            </button>
            <button
              onClick={() => { setShowResetConfirm(false); setShowResetBtn(false) }}
              aria-label="Cancel reset"
              style={{
                flex:1, padding:'9px 0', borderRadius:9,
                border:'1px solid #ddd', background:'white',
                fontSize:12, color:'#636363', cursor:'pointer', minHeight:44
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
    </div>
  )
}
