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
    const { mood, message } = req.body

    const prompt = `You are a warm, supportive best friend chatting with a student who is feeling ${mood}.
They just said: "${message}"
Reply as their best friend would — with empathy, maybe a little humour, always kind.
Keep it to 2-4 sentences. No bullet points. No clinical language. Just real, warm conversation.
Do not introduce yourself. Just respond naturally.`

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error?.message || 'Groq error')
    res.json({ reply: data.choices[0].message.content.trim() })
  } catch (e) {
    console.error('Chat error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
