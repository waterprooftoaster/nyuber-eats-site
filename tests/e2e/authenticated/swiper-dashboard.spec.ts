import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test@goobereats.test'

test.describe('Swiper Dashboard', () => {
  test.beforeAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    await supabase.rpc('seed_dev_eateries')
    const { data: schools } = await supabase
      .from('schools')
      .select('id')
      .limit(1)
      .single()
    if (!schools) throw new Error('No schools found')

    const { data: existing } = await supabase.auth.admin.listUsers()
    const user = existing?.users?.find((u) => u.email === TEST_EMAIL)
    if (!user) throw new Error('Test user not found')

    await supabase
      .from('profiles')
      .update({ is_swiper: true, school_id: schools.id })
      .eq('id', user.id)
  })

  test.afterAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    const { data: existing } = await supabase.auth.admin.listUsers()
    const user = existing?.users?.find((u) => u.email === TEST_EMAIL)
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_swiper: false })
        .eq('id', user.id)
    }
  })

  test.describe('API: GET /api/swiper/earnings', () => {
    test('returns 200 with earnings shape', async ({ request }) => {
      const res = await request.get('/api/swiper/earnings')
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(typeof body.total_earned_cents).toBe('number')
      expect(typeof body.completed_order_count).toBe('number')
    })
  })

  test.describe('API: GET /api/swiper/orders', () => {
    test('returns 200 with orders array', async ({ request }) => {
      const res = await request.get('/api/swiper/orders')
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.orders)).toBe(true)
      expect(typeof body.page).toBe('number')
      expect(typeof body.limit).toBe('number')
      expect(typeof body.total).toBe('number')
    })

    test('respects pagination params', async ({ request }) => {
      const res = await request.get('/api/swiper/orders?page=1&limit=5')
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.limit).toBe(5)
      expect(body.page).toBe(1)
    })
  })

  test.describe('Dashboard page', () => {
    test('loads /swiper/dashboard and shows Earnings heading', async ({ page }) => {
      await page.goto('/swiper/dashboard')
      await expect(page.getByText('Earnings')).toBeVisible()
    })

    test('sidebar shows Swiper Dashboard link', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('link', { name: /swiper dashboard/i })).toBeVisible()
    })
  })
})
