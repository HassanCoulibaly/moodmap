import {
  requireEnv, setCors, setSecurityHeaders, checkRateLimit,
  validateEntries, callGroq, safeError
} from '../lib/groq.js'

requireEnv()

export default async function handler(req, res) {
  setSecurityHeaders(res)
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkRateLimit(req)) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })

  try {
    const entries = validateEntries(req.body?.entries)
    if (!entries) return res.status(400).json({ error: 'Invalid or empty entries array' })

    const timeline = entries.map(e => `${e.time} — ${e.mood} near ${e.area}`).join('\n')

    const reply = await callGroq({
      systemPrompt: `Write a warm, personal 2-3 sentence reflection on a student's emotional journey today.
Sound like a caring friend who noticed their patterns — not a therapist or chatbot.
Celebrate resilience, acknowledge hard moments, and end with genuine encouragement.
Return only the reflection text. No quotes, no labels, no extra formatting.`,
      userPrompt: `A student tracked their moods throughout today on a campus app:\n${timeline}`,
      maxTokens: 150
    })

    res.json({ summary: reply })
  } catch (e) {
    safeError(res, e, 'Journal')
  }
}
