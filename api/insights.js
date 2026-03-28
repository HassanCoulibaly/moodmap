const GROQ_KEY = process.env.GROQ_KEY

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function groq(prompt, maxTokens) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices[0].message.content.trim()
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { pins } = req.body

    function getBuilding(lat) {
      if (lat >= 33.750 && lat <= 33.752) return 'Library South area'
      if (lat >= 33.748 && lat < 33.750) return 'Student Center area'
      if (lat >= 33.746 && lat < 33.748) return 'Classroom South area'
      return 'Campus area'
    }

    const summary = pins.map(p => `${p.mood} at ${getBuilding(p.lat)}`).join('\n')

    const text = await groq(
      `You are analyzing anonymous mood data dropped on a campus map.
Here are the mood pins:
${summary}

Return a JSON object with exactly this shape:
{
  "hotspot": "one sentence describing the most emotionally intense area",
  "dominant": "the single most common mood word",
  "alert": "one actionable recommendation for campus counselors",
  "vibe": "one word overall campus vibe right now"
}
Only return the JSON. No extra text.`,
      400
    )

    const clean = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    res.json(JSON.parse(clean))
  } catch (e) {
    console.error('Insights error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
