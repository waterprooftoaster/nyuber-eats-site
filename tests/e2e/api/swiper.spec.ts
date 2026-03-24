import { test, expect } from '@playwright/test'

test.describe('Swiper API — unauthenticated', () => {
  test('GET /api/swiper/pending returns 401', async ({ request }) => {
    const res = await request.get('/api/swiper/pending')
    expect(res.status()).toBe(401)
  })
})
