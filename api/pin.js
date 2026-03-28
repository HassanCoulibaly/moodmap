import {
  setCors, setSecurityHeaders, checkRateLimit, getDeviceId, safeError
} from '../lib/groq.js'
import {
  canDeviceDropPin, createPin, updatePin, deletePin
} from '../lib/pinStore.js'

export default function handler(req, res) {
  setSecurityHeaders(res)
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkRateLimit(req)) return res.status(429).json({ error: 'Too many requests.' })

  try {
    const deviceId = getDeviceId(req)
    if (!deviceId) return res.status(400).json({ error: 'Missing or invalid device ID' })

    const { action, pin, pinId, updates } = req.body

    if (action === 'create') {
      if (!canDeviceDropPin(deviceId)) {
        return res.status(429).json({ error: 'Please wait before dropping another pin' })
      }
      if (!pin || typeof pin !== 'object') return res.status(400).json({ error: 'Invalid pin data' })
      return res.json({ pin: createPin(deviceId, pin) })
    }

    if (action === 'update') {
      if (!pinId) return res.status(400).json({ error: 'Missing pinId' })
      const result = updatePin(deviceId, pinId, updates || {})
      if (result.error) return res.status(result.status).json({ error: result.error })
      return res.json(result)
    }

    if (action === 'delete') {
      if (!pinId) return res.status(400).json({ error: 'Missing pinId' })
      const result = deletePin(deviceId, pinId)
      if (result.error) return res.status(result.status).json({ error: result.error })
      return res.json(result)
    }

    res.status(400).json({ error: 'Invalid action' })
  } catch (e) {
    safeError(res, e, 'Pin')
  }
}
