import { test, expect } from '@playwright/test'

test.describe('Home page — restaurant card grid', () => {
  test('renders exactly 4 restaurant cards', async ({ page }) => {
    await page.goto('/')

    // Wait for any card to appear (server-rendered, so should be immediate)
    const cards = page.locator('button[type="button"]')
    await expect(cards).toHaveCount(4, { timeout: 10000 })
  })

  test('each card shows a gray image placeholder and a restaurant name', async ({ page }) => {
    await page.goto('/')

    const cards = page.locator('button[type="button"]')
    await expect(cards).toHaveCount(4, { timeout: 10000 })

    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i)
      // Image placeholder div
      await expect(card.locator('div')).toBeVisible()
      // Name paragraph
      const name = card.locator('p')
      await expect(name).toBeVisible()
      const text = await name.textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('cards have expected restaurant names from seed', async ({ page }) => {
    await page.goto('/')

    const names = await page.locator('button[type="button"] p').allTextContents()
    const trimmed = names.map((n) => n.trim())

    expect(trimmed).toContain("Joe's Pizza")
    expect(trimmed).toContain('Sushi Palace')
    expect(trimmed).toContain('Burger Barn')
    expect(trimmed).toContain('Taco Fiesta')
  })

  test('page has no other UI elements — only the card grid', async ({ page }) => {
    await page.goto('/')

    // No h1/header/nav/footer
    await expect(page.locator('header')).toHaveCount(0)
    await expect(page.locator('nav')).toHaveCount(0)
    await expect(page.locator('footer')).toHaveCount(0)
  })

  test('cards are clickable and show pointer cursor', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.locator('button[type="button"]').first()
    await expect(firstCard).toBeVisible()

    const cursor = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).cursor
    )
    expect(cursor).toBe('pointer')
  })

  test('full page screenshot', async ({ page }) => {
    await page.goto('/')
    await page.locator('button[type="button"]').first().waitFor({ timeout: 10000 })
    await page.screenshot({ path: 'tests/e2e/screenshots/home.png', fullPage: true })
  })
})
