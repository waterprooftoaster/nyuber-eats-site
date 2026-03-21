import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('renders restaurant cards', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('[data-testid="restaurant-card"]')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
  })

  test('cards show seeded eatery names', async ({ page }) => {
    await page.goto('/')
    const expectedNames = ["Joe's Pizza", 'Sushi Palace', 'Burger Barn', 'Taco Fiesta']
    for (const name of expectedNames) {
      await expect(page.getByText(name).first()).toBeVisible()
    }
  })

  test('clicking a card navigates to restaurant page', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('[data-testid="restaurant-card"]').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()
    await page.waitForURL(/\/restaurant\/[0-9a-f-]+/, { timeout: 10000 })
  })
})
