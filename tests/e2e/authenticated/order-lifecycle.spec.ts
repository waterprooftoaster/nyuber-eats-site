import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test@goobereats.test'
const FAKE_UUID = '00000000-0000-4000-8000-000000000099'

let userId: string
let orderId: string

test.describe('Order Lifecycle', () => {
  test.beforeAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    await supabase.rpc('seed_dev_eateries')

    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .limit(1)
      .single()
    if (!school) throw new Error('No schools found')

    const { data: eatery } = await supabase
      .from('eateries')
      .select('id')
      .eq('school_id', school.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (!eatery) throw new Error('No eateries found')

    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('id, name, original_price_cents')
      .eq('restaurant_id', eatery.id)
      .eq('is_available', true)
      .limit(1)
      .single()
    if (!menuItem) throw new Error('No menu items found')

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find((u) => u.email === TEST_EMAIL)
    if (!user) throw new Error('Test user not found')
    userId = user.id

    await supabase
      .from('profiles')
      .update({ is_swiper: true, school_id: school.id })
      .eq('id', userId)

    await supabase
      .from('stripe_accounts')
      .upsert(
        { user_id: userId, stripe_account_id: 'acct_lifecycle_test', onboarding_complete: true },
        { onConflict: 'user_id' }
      )

    // Insert test order directly — no guest_stripe_pm_id so auto-charge won't fire
    const { data: order } = await supabase
      .from('orders')
      .insert({
        eatery_id: eatery.id,
        orderer_id: null,
        swiper_id: null,
        status: 'pending',
        items: [
          {
            menu_item_id: menuItem.id,
            name: menuItem.name,
            price_cents: menuItem.original_price_cents,
            quantity: 1,
          },
        ],
        total_cents: menuItem.original_price_cents,
        tip_cents: 0,
        guest_name: 'Lifecycle Test',
        guest_phone: '+15005550006',
      })
      .select('id')
      .single()
    if (!order) throw new Error('Failed to create test order')
    orderId = order.id
  })

  test.afterAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    if (orderId) {
      await supabase.from('orders').delete().eq('id', orderId)
    }
    await supabase.from('stripe_accounts').delete().eq('user_id', userId)
    await supabase
      .from('profiles')
      .update({ is_swiper: false })
      .eq('id', userId)
  })

  test('full order lifecycle: pending → accept → in_progress → completed', async ({ request }) => {
    // Pending order appears in queue
    const pendingRes = await request.get('/api/swiper/pending')
    expect(pendingRes.status()).toBe(200)
    const pendingBody = await pendingRes.json()
    expect(Array.isArray(pendingBody)).toBe(true)
    expect(pendingBody.some((o: { id: string }) => o.id === orderId)).toBe(true)

    // Accept
    const acceptRes = await request.fetch(`/api/orders/${orderId}/accept`, { method: 'PATCH' })
    expect(acceptRes.status()).toBe(200)
    const acceptBody = await acceptRes.json()
    expect(acceptBody.status).toBe('accepted')

    // Accept again → 409 race condition
    const dupRes = await request.fetch(`/api/orders/${orderId}/accept`, { method: 'PATCH' })
    expect(dupRes.status()).toBe(409)

    // Advance to in_progress
    const ipRes = await request.fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      data: { status: 'in_progress' },
    })
    expect(ipRes.status()).toBe(200)

    // Invalid transition: in_progress → pending
    const invalidRes = await request.fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      data: { status: 'pending' },
    })
    expect(invalidRes.status()).toBe(400)

    // Advance to completed
    const completeRes = await request.fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      data: { status: 'completed' },
    })
    expect(completeRes.status()).toBe(200)
    const completeBody = await completeRes.json()
    expect(completeBody.status).toBe('completed')
  })

  test('POST /api/orders/{id}/pay by swiper (not orderer) returns 403', async ({ request }) => {
    const res = await request.post(`/api/orders/${orderId}/pay`)
    expect(res.status()).toBe(403)
  })

  test('PATCH /api/orders/{unknown-id}/status returns 404', async ({ request }) => {
    const res = await request.fetch(`/api/orders/${FAKE_UUID}/status`, {
      method: 'PATCH',
      data: { status: 'in_progress' },
    })
    expect(res.status()).toBe(404)
  })
})
