import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const GROQ_KEY = process.env.GROQ_KEY

app.post('/api/insights', async (req, res) => {
  const { pins } = req.body

  function getBuilding(lat) {
    if (lat >= 33.750 && lat <= 33.752) return 'Library South area'
    if (lat >= 33.748 && lat < 33.750) return 'Student Center area'
    if (lat >= 33.746 && lat < 33.748) return 'Classroom South area'
    return 'Campus area'
  }

  const summary = pins.map(p =>
    `${p.mood} at ${getBuilding(p.lat)}`
  ).join('\n')

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `You are analyzing anonymous mood data dropped on a campus map.
Here are the mood pins:
${summary}

Return a JSON object with exactly this shape:
{
  "hotspot": "one sentence describing the most emotionally intense area",
  "dominant": "the single most common mood word",
  "alert": "one actionable recommendation for campus counselors",
  "vibe": "one word overall campus vibe right now"
}
Only return the JSON. No extra text.`
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error')
    }

    const text = data.choices[0].message.content.trim()
    const clean = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    res.json(JSON.parse(clean))
  } catch (e) {
    console.error('Groq error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

const POSITIVE_MOODS = ['happy', 'excited']

app.post('/api/comfort', async (req, res) => {
  const { mood, timeOfDay = 'morning', pinNumber = 1, randomSeed = 500 } = req.body
  const isPositive = POSITIVE_MOODS.includes(mood.toLowerCase())

  function ordinal(n) { return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th` }

  const moodExtra = {
    Sad: `EXTRA for SAD: include ONE of these (choose by seed ${randomSeed} % 4):
0: Name a famous person who overcame deep sadness and found meaning
1: Suggest one tiny act of kindness they can do for someone else RIGHT NOW (science shows this lifts mood faster than anything)
2: Remind them this feeling is shared by millions of students worldwide — they are never alone in this
3: Suggest texting one specific type of person (an old friend, a sibling, their favourite professor)`,
    Anxious: `EXTRA for ANXIOUS: include ONE grounding technique (choose by seed ${randomSeed} % 3):
0: The 5-4-3-2-1 senses exercise — name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste
1: Reality check — "Will this specific thing matter in 5 years? In 5 weeks? In 5 days?" — walk them through it
2: Body scan — "Unclench your jaw. Drop your shoulders. Unball your fists. You were holding tension you didn't even notice."`,
    Happy: `EXTRA for HAPPY: include ONE of these (choose by seed ${randomSeed} % 3):
0: A unique, slightly surprising way to celebrate or lock in this feeling so it lasts longer
1: Challenge them to do one kind thing with their good energy in the next hour
2: A genuinely interesting science fact about how their happiness is chemically improving the mood of people physically near them`,
    Excited: `EXTRA for EXCITED: same spirit as happy — channel this electric energy into something unforgettable today`
  }

  const checkInNote = pinNumber > 1
    ? `This is their ${ordinal(pinNumber)} mood check-in today — honour their self-awareness, acknowledge their courage for returning.`
    : `This is their first check-in today.`

  const timeNote = {
    morning: 'It\'s morning — reference the fresh start, the day still being full of possibility.',
    afternoon: 'It\'s afternoon — reference the momentum of the day, the home stretch ahead.',
    evening: 'It\'s evening — reference winding down, reflecting on the day, self-care before rest.',
    night: 'It\'s late at night — reference rest, that tomorrow is a clean slate, the importance of sleep for resilience.'
  }[timeOfDay] || ''

  const rotatingElement = `Include exactly ONE of these elements (choose by seed ${randomSeed} % 6 — vary it every time):
0: A specific music suggestion with genre + exact vibe + WHY it helps right now (e.g. "Put on Lofi Girl radio — the 60-70 BPM beats are scientifically proven to sync with a calm heart rate")
1: A micro-challenge to do in the next 2 minutes (walk to nearest window, text one person, step outside and feel the air)
2: A funny but genuinely kind observation about student life that makes them feel less alone
3: A 60-second grounding or breathing exercise WITH full instructions (not just "take a deep breath")
4: A reminder about a universal student struggle — something specific they are definitely not the only one going through
5: A genuine, specific compliment about the courage it takes to check in on your own mental health`

  const prompt = isPositive
    ? `A college student is feeling ${mood} at ${timeOfDay}. ${checkInNote} ${timeNote} Variety seed: ${randomSeed}.

Generate a COMPLETELY UNIQUE warm message — no two should ever sound alike. Sound like a different caring friend each time.
NEVER use: "I understand", "That must be", "I hear you", "It's okay to", or any therapy-speak clichés.

${moodExtra[mood] || ''}
${rotatingElement}

Return ONLY this JSON (no extra text):
{
  "message": "unique warm 2-3 sentence opening celebrating their positive energy — reference time of day and check-in number naturally",
  "action": "one specific joyful thing to do RIGHT NOW — not generic",
  "joke": "a playful, kind observation or fun challenge",
  "reminder": "a unique positive reminder that feels personal, not motivational-poster",
  "musicVibes": "specific artist/genre/playlist with one sentence on why it fits this exact moment",
  "recoveryPrompt": "a fun reflection question to savour or extend this good feeling"
}`
    : `A college student is feeling ${mood} at ${timeOfDay}. ${checkInNote} ${timeNote} Variety seed: ${randomSeed}.

Generate a COMPLETELY UNIQUE warm message — no two should ever sound alike. Sound like a completely different caring friend each time.
NEVER use: "I understand", "That must be hard", "I hear you", "It's okay to", or any therapy-speak clichés.
Each message must feel like it came from a genuinely different personality — sometimes wry, sometimes tender, sometimes gently funny.

${moodExtra[mood] || ''}
${rotatingElement}

Return ONLY this JSON (no extra text):
{
  "message": "unique warm 2-3 sentences — zero clichés, genuine empathy, reference time of day naturally",
  "action": "one specific tiny thing to do RIGHT NOW — concrete and immediate, not 'take a deep breath'",
  "joke": "a light observation that doesn't dismiss their feeling — gently human",
  "reminder": "a unique reminder of their strength — specific, not a generic poster quote",
  "musicVibes": "specific artist/genre/song vibe with a sentence on why it helps right now",
  "recoveryPrompt": "a gentle reflection question to understand what they need or what would help"
}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq error')
    const text = data.choices[0].message.content.trim()
    const clean = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    res.json(JSON.parse(clean))
  } catch (e) {
    console.error('Comfort error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/chat', async (req, res) => {
  const { mood, message } = req.body

  const prompt = `You are a warm, supportive best friend chatting with a student who is feeling ${mood}.
They just said: "${message}"
Reply as their best friend would — with empathy, maybe a little humour, always kind.
Keep it to 2-4 sentences. No bullet points. No clinical language. Just real, warm conversation.
Do not introduce yourself. Just respond naturally.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq error')
    res.json({ reply: data.choices[0].message.content.trim() })
  } catch (e) {
    console.error('Chat error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/journal', async (req, res) => {
  const { entries } = req.body  // [{ time, mood, area }]
  const timeline = entries.map(e => `${e.time} — ${e.mood} near ${e.area}`).join('\n')

  const prompt = `A student tracked their moods throughout today on a campus app:
${timeline}

Write a warm, personal 2–3 sentence reflection on their emotional journey today.
Sound like a caring friend who noticed their patterns — not a therapist or chatbot.
Celebrate resilience, acknowledge hard moments, and end with genuine encouragement.
Return only the reflection text. No quotes, no labels, no extra formatting.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 150, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Groq error')
    res.json({ summary: data.choices[0].message.content.trim() })
  } catch (e) {
    console.error('Journal error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.listen(3001, () => console.log('Server running on http://localhost:3001'))