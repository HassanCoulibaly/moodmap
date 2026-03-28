// ─── localStorage helpers ─────────────────────────────────────────────────────

export function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export function initJournalPins() {
  const today = getTodayStr()
  if (localStorage.getItem('moodmap_journal_date') !== today) {
    localStorage.setItem('moodmap_journal_date', today)
    localStorage.setItem('moodmap_journal_pins', '[]')
    localStorage.removeItem('moodmap_journal_summary')
    return []
  }
  try { return JSON.parse(localStorage.getItem('moodmap_journal_pins') || '[]') }
  catch { return [] }
}

export function initStreak() {
  return {
    count: parseInt(localStorage.getItem('moodmap_streak_count') || '0'),
    last:  localStorage.getItem('moodmap_streak_last') || ''
  }
}

export function bumpStreak() {
  const today = getTodayStr()
  const { count, last } = initStreak()
  if (last === today) return { count, last }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const newCount = last === yStr ? count + 1 : 1
  localStorage.setItem('moodmap_streak_count', String(newCount))
  localStorage.setItem('moodmap_streak_last', today)
  return { count: newCount, last: today }
}

export function loadRecoveryStories() {
  try { return JSON.parse(localStorage.getItem('moodmap_recovery_stories') || '[]') }
  catch { return [] }
}

export function saveRecoveryStories(s) {
  localStorage.setItem('moodmap_recovery_stories', JSON.stringify(s))
}
