const GROQ_KEY = process.env.GROQ_KEY

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { entries } = req.body
    const timeline = entries.map(e => `${e.time} — ${e.mood} near ${e.area}`).join('\n')

    const prompt = `A student tracked their moods throughout today on a campus app:
${timeline}

Write a warm, personal 2–3 sentence reflection on their emotional journey today.
Sound like a caring friend who noticed their patterns — not a therapist or chatbot.
Celebrate resilience, acknowledge hard moments, and end with genuine encouragement.
Return only the reflection text. No quotes, no labels, no extra formatting.`

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error?.message || 'Groq error')
    res.json({ summary: data.choices[0].message.content.trim() })
  } catch (e) {
    console.error('Journal error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
