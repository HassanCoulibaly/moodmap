import { requireEnv, setCors, validatePins, callGroq, parseLLMJson, getBuilding, safeError } from '../lib/groq.js'

requireEnv()

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const pins = validatePins(req.body?.pins)
    if (!pins) return res.status(400).json({ error: 'Invalid or empty pins array' })

    const summary = pins.map(p => `${p.mood} at ${getBuilding(p.lat)}`).join('\n')

    const text = await callGroq({
      systemPrompt: `You are analyzing anonymous mood data dropped on a campus map.
Return a JSON object with exactly this shape:
{
  "hotspot": "one sentence describing the most emotionally intense area",
  "dominant": "the single most common mood word",
  "alert": "one actionable recommendation for campus counselors",
  "vibe": "one word overall campus vibe right now"
}
Only return the JSON. No extra text.`,
      userPrompt: `Here are the mood pins:\n${summary}`,
      maxTokens: 400
    })

    res.json(parseLLMJson(text))
  } catch (e) {
    safeError(res, e, 'Insights')
  }
}
