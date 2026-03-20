import 'server-only'

import Twilio from 'twilio'

let _twilio: ReturnType<typeof Twilio> | null = null

export function getTwilio() {
  if (!_twilio) {
    _twilio = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
  }
  return _twilio
}
