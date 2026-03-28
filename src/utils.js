export function getTimeOfDay() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
}

export function getArea(lat) {
  if (lat >= 33.750 && lat <= 33.752) return 'GSU Library'
  if (lat >= 33.748 && lat < 33.750) return 'Student Center'
  if (lat >= 33.746 && lat < 33.748) return 'Classroom South'
  return 'Five Points'
}

const L1_WORDS = [
  'scared', 'worried', 'nervous', 'anxious', 'afraid',
  'uncomfortable', 'unsafe feeling', 'uneasy', 'freaked out',
]
const L2_WORDS = [
  'following me', 'someone is watching', 'feel threatened', 'this person',
  'he wont leave', "he won't leave", 'im being', "i'm being",
  'being watched', 'someone following', 'wont leave me alone',
  "won't leave me alone", 'making me uncomfortable', 'keeps following',
]
const L3_WORDS = [
  'help me', 'attack', 'attacked', 'he hit', 'she hit', 'im being attacked',
  "i'm being attacked", 'call police', 'call 911', 'emergency', '911',
  'weapon', 'knife', 'gun', 'bleeding', 'i cant get away', "i can't get away",
  'he wont let me leave', "he won't let me leave", 'going to hurt',
  'going to kill', 'rape', 'kidnap', 'chasing me', 'please help',
  'cant breathe', "can't breathe",
]

export function detectLevel(text) {
  const lower = text.toLowerCase().trim()
  if (L3_WORDS.some(kw => lower.includes(kw))) return 3
  if (L2_WORDS.some(kw => lower.includes(kw))) return 2
  if (L1_WORDS.some(kw => lower.includes(kw))) return 1
  return 0
}
