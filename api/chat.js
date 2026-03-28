import {
  requireEnv, setCors, setSecurityHeaders, checkRateLimit,
  validateMood, validateMessage, callGroq, safeError
} from '../lib/groq.js'

requireEnv()

export default async function handler(req, res) {
  setSecurityHeaders(res)
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkRateLimit(req)) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })

  try {
    const mood = validateMood(req.body?.mood)
    const message = validateMessage(req.body?.message)
    if (!mood || !message) return res.status(400).json({ error: 'Invalid mood or message' })

    const reply = await callGroq({
      systemPrompt: `You are a warm, supportive best friend chatting with a student who is feeling ${mood}.
Reply with empathy, maybe a little humour, always kind.
Keep it to 2-4 sentences. No bullet points. No clinical language. Just real, warm conversation.
Do not introduce yourself. Just respond naturally.`,
      userPrompt: message,
      maxTokens: 200
    })

    res.json({ reply })
  } catch (e) {
    safeError(res, e, 'Chat')
  }
}
