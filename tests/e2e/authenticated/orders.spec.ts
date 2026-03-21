import { test, expect } from '@playwright/test'
import { navigateToFirstRestaurant, getMenuItemId, getEateryIdFromUrl } from '../helpers'

test.describe('Authenticated orders', () => {
  let eateryId: string
  let menuItemId: string

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: '.auth/user.json',
    })
    const page = await context.newPage()
    const url = await navigateToFirstRestaurant(page)
    eateryId = getEateryIdFromUrl(url)
    menuItemId = await getMenuItemId(page)
    await page.close()
    await context.close()
  })

  test('create order as logged-in user', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        eatery_id: eateryId,
        items: [{ menu_item_id: menuItemId, quantity: 1 }],
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('pending')
    expect(body.orderer_id).toBeTruthy()
    expect(body.total_cents).toBeGreaterThan(0)
  })

  test('list own orders', async ({ request }) => {
    const res = await request.get('/api/orders?role=orderer')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(1)
  })
})
