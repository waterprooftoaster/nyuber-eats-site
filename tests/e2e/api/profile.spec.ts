import { test, expect } from '@playwright/test'

test.describe('PATCH /api/profile — unauthenticated', () => {
  test('returns 401 without auth', async ({ request }) => {
    const res = await request.patch('/api/profile', {
      data: { school_id: '00000000-0000-0000-0000-000000000001' },
    })
    expect(res.status()).toBe(401)
  })

  test('returns 400 with empty body', async ({ request }) => {
    const res = await request.patch('/api/profile', { data: {} })
    expect(res.status()).toBe(400)
  })

  test('returns 400 with invalid uuid school_id', async ({ request }) => {
    const res = await request.patch('/api/profile', {
      data: { school_id: 'not-a-uuid' },
    })
    expect(res.status()).toBe(400)
  })
})
