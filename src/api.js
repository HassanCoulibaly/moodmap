// In production (Vercel) the API functions are same-origin at /api/*
// In development the Express server runs on localhost:3001
const BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'

export async function getAIInsights(pins) {
  if (pins.length === 0) return null
  const response = await fetch(`${BASE}/api/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pins })
  })
  if (!response.ok) throw new Error('Server error')
  return await response.json()
}

export async function getAIComfort(mood, extras = {}) {
  const response = await fetch(`${BASE}/api/comfort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, ...extras })
  })
  if (!response.ok) throw new Error('Server error')
  return await response.json()
}

export async function getAIChat(mood, message) {
  const response = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, message })
  })
  if (!response.ok) throw new Error('Server error')
  return await response.json()
}

export async function getJournalSummary(entries) {
  const response = await fetch(`${BASE}/api/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries })
  })
  if (!response.ok) throw new Error('Server error')
  return await response.json()
}
