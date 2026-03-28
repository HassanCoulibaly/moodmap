import {
  setCors, setSecurityHeaders, checkRateLimit, getDeviceId, safeError
} from '../lib/groq.js'
import { addSupport } from '../lib/pinStore.js'

export default function handler(req, res) {
  setSecurityHeaders(res)
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkRateLimit(req)) return res.status(429).json({ error: 'Too many requests.' })

  try {
    const deviceId = getDeviceId(req)
    if (!deviceId) return res.status(400).json({ error: 'Missing or invalid device ID' })

    const { pinId, type } = req.body
    if (!pinId) return res.status(400).json({ error: 'Missing pinId' })
    if (type && !['hug', 'metoo'].includes(type)) return res.status(400).json({ error: 'Invalid type' })

    const result = addSupport(deviceId, pinId, type || 'hug')
    if (result.error) return res.status(result.status).json({ error: result.error })
    res.json(result)
  } catch (e) {
    safeError(res, e, 'Support')
  }
}
