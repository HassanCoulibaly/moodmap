import {
  requireEnv, setCors, setSecurityHeaders, checkRateLimit,
  validatePins, callGroq, getBuilding, safeError
} from '../lib/groq.js'

requireEnv()

export default async function handler(req, res) {
  setSecurityHeaders(res)
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkRateLimit(req)) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })

  try {
    const pins = validatePins(req.body?.pins)
    if (!pins) return res.status(400).json({ error: 'Invalid or empty pins array' })

    const recoveryStories = Array.isArray(req.body?.recoveryStories)
      ? req.body.recoveryStories.slice(0, 5)
      : []

    const locationStats = {}
    const moodTotals = {}

    for (const pin of pins) {
      const area = getBuilding(pin.lat)
      if (!locationStats[area]) locationStats[area] = {}
      locationStats[area][pin.mood] = (locationStats[area][pin.mood] || 0) + 1
      moodTotals[pin.mood] = (moodTotals[pin.mood] || 0) + 1
    }

    const topLocations = Object.entries(locationStats)
      .map(([area, moods]) => ({
        area,
        total: Object.values(moods).reduce((a, b) => a + b, 0),
        dominant: Object.entries(moods).sort((a, b) => b[1] - a[1])[0][0],
        moods,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)

    const overallDominant = Object.entries(moodTotals)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Stressed'

    const moodBreakdown = Object.entries(moodTotals)
      .map(([mood, count]) => ({ mood, count, pct: Math.round((count / pins.length) * 100) }))
      .sort((a, b) => b.count - a.count)

    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    let aiHeadline = `${dayName.toUpperCase()} VIBE CHECK`
    let aiTagline = 'the campus never lies.'
    try {
      const prompt = `You're a TikTok narrator. In exactly 2 lines, describe this campus vibe:
${pins.length} students dropped moods. Dominant: ${overallDominant}. Top spot: ${topLocations[0]?.area} (${topLocations[0]?.total} pins).
Line 1: A bold 3-5 word ALL CAPS headline (no emoji, no quotes)
Line 2: A 5-8 word lowercase tagline that sounds dramatic or poetic (no emoji, no quotes)
Return ONLY the 2 lines. Nothing else.`
      const text = await callGroq({ systemPrompt: 'You output only raw text, no markdown, no quotes, no emoji.', userPrompt: prompt, maxTokens: 80 })
      const lines = text.replace(/\*\*/g, '').replace(/"/g, '').trim().split('\n').filter(l => l.trim())
      if (lines[0]) aiHeadline = lines[0].trim().toUpperCase()
      if (lines[1]) aiTagline = lines[1].trim().toLowerCase()
    } catch { /* use defaults */ }

    const storyHighlights = recoveryStories.slice(0, 3).map(s => ({
      from: s.fromMood || 'Stressed',
      to: s.toMood || 'Happy',
      area: s.area || 'Campus',
      story: typeof s.story === 'string' ? s.story.slice(0, 80) : '',
    }))

    res.json({
      data: {
        totalPins: pins.length,
        dominantMood: overallDominant,
        day: dayName,
        time: timeStr,
        aiHeadline,
        aiTagline,
        topLocations,
        moodBreakdown,
        storyHighlights,
      }
    })
  } catch (e) {
    safeError(res, e, 'ReelScript')
  }
}
