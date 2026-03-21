import { test, expect } from '@playwright/test'
import { navigateToFirstRestaurant, getMenuItemId, getEateryIdFromUrl } from '../helpers'

test.describe('Guest order API', () => {
  let eateryId: string
  let menuItemId: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const url = await navigateToFirstRestaurant(page)
    eateryId = getEateryIdFromUrl(url)
    menuItemId = await getMenuItemId(page)
    await page.close()
  })

  test('creates a guest order', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        eatery_id: eateryId,
        items: [{ menu_item_id: menuItemId, quantity: 2 }],
        guest_name: 'Test Guest',
        guest_phone: '+12125551234',
        guest_stripe_pm_id: 'pm_abc123',
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('pending')
    expect(body.total_cents).toBeGreaterThan(0)
    expect(body.guest_name).toBe('Test Guest')
  })

  test('rejects order with missing guest fields', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        eatery_id: eateryId,
        items: [{ menu_item_id: menuItemId, quantity: 1 }],
      },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects order with invalid eatery', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        eatery_id: '00000000-0000-0000-0000-000000000000',
        items: [{ menu_item_id: menuItemId, quantity: 1 }],
        guest_name: 'Test',
        guest_phone: '+12125551234',
        guest_stripe_pm_id: 'pm_abc123',
      },
    })
    expect(res.status()).toBe(404)
  })

  test('GET /api/orders requires authentication', async ({ request }) => {
    const res = await request.get('/api/orders')
    expect(res.status()).toBe(401)
  })
})
