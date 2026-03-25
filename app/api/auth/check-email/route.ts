import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { apiError, apiSuccess } from '@/lib/api/helpers'

const querySchema = z.object({
  email: z.string().email(),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    email: request.nextUrl.searchParams.get('email'),
  })

  if (!parsed.success) {
    return apiError('Invalid email address', 400)
  }

  // Fixed-deadline delay to mitigate timing-based email enumeration.
  // The response always takes >= 300ms regardless of DB lookup speed.
  // NOTE: This endpoint intentionally reveals email existence to drive the
  // sign-in vs sign-up UX split. IP-based rate limiting should be added
  // when a rate-limiting infrastructure is in place to prevent bulk enumeration.
  const deadline = new Promise((r) => setTimeout(r, 300))

  const serviceClient = createServiceClient()
  const [result] = await Promise.all([
    serviceClient.rpc('check_email_exists', { lookup_email: parsed.data.email }),
    deadline,
  ])

  if (result.error) {
    return apiError('Unable to verify email', 500)
  }

  return apiSuccess({ exists: result.data as boolean })
}
