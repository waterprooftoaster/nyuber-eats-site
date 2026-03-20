import 'server-only'

import { getTwilio } from './client'

const rateMap = new Map<string, number>()
const RATE_LIMIT_MS = 60_000
const MAX_ENTRIES = 10_000

export async function sendSMS(
  to: string,
  body: string,
  dedupeKey?: string
): Promise<{ sent: boolean; sid?: string }> {
  const key = dedupeKey ? `${to}:${dedupeKey}` : null

  if (key) {
    const lastSent = rateMap.get(key)
    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
      return { sent: false }
    }
  }

  // Sweep if map grows too large
  if (rateMap.size > MAX_ENTRIES) {
    const now = Date.now()
    for (const [k, v] of rateMap) {
      if (now - v > RATE_LIMIT_MS) rateMap.delete(k)
    }
  }

  try {
    const message = await getTwilio().messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    })

    if (key) rateMap.set(key, Date.now())
    return { sent: true, sid: message.sid }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return { sent: false }
  }
}
