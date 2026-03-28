// Shared Groq client, CORS, validation, and prompt helpers
// Used by both server.js (dev) and api/*.js (Vercel)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
const VALID_MOODS = ['happy', 'excited', 'anxious', 'stressed', 'sad']
const POSITIVE_MOODS = ['happy', 'excited']
const TIMEOUT_MS = 15_000

// ─── Environment check ───────────────────────────────────────────────────────

export function requireEnv() {
  if (!process.env.GROQ_KEY) {
    throw new Error('GROQ_KEY environment variable is not set')
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

export function setCors(req, res) {
  const origin = req.headers?.origin || req.headers?.Origin || ''
  // In dev (no ALLOWED_ORIGINS set), allow localhost. In prod, check allowlist.
  const allowed = ALLOWED_ORIGINS.length === 0
    ? origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
    : ALLOWED_ORIGINS.includes(origin)

  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// ─── Input validation ─────────────────────────────────────────────────────────

function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return ''
  // Strip control characters except newline/tab, then truncate
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLen)
}

export function validateMood(mood) {
  if (typeof mood !== 'string') return null
  const clean = mood.trim()
  // Case-insensitive match, return canonical capitalized form
  const lower = clean.toLowerCase()
  if (!VALID_MOODS.includes(lower)) return null
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function validatePins(pins, maxItems = 100) {
  if (!Array.isArray(pins)) return null
  const valid = []
  for (const p of pins.slice(0, maxItems)) {
    if (typeof p !== 'object' || p === null) continue
    const lat = Number(p.lat)
    const lng = Number(p.lng)
    const mood = sanitize(String(p.mood || ''), 50)
    if (!isFinite(lat) || !isFinite(lng) || !mood) continue
    valid.push({ lat, lng, mood })
  }
  return valid.length > 0 ? valid : null
}

export function validateEntries(entries, maxItems = 100) {
  if (!Array.isArray(entries)) return null
  const valid = []
  for (const e of entries.slice(0, maxItems)) {
    if (typeof e !== 'object' || e === null) continue
    const time = sanitize(String(e.time || ''), 50)
    const mood = sanitize(String(e.mood || ''), 50)
    const area = sanitize(String(e.area || ''), 100)
    if (!time || !mood || !area) continue
    valid.push({ time, mood, area })
  }
  return valid.length > 0 ? valid : null
}

export function validateMessage(message) {
  if (typeof message !== 'string') return null
  const clean = sanitize(message, 1000)
  return clean.length > 0 ? clean : null
}

export function isPositiveMood(mood) {
  return POSITIVE_MOODS.includes(mood.toLowerCase())
}

// ─── Groq API client ──────────────────────────────────────────────────────────

export async function callGroq({ systemPrompt, userPrompt, maxTokens = 400 }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      // Don't leak Groq error details
      const status = response.status
      console.error(`Groq API returned ${status}`)
      throw new Error(`AI service error (${status})`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('Empty AI response')
    return text
  } finally {
    clearTimeout(timer)
  }
}

// ─── JSON parsing from LLM output ────────────────────────────────────────────

export function parseLLMJson(text) {
  // Strip markdown fences
  let clean = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
  // Try to extract JSON object if there's surrounding text
  const match = clean.match(/\{[\s\S]*\}/)
  if (match) clean = match[0]
  return JSON.parse(clean)
}

// ─── Building lookup (shared between insights routes) ─────────────────────────

export function getBuilding(lat) {
  if (lat >= 33.750 && lat <= 33.752) return 'Library South area'
  if (lat >= 33.748 && lat < 33.750) return 'Student Center area'
  if (lat >= 33.746 && lat < 33.748) return 'Classroom South area'
  return 'Campus area'
}

// ─── Safe error response ──────────────────────────────────────────────────────

export function safeError(res, e, context = 'API') {
  console.error(`${context} error:`, e.message)
  const status = e.message?.includes('AI service error') ? 502 : 500
  res.status(status).json({ error: 'Something went wrong. Please try again.' })
}
