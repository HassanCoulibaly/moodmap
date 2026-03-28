const pins = new Map()
const supportLog = new Map()

const DEVICE_PIN_COOLDOWN_MS = 60_000

const deviceLastPin = new Map()

export function canDeviceDropPin(deviceId) {
  const last = deviceLastPin.get(deviceId)
  if (!last) return true
  return Date.now() - last >= DEVICE_PIN_COOLDOWN_MS
}

export function createPin(deviceId, pin) {
  const id = pin.id || Date.now()
  const stored = { ...pin, id, deviceId, supportCount: 0, createdAt: Date.now() }
  pins.set(id, stored)
  deviceLastPin.set(deviceId, Date.now())
  return stored
}

export function getPin(id) {
  return pins.get(id) || null
}

export function updatePin(deviceId, pinId, updates) {
  const pin = pins.get(pinId)
  if (!pin) return { error: 'Pin not found', status: 404 }
  if (pin.deviceId !== deviceId) return { error: 'Not your pin', status: 403 }
  const updated = { ...pin, ...updates, id: pin.id, deviceId: pin.deviceId }
  pins.set(pinId, updated)
  return { pin: updated }
}

export function deletePin(deviceId, pinId) {
  const pin = pins.get(pinId)
  if (!pin) return { error: 'Pin not found', status: 404 }
  if (pin.deviceId !== deviceId) return { error: 'Not your pin', status: 403 }
  pins.delete(pinId)
  return { ok: true }
}

export function addSupport(deviceId, pinId, type) {
  const pin = pins.get(pinId)
  if (!pin) return { error: 'Pin not found', status: 404 }

  const key = `${deviceId}:${pinId}`
  if (supportLog.has(key)) return { error: 'Already supported', status: 409 }

  supportLog.set(key, { type, at: Date.now() })
  pin.supportCount = (pin.supportCount || 0) + 1
  pins.set(pinId, pin)

  return { supportCount: pin.supportCount }
}
